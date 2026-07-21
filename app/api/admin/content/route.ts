import { getAdminIdentity, hasValidMutationOrigin } from "../../../../lib/admin-auth";
import { contentOverrides } from "../../../../lib/content-overrides";
import { db, databaseEnabled, ensureSchema, hash, token } from "../../../../lib/db";
import { editorialComments, editorialPost, editorialPosts } from "../../../../lib/editorial";
import { rateLimit } from "../../../../lib/rate-limit";
import { hasPii } from "../../../../lib/safety";
import { supplementalComments } from "../../../../lib/supplemental-comments";

export const dynamic = "force-dynamic";

const CATEGORIES = ["일상", "관계", "직장", "돈", "사회", "제안", "질문"];
const POST_ACTIONS = ["update", "approve", "reject", "hide", "delete", "restore", "set-reactions"] as const;
const COMMENT_ACTIONS = ["create", "update", "hide", "delete", "restore"] as const;

async function requireAdmin(request: Request) {
  return getAdminIdentity(request);
}

function iso(value: unknown) {
  return new Date(String(value)).toISOString();
}

async function storeEditorialPost(id: string) {
  let rows = await db()`SELECT id FROM posts WHERE id = ${id} LIMIT 1`;
  if (rows[0]) return true;
  const fallback = editorialPost(id);
  if (!fallback) return false;
  await db()`
    INSERT INTO posts (
      id, title, content, category, mode, visibility, risk_level, status,
      delete_key_hash, heard, same, support, comment_count, created_at, updated_at
    ) VALUES (
      ${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category}, ${fallback.mode || "털어놓기"},
      'public', 'low', 'approved', ${await hash(`editorial:${fallback.id}`)}, ${fallback.heard}, ${fallback.same},
      ${fallback.support}, 0, ${fallback.createdAt}, ${fallback.updatedAt || fallback.createdAt}
    ) ON CONFLICT (id) DO NOTHING`;
  rows = await db()`SELECT id FROM posts WHERE id = ${id} LIMIT 1`;
  return Boolean(rows[0]);
}

async function refreshCommentCount(postId: string) {
  await db()`
    UPDATE posts
    SET comment_count = (
      SELECT COUNT(*)::INTEGER FROM comments
      WHERE post_id = ${postId} AND status = 'approved' AND created_at <= NOW()
    ), updated_at = NOW()
    WHERE id = ${postId}`;
}

export async function GET(request: Request) {
  const limit = await rateLimit(request, "admin-content", 40, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "관리 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const identity = await requireAdmin(request);
  if (!identity) return Response.json({ error: "운영자 로그인이 필요합니다." }, { status: 401 });
  await ensureSchema();

  const [postRows, commentRows, overrides] = await Promise.all([
    db()`
      SELECT id, title, content, category, visibility, risk_level, status, heard, same,
             review_issues, review_explanation, review_source, created_at, updated_at, reviewed_at
      FROM posts
      ORDER BY created_at DESC
      LIMIT 1000`,
    db()`
      SELECT id, post_id, content, display_name, status, created_at
      FROM comments
      ORDER BY created_at ASC
      LIMIT 10000`,
    contentOverrides(),
  ]);

  const storedPosts = new Map<string, Record<string, unknown>>();
  for (const row of postRows) storedPosts.set(String(row.id), row as Record<string, unknown>);
  const allIds = new Set([...editorialPosts.map((post) => post.id), ...storedPosts.keys()]);
  const storedComments = new Map<string, Array<Record<string, unknown>>>();
  for (const row of commentRows) {
    const postId = String(row.post_id);
    const list = storedComments.get(postId) || [];
    list.push(row as Record<string, unknown>);
    storedComments.set(postId, list);
  }

  const content = [...allIds].map((id) => {
    const row = storedPosts.get(id);
    const fallback = editorialPost(id);
    if (!row && !fallback) return null;
    const override = overrides.get(`post:${id}`);
    const title = override?.title ?? (row ? String(row.title) : fallback!.title);
    const body = override?.content ?? (row ? String(row.content) : fallback!.content);
    const category = override?.category ?? (row ? String(row.category) : fallback!.category);
    const status = override?.hidden ? "hidden" : row ? String(row.status) : "approved";
    const createdAt = row ? iso(row.created_at) : fallback!.createdAt;
    const baseComments = fallback
      ? editorialComments(id)
      : status === "approved" && !(storedComments.get(id) || []).some((comment) => String(comment.id).startsWith("jinju-auto-"))
        ? supplementalComments({ id, title, content: body, category, createdAt })
        : [];
    const merged = new Map<string, {
      id: string; body: string; displayName: string; createdAt: string; status: string; source: string;
    }>();
    for (const comment of baseComments) merged.set(String(comment.id), {
      id: String(comment.id), body: comment.body, displayName: comment.displayName,
      createdAt: comment.createdAt, status: "approved", source: fallback ? "editorial" : "supplemental",
    });
    for (const comment of storedComments.get(id) || []) merged.set(String(comment.id), {
      id: String(comment.id), body: String(comment.content), displayName: String(comment.display_name || "익명"),
      createdAt: iso(comment.created_at), status: String(comment.status), source: "database",
    });
    const comments = [...merged.values()].map((comment) => {
      const commentOverride = overrides.get(`comment:${comment.id}`);
      return {
        ...comment,
        body: commentOverride?.content ?? comment.body,
        displayName: commentOverride?.displayName ?? comment.displayName,
        status: commentOverride?.hidden ? "hidden" : comment.status,
        scheduled: comment.status === "approved" && Date.parse(comment.createdAt) > Date.now(),
      };
    });
    return {
      id,
      title,
      content: body,
      category,
      visibility: row ? String(row.visibility) : "public",
      status,
      riskLevel: row ? String(row.risk_level) : "low",
      issues: row ? String(row.review_issues || "").split(" · ").filter(Boolean) : [],
      explanation: row ? String(row.review_explanation || "") : "",
      reviewSource: row ? String(row.review_source || "rules") : "editorial",
      createdAt,
      updatedAt: row ? iso(row.updated_at) : fallback!.updatedAt || fallback!.createdAt,
      heard: row ? Number(row.heard) : fallback!.heard,
      same: row ? Number(row.same) : fallback!.same,
      source: row ? "database" : "editorial",
      comments,
    };
  }).filter(Boolean).sort((left, right) => {
    const a = left!;
    const b = right!;
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });

  const summary = {
    total: content.length,
    pending: content.filter((post) => post?.status === "pending").length,
    approved: content.filter((post) => post?.status === "approved").length,
    hidden: content.filter((post) => ["hidden", "deleted"].includes(post?.status || "")).length,
    rejected: content.filter((post) => post?.status === "rejected").length,
    comments: content.reduce((sum, post) => sum + (post?.comments.length || 0), 0),
  };
  return Response.json({ content, summary, identity }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  const limit = await rateLimit(request, "admin-content-write", 100, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "관리 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!hasValidMutationOrigin(request)) return Response.json({ error: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  if (!await requireAdmin(request)) return Response.json({ error: "운영자 로그인이 필요합니다." }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as {
    entity?: "post" | "comment";
    action?: string;
    id?: string;
    postId?: string;
    title?: string;
    content?: string;
    category?: string;
    visibility?: string;
    displayName?: string;
    heard?: number;
    same?: number;
  };
  const id = payload.id?.trim() || "";
  if (!payload.entity || !payload.action || !["post", "comment"].includes(payload.entity)) {
    return Response.json({ error: "관리할 항목을 확인해주세요." }, { status: 400 });
  }
  if (payload.entity === "post" && (!id || !POST_ACTIONS.includes(payload.action as typeof POST_ACTIONS[number]))) {
    return Response.json({ error: "게시글과 처리 방식을 확인해주세요." }, { status: 400 });
  }
  if (payload.entity === "comment" && (!COMMENT_ACTIONS.includes(payload.action as typeof COMMENT_ACTIONS[number]) || (payload.action !== "create" && !id))) {
    return Response.json({ error: "댓글과 처리 방식을 확인해주세요." }, { status: 400 });
  }
  await ensureSchema();

  if (payload.entity === "post" && payload.action === "set-reactions") {
    const heard = Number(payload.heard);
    const same = Number(payload.same);
    if (!Number.isSafeInteger(heard) || !Number.isSafeInteger(same) || heard < 0 || same < 0) {
      return Response.json({ error: "반응 수는 0 이상의 정수로 입력해주세요." }, { status: 400 });
    }
    if (!await storeEditorialPost(id)) return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    await db()`UPDATE posts SET heard = ${heard}, same = ${same}, updated_at = NOW() WHERE id = ${id}`;
    return Response.json({ ok: true, heard, same }, { headers: { "cache-control": "no-store" } });
  }

  if (payload.entity === "post" && payload.action === "update") {
    const title = payload.title?.trim() || "";
    const body = payload.content?.trim() || "";
    const category = payload.category?.trim() || "";
    const visibility = payload.visibility === "private" ? "private" : "public";
    if (title.length < 2 || title.length > 80 || body.length < 2 || body.length > 2000 || !CATEGORIES.includes(category) || hasPii(`${title} ${body}`)) {
      return Response.json({ error: "개인정보를 제거하고 제목·본문·분류를 확인해주세요." }, { status: 400 });
    }
    const rows = await db()`SELECT id FROM posts WHERE id = ${id} LIMIT 1`;
    if (rows[0]) {
      await db()`UPDATE posts SET title = ${title}, content = ${body}, category = ${category}, visibility = ${visibility}, updated_at = NOW() WHERE id = ${id}`;
      await db()`DELETE FROM admin_content_overrides WHERE kind = 'post' AND id = ${id}`;
    } else if (editorialPost(id)) {
      await storeEditorialPost(id);
      await db()`UPDATE posts SET title = ${title}, content = ${body}, category = ${category}, visibility = ${visibility}, updated_at = NOW() WHERE id = ${id}`;
      await db()`DELETE FROM admin_content_overrides WHERE kind = 'post' AND id = ${id}`;
    } else return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  }

  if (payload.entity === "post") {
    if (!await storeEditorialPost(id)) return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    const nextStatus = payload.action === "approve" || payload.action === "restore" ? "approved"
      : payload.action === "reject" ? "rejected"
        : payload.action === "hide" ? "hidden" : "deleted";
    await db()`UPDATE posts SET status = ${nextStatus}, reviewed_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
    await db()`DELETE FROM admin_content_overrides WHERE kind = 'post' AND id = ${id}`;
    return Response.json({ ok: true, status: nextStatus }, { headers: { "cache-control": "no-store" } });
  }

  const postId = payload.postId?.trim() || "";
  if (!postId) return Response.json({ error: "댓글이 속한 게시글을 확인해주세요." }, { status: 400 });
  if (payload.action === "create") {
    const body = payload.content?.trim() || "";
    const displayName = (payload.displayName?.trim() || "익명").slice(0, 12);
    if (body.length < 2 || body.length > 2000 || hasPii(body)) return Response.json({ error: "개인정보를 제거하고 댓글 내용을 확인해주세요." }, { status: 400 });
    if (!await storeEditorialPost(postId)) return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    const commentId = token(10);
    await db()`INSERT INTO comments (id, post_id, content, display_name, status, delete_key_hash) VALUES (${commentId}, ${postId}, ${body}, ${displayName}, 'approved', ${await hash(`admin:${commentId}`)})`;
    await refreshCommentCount(postId);
    return Response.json({ ok: true, id: commentId }, { headers: { "cache-control": "no-store" } });
  }
  if (payload.action === "update") {
    const body = payload.content?.trim() || "";
    const displayName = (payload.displayName?.trim() || "익명").slice(0, 12);
    if (body.length < 2 || body.length > 2000 || hasPii(body)) return Response.json({ error: "개인정보를 제거하고 댓글 내용을 확인해주세요." }, { status: 400 });
    const rows = await db()`SELECT id FROM comments WHERE id = ${id} AND post_id = ${postId} LIMIT 1`;
    if (rows[0]) {
      await db()`UPDATE comments SET content = ${body}, display_name = ${displayName} WHERE id = ${id} AND post_id = ${postId}`;
      await db()`DELETE FROM admin_content_overrides WHERE kind = 'comment' AND id = ${id}`;
    } else {
      await db()`
        INSERT INTO admin_content_overrides (kind, id, post_id, content, display_name, hidden)
        VALUES ('comment', ${id}, ${postId}, ${body}, ${displayName}, FALSE)
        ON CONFLICT (kind, id) DO UPDATE SET post_id = EXCLUDED.post_id, content = EXCLUDED.content, display_name = EXCLUDED.display_name, hidden = FALSE, updated_at = NOW()`;
    }
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  }
  const rows = await db()`SELECT id FROM comments WHERE id = ${id} AND post_id = ${postId} LIMIT 1`;
  if (rows[0]) {
    const nextStatus = payload.action === "restore" ? "approved" : payload.action === "hide" ? "hidden" : "deleted";
    await db()`UPDATE comments SET status = ${nextStatus} WHERE id = ${id} AND post_id = ${postId}`;
    await db()`DELETE FROM admin_content_overrides WHERE kind = 'comment' AND id = ${id}`;
    await refreshCommentCount(postId);
    return Response.json({ ok: true, status: nextStatus }, { headers: { "cache-control": "no-store" } });
  }
  const hidden = payload.action !== "restore";
  await db()`
    INSERT INTO admin_content_overrides (kind, id, post_id, hidden)
    VALUES ('comment', ${id}, ${postId}, ${hidden})
    ON CONFLICT (kind, id) DO UPDATE SET post_id = EXCLUDED.post_id, hidden = EXCLUDED.hidden, updated_at = NOW()`;
  return Response.json({ ok: true, status: hidden ? "hidden" : "approved" }, { headers: { "cache-control": "no-store" } });
}
