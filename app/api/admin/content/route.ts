import { getAdminIdentity } from "../../../../lib/admin-auth";
import { applyCommentOverrides, contentOverrides } from "../../../../lib/content-overrides";
import { db, databaseEnabled, ensureSchema } from "../../../../lib/db";
import { editorialComments, editorialPost } from "../../../../lib/editorial";
import { getPublicPosts } from "../../../../lib/public-posts";
import { rateLimit } from "../../../../lib/rate-limit";
import { hasPii } from "../../../../lib/safety";
import { supplementalComments } from "../../../../lib/supplemental-comments";

export const dynamic = "force-dynamic";

async function requireSuperadmin(request: Request) {
  const identity = await getAdminIdentity(request);
  return identity?.role === "superadmin" ? identity : null;
}

export async function GET(request: Request) {
  const limit = rateLimit(request, "admin-content", 20, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "관리 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  if (!await requireSuperadmin(request)) return Response.json({ error: "주관리자 권한이 필요합니다." }, { status: 403 });
  await ensureSchema();
  const [posts, overrides, rows] = await Promise.all([
    getPublicPosts(),
    contentOverrides(),
    db()`SELECT id, post_id, content, display_name, created_at FROM comments WHERE status = 'approved' ORDER BY created_at ASC`,
  ]);
  const storedByPost = new Map<string, Array<{ id: string; body: string; displayName: string; createdAt: string }>>();
  for (const row of rows) {
    const postId = String(row.post_id);
    const comments = storedByPost.get(postId) || [];
    comments.push({ id: String(row.id), body: String(row.content), displayName: String(row.display_name || "익명"), createdAt: new Date(String(row.created_at)).toISOString() });
    storedByPost.set(postId, comments);
  }
  const content = posts.map((post) => {
    const base = editorialPost(post.id) ? editorialComments(post.id) : supplementalComments(post);
    const merged = new Map(base.map((comment) => [String(comment.id), comment]));
    for (const comment of storedByPost.get(post.id) || []) merged.set(comment.id, comment);
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      createdAt: post.createdAt,
      comments: applyCommentOverrides([...merged.values()], overrides).map((comment) => ({
        id: String(comment.id),
        body: comment.body,
        displayName: comment.displayName || "익명",
        createdAt: comment.createdAt,
      })),
    };
  });
  return Response.json({ content }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  const limit = rateLimit(request, "admin-content-write", 60, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "관리 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  if (!await requireSuperadmin(request)) return Response.json({ error: "주관리자 권한이 필요합니다." }, { status: 403 });
  const payload = await request.json().catch(() => ({})) as {
    entity?: "post" | "comment";
    action?: "update" | "delete";
    id?: string;
    postId?: string;
    title?: string;
    content?: string;
    category?: string;
    displayName?: string;
  };
  const id = payload.id?.trim() || "";
  if (!id || !payload.entity || !payload.action || !["post", "comment"].includes(payload.entity) || !["update", "delete"].includes(payload.action)) {
    return Response.json({ error: "수정할 항목을 확인해주세요." }, { status: 400 });
  }
  await ensureSchema();
  if (payload.action === "delete") {
    await db()`
      INSERT INTO admin_content_overrides (kind, id, post_id, hidden)
      VALUES (${payload.entity}, ${id}, ${payload.postId || ""}, TRUE)
      ON CONFLICT (kind, id) DO UPDATE SET post_id = EXCLUDED.post_id, hidden = TRUE, updated_at = NOW()`;
    return Response.json({ ok: true, deleted: true }, { headers: { "cache-control": "no-store" } });
  }
  if (payload.entity === "post") {
    const title = payload.title?.trim() || "";
    const content = payload.content?.trim() || "";
    const category = payload.category?.trim() || "";
    if (title.length < 2 || title.length > 80 || content.length < 2 || content.length > 2000 || !["일상", "관계", "직장", "돈", "사회", "제안", "질문"].includes(category) || hasPii(`${title} ${content}`)) {
      return Response.json({ error: "개인정보를 제거하고 제목·본문·분류를 확인해주세요." }, { status: 400 });
    }
    await db()`
      INSERT INTO admin_content_overrides (kind, id, post_id, title, content, category, hidden)
      VALUES ('post', ${id}, ${id}, ${title}, ${content}, ${category}, FALSE)
      ON CONFLICT (kind, id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, category = EXCLUDED.category, hidden = FALSE, updated_at = NOW()`;
    return Response.json({ ok: true, title, content, category }, { headers: { "cache-control": "no-store" } });
  }
  const content = payload.content?.trim() || "";
  const displayName = (payload.displayName?.trim() || "익명").slice(0, 12);
  if (!payload.postId || content.length < 2 || content.length > 2000 || hasPii(content)) {
    return Response.json({ error: "개인정보를 제거하고 댓글 내용을 확인해주세요." }, { status: 400 });
  }
  await db()`
    INSERT INTO admin_content_overrides (kind, id, post_id, content, display_name, hidden)
    VALUES ('comment', ${id}, ${payload.postId}, ${content}, ${displayName}, FALSE)
    ON CONFLICT (kind, id) DO UPDATE SET post_id = EXCLUDED.post_id, content = EXCLUDED.content, display_name = EXCLUDED.display_name, hidden = FALSE, updated_at = NOW()`;
  return Response.json({ ok: true, content, displayName }, { headers: { "cache-control": "no-store" } });
}
