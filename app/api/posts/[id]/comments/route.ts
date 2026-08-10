import { builtInPost } from "../../../../../lib/built-in-content";
import { isDuplicateComment } from "../../../../../lib/comment-dedup";
import { db, databaseEnabled, ensureSchema, hash, token } from "../../../../../lib/db";
import { HIDDEN_DUPLICATE_POST_IDS } from "../../../../../lib/dedup";
import { generateUniqueJinjuDisplayName } from "../../../../../lib/display-name";
import { reviewSubmission } from "../../../../../lib/ai-review";
import { getPublicComments } from "../../../../../lib/public-comments";
import { getPublicPost } from "../../../../../lib/public-posts";
import { rateLimit } from "../../../../../lib/rate-limit";
import { turnstileFailure, verifyTurnstile } from "../../../../../lib/turnstile";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await getPublicComments(id);
  if (!result.ok && result.reason === "not-found") {
    return Response.json({ error: "게시물을 찾을 수 없습니다.", comments: [] }, { status: 404 });
  }
  if (!result.ok) {
    return Response.json(
      { error: "댓글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.", comments: [] },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  return Response.json(
    { comments: result.comments, fallback: result.fallback },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(request, "comment", 12, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "짧은 시간에 댓글 등록이 많았습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const { id: postId } = await context.params;
  if (HIDDEN_DUPLICATE_POST_IDS.has(postId)) return Response.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
  const publicPost = await getPublicPost(postId);
  if (!publicPost) return Response.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
  const payload = await request.json() as { content?: string; turnstileToken?: string };
  const content = payload.content?.trim() ?? "";
  if (content.length < 2 || content.length > 2000) return Response.json({ error: "댓글은 2~2,000자로 작성해주세요." }, { status: 400 });
  const turnstile = await verifyTurnstile(request, payload.turnstileToken, "comment");
  if (!turnstile.ok) return turnstileFailure(turnstile);
  await ensureSchema();
  const recentComments = await db()`
    SELECT content
    FROM comments
    WHERE post_id = ${postId}
      AND status = 'approved'
      AND created_at > NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 500`;
  if (isDuplicateComment(content, recentComments.map((row: Record<string, unknown>) => String(row.content)))) {
    return Response.json({ error: "같은 댓글이 이미 등록되어 있습니다. 다른 의견을 적어주세요." }, { status: 409 });
  }
  const review = await reviewSubmission("", content, "comment");
  if (review.decision === "revise") return Response.json({ error: "이 문장만 조금 바꾸면 올릴 수 있어요.", review }, { status: 422 });
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
    const fallback = builtInPost(postId);
    if (!fallback) return Response.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    await db()`INSERT INTO posts (id, title, content, category, display_name, mode, visibility, risk_level, status, heard, same, support, comment_count, created_at, updated_at) VALUES (${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category}, ${fallback.displayName || "익명"}, ${fallback.mode || "털어놓기"}, 'public', 'low', 'approved', ${fallback.heard}, ${fallback.same}, ${fallback.support}, 0, ${fallback.createdAt}, ${fallback.createdAt}) ON CONFLICT (id) DO NOTHING`;
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
  if (!rows[0]) return Response.json({ error: "이 댓글을 삭제할 권한을 확인할 수 없습니다." }, { status: 403 });
  const storedDeleteHash = String(rows[0].delete_key_hash || "");
  const adminManagedHash = await hash(`admin:${payload.commentId}`);
  if (storedDeleteHash === adminManagedHash || storedDeleteHash !== await hash(payload.deleteKey)) {
    return Response.json({ error: "이 댓글을 삭제할 권한을 확인할 수 없습니다." }, { status: 403 });
  }
  await db()`UPDATE comments SET status = 'deleted' WHERE id = ${payload.commentId} AND post_id = ${postId}`;
  await db()`UPDATE posts SET comment_count = (SELECT COUNT(*)::INTEGER FROM comments WHERE post_id = ${postId} AND status = 'approved' AND created_at <= NOW()), updated_at = NOW() WHERE id = ${postId}`;
  return Response.json({ deleted: true }, { headers: { "cache-control": "no-store" } });
}
