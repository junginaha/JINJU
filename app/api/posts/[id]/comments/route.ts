import { db, databaseEnabled, ensureSchema, hash, token } from "../../../../../lib/db";
import { editorialComments, editorialPost } from "../../../../../lib/editorial";
import { hasPii, reviewText } from "../../../../../lib/safety";
import { HIDDEN_DUPLICATE_POST_IDS } from "../../../../../lib/dedup";
import { supplementalComments } from "../../../../../lib/supplemental-comments";
import { applyCommentOverrides, contentOverrides } from "../../../../../lib/content-overrides";
import { getPublicPost } from "../../../../../lib/public-posts";
import { normalizeCommentTimes } from "../../../../../lib/comment-time";
import { rateLimit } from "../../../../../lib/rate-limit";
import { generateUniqueJinjuDisplayName } from "../../../../../lib/display-name";

export const dynamic = "force-dynamic";

type PublicComment = { id: string; body: string; displayName: string; createdAt: string };
function publicComment(comment: PublicComment): PublicComment {
  return { id: String(comment.id), body: String(comment.body), displayName: String(comment.displayName || "익명"), createdAt: String(comment.createdAt) };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (HIDDEN_DUPLICATE_POST_IDS.has(id)) return Response.json({ error: "게시물을 찾을 수 없습니다.", comments: [] }, { status: 404 });
  const publicPost = await getPublicPost(id);
  if (!publicPost) return Response.json({ error: "게시물을 찾을 수 없습니다.", comments: [] }, { status: 404 });
  const editorial = editorialPost(id);
  const fallback = editorialComments(id);
  const overrides = await contentOverrides();
  if (!databaseEnabled()) return editorial
    ? Response.json({ comments: normalizeCommentTimes(publicPost.createdAt, applyCommentOverrides(fallback, overrides)).map(publicComment) }, { headers: { "cache-control": "no-store" } })
    : Response.json({ error: "게시물을 찾을 수 없습니다.", comments: [] }, { status: 404 });
  await ensureSchema();
  const postRows = await db()`SELECT id, title, content, category, created_at FROM posts WHERE id = ${id} AND status = 'approved' AND visibility = 'public' LIMIT 1`;
  const row = postRows[0] as Record<string, unknown> | undefined;
  if (!row && !editorial) return Response.json({ error: "게시물을 찾을 수 없습니다.", comments: [] }, { status: 404 });
  const autoRows = editorial ? [] : await db()`
    SELECT id FROM comments
    WHERE post_id = ${id} AND id LIKE 'jinju-auto-%'
    LIMIT 1`;
  const baseComments = editorial
    ? fallback
    : autoRows[0] ? [] : supplementalComments({
      id: String(row?.id),
      title: String(row?.title),
      content: String(row?.content),
      category: String(row?.category),
      createdAt: new Date(String(row?.created_at)).toISOString(),
    });
  const rows = await db()`SELECT id, content, display_name, created_at FROM comments WHERE post_id = ${id} AND status = 'approved' AND created_at <= NOW() ORDER BY created_at ASC LIMIT 200`;
  const stored = rows.map((row: Record<string, unknown>) => ({ id: String(row.id), body: String(row.content), displayName: String(row.display_name || "익명"), createdAt: new Date(String(row.created_at)).toISOString() }));
  const merged = new Map(baseComments.map((comment) => [String(comment.id), comment]));
  for (const comment of stored) merged.set(String(comment.id), comment);
  const comments = normalizeCommentTimes(publicPost.createdAt, [...merged.values()]);
  return Response.json({ comments: applyCommentOverrides(comments, overrides).map(publicComment) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(request, "comment", 12, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "짧은 시간에 댓글 등록이 많았습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const { id: postId } = await context.params;
  if (HIDDEN_DUPLICATE_POST_IDS.has(postId)) return Response.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
  const publicPost = await getPublicPost(postId);
  if (!publicPost) return Response.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
  const payload = await request.json() as { content?: string };
  const content = payload.content?.trim() ?? "";
  const review = reviewText(content);
  if (content.length < 2 || content.length > 2000 || hasPii(content) || ["high", "urgent"].includes(review.riskLevel)) return Response.json({ error: "개인정보와 위험 표현을 제거하고 2~2,000자로 작성해주세요." }, { status: 400 });
  await ensureSchema();
  const displayName = await generateUniqueJinjuDisplayName(async (candidate) => {
    const rows = await db()`
      SELECT 1 FROM posts WHERE display_name = ${candidate}
      UNION ALL
      SELECT 1 FROM comments WHERE display_name = ${candidate}
      LIMIT 1`;
    return Boolean(rows[0]);
  });
  let rows = await db()`SELECT id FROM posts WHERE id = ${postId} AND status = 'approved' AND visibility = 'public' LIMIT 1`;
  if (!rows[0]) {
    const fallback = editorialPost(postId);
    if (!fallback) return Response.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    await db()`INSERT INTO posts (id, title, content, category, delete_key_hash, heard, same, support, comment_count, created_at, updated_at) VALUES (${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category}, ${await hash(`editorial:${fallback.id}`)}, ${fallback.heard}, ${fallback.same}, ${fallback.support}, 0, ${fallback.createdAt}, ${fallback.createdAt}) ON CONFLICT (id) DO NOTHING`;
  }
  const id = token(10);
  const deleteKey = token(14);
  const postTime = Date.parse(publicPost.createdAt);
  const createdAt = new Date(Math.max(Date.now(), Number.isFinite(postTime) ? postTime + 1 : 0)).toISOString();
  await db()`INSERT INTO comments (id, post_id, content, display_name, delete_key_hash, created_at) VALUES (${id}, ${postId}, ${content}, ${displayName}, ${await hash(deleteKey)}, ${createdAt})`;
  await db()`UPDATE posts SET comment_count = (SELECT COUNT(*)::INTEGER FROM comments WHERE post_id = ${postId} AND status = 'approved' AND created_at <= NOW()), updated_at = NOW() WHERE id = ${postId}`;
  return Response.json({ id, deleteKey, body: content, displayName, createdAt }, { status: 201 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(request, "comment-delete", 20, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "삭제 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const { id: postId } = await context.params;
  const payload = await request.json().catch(() => ({})) as { commentId?: string; deleteKey?: string };
  if (!payload.commentId || !payload.deleteKey) return Response.json({ error: "이 댓글을 삭제할 권한을 확인할 수 없습니다." }, { status: 403 });
  await ensureSchema();
  const rows = await db()`SELECT delete_key_hash FROM comments WHERE id = ${payload.commentId} AND post_id = ${postId} AND status = 'approved' LIMIT 1`;
  if (!rows[0] || String(rows[0].delete_key_hash) !== await hash(payload.deleteKey)) {
    return Response.json({ error: "이 댓글을 삭제할 권한을 확인할 수 없습니다." }, { status: 403 });
  }
  await db()`UPDATE comments SET status = 'deleted' WHERE id = ${payload.commentId} AND post_id = ${postId}`;
  await db()`UPDATE posts SET comment_count = (SELECT COUNT(*)::INTEGER FROM comments WHERE post_id = ${postId} AND status = 'approved' AND created_at <= NOW()), updated_at = NOW() WHERE id = ${postId}`;
  return Response.json({ deleted: true }, { headers: { "cache-control": "no-store" } });
}
