import { db, databaseEnabled, ensureSchema, hash, token } from "../../../lib/db";
import { editorialComments, editorialPost, editorialPosts } from "../../../lib/editorial";
import { supplementalComments } from "../../../lib/supplemental-comments";
import { hasPii } from "../../../lib/safety";
import { reviewSubmission } from "../../../lib/ai-review";
import { generateCoreTitle } from "../../../lib/title";
import { dedupePosts, isDuplicatePost } from "../../../lib/dedup";
import { rateLimit } from "../../../lib/rate-limit";
import { verifyReviewToken } from "../../../lib/review-token";
import { applyPostOverride, contentOverrides, hiddenCommentCounts } from "../../../lib/content-overrides";
import { generateAutoCommentBodies, storeAutoComments } from "../../../lib/auto-comments";

export const dynamic = "force-dynamic";

function cleanRow(row: Record<string, unknown>) {
  return {
    id: String(row.id), title: String(row.title), content: String(row.content), category: String(row.category),
    createdAt: new Date(String(row.created_at)).toISOString(), heard: Number(row.heard), same: Number(row.same),
    support: Number(row.support), commentCount: Number(row.stored_comment_count ?? row.comment_count ?? 0),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.trim() || "전체";
  const query = url.searchParams.get("q")?.trim().toLocaleLowerCase("ko-KR") || "";
  const sort = url.searchParams.get("sort") === "popular" ? "popular" : "latest";
  let stored: ReturnType<typeof cleanRow>[] = [];
  const overrides = await contentOverrides();
  if (databaseEnabled()) {
    await ensureSchema();
    const rows = await db()`
      SELECT post.id, post.title, post.content, post.category, post.created_at,
             post.heard, post.same, post.support,
             COUNT(comment.id)::INTEGER AS stored_comment_count,
             EXISTS (
               SELECT 1 FROM comments AS auto_comment
               WHERE auto_comment.post_id = post.id AND auto_comment.id LIKE 'jinju-auto-%'
             ) AS has_auto_comments
      FROM posts AS post
      LEFT JOIN comments AS comment
        ON comment.post_id = post.id AND comment.status = 'approved' AND comment.created_at <= NOW()
      WHERE post.status = 'approved'
      GROUP BY post.id
      ORDER BY post.created_at DESC
      LIMIT 100`;
    stored = rows.map((row: Record<string, unknown>) => {
      const post = cleanRow(row);
      const baseCount = editorialPost(post.id)
        ? editorialComments(post.id).length
        : Boolean(row.has_auto_comments) ? 0 : supplementalComments(post).length;
      return { ...post, commentCount: post.commentCount + baseCount };
    });
  }
  const byId = new Map(editorialPosts.map((post) => [post.id, { ...post, commentCount: editorialComments(post.id).length }]));
  for (const post of stored) byId.set(post.id, post);
  const hiddenCounts = hiddenCommentCounts(overrides);
  let posts = dedupePosts([...byId.values()])
    .flatMap((post) => {
      const visible = applyPostOverride(post, overrides);
      return visible ? [{ ...visible, commentCount: Math.max(0, visible.commentCount - (hiddenCounts.get(visible.id) || 0)) }] : [];
    })
    .filter((post) => category === "전체" || post.category === category);
  if (query) posts = posts.filter((post) => `${post.title} ${post.content} ${post.category}`.toLocaleLowerCase("ko-KR").includes(query));
  posts.sort((a, b) => sort === "popular"
    ? (b.heard + b.same + b.commentCount * 3) - (a.heard + a.same + a.commentCount * 3)
    : Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return Response.json({ posts: posts.slice(0, 100), total: posts.length, database: databaseEnabled() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const limit = await rateLimit(request, "post", 6, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "짧은 시간에 등록 요청이 많았습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const payload = await request.json() as { title?: string; content?: string; category?: string; acceptReviewHold?: boolean; reviewToken?: string };
  const content = payload.content?.trim() ?? "";
  const title = (payload.title?.trim() || generateCoreTitle(content)).slice(0, 80);
  const category = payload.category?.trim() || "일상";
  const allowed = ["일상", "관계", "직장", "돈", "사회", "제안", "질문"];
  if (!allowed.includes(category) || title.length < 2 || content.length < 8 || content.length > 2000 || hasPii(`${title} ${content}`)) {
    return Response.json({ error: "개인정보를 제거하고 제목 2~80자, 본문 8~2,000자로 작성해주세요." }, { status: 400 });
  }
  const autoCommentBodies = generateAutoCommentBodies({
    id: "pending",
    title,
    content,
    category,
    createdAt: new Date().toISOString(),
  });
  const review = await verifyReviewToken(payload.reviewToken || "", title, content, category)
    || await reviewSubmission(title, content);
  if (review.containsPii) {
    return Response.json({
      error: "개인정보는 보류 상태로도 저장할 수 없습니다. 이름·연락처·주소·계정 정보를 지워주세요.",
      status: "revision_required",
      review,
    }, { status: 422 });
  }
  if (review.decision === "revise" && !payload.acceptReviewHold) {
    return Response.json({ status: "revision_required", review }, { status: 422 });
  }
  await ensureSchema();
  const existingRows = await db()`SELECT title, content FROM posts WHERE status IN ('approved','pending') ORDER BY created_at DESC LIMIT 500`;
  const existingPosts = [
    ...editorialPosts,
    ...existingRows.map((row: Record<string, unknown>) => ({ title: String(row.title), content: String(row.content) })),
  ];
  if (existingPosts.some((post) => isDuplicatePost({ title, content }, post))) {
    return Response.json({ error: "이미 같은 제목이 있거나 본문이 90% 이상 비슷한 의견입니다. 기존 글에 댓글로 참여해주세요." }, { status: 409 });
  }
  const id = token(10);
  const deleteKey = token(16);
  const status = review.decision === "allow" ? "approved" : "pending";
  const inserted = await db()`
    INSERT INTO posts (
      id, title, content, category, delete_key_hash, status, risk_level,
      review_issues, review_explanation, review_source
    ) VALUES (
      ${id}, ${title}, ${content}, ${category}, ${await hash(deleteKey)}, ${status}, ${review.riskLevel},
      ${review.detectedIssues.join(" · ")}, ${review.explanation}, ${review.source}
    )
    RETURNING created_at`;
  await storeAutoComments({
    id,
    title,
    content,
    category,
    createdAt: new Date(String(inserted[0]?.created_at || Date.now())).toISOString(),
  }, await autoCommentBodies).catch(() => false);
  return Response.json({ id, deleteKey, status, review }, {
    status: status === "approved" ? 201 : 202,
    headers: { "cache-control": "no-store" },
  });
}
