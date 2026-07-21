import { db, databaseEnabled, ensureSchema, hash, token } from "../../../../../lib/db";
import { editorialComments, editorialPost } from "../../../../../lib/editorial";
import { hasPii, reviewText } from "../../../../../lib/safety";
import { HIDDEN_DUPLICATE_POST_IDS } from "../../../../../lib/dedup";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (HIDDEN_DUPLICATE_POST_IDS.has(id)) return Response.json({ error: "게시물을 찾을 수 없습니다.", comments: [] }, { status: 404 });
  const fallback = editorialComments(id);
  if (!databaseEnabled()) return Response.json({ comments: fallback }, { headers: { "cache-control": "no-store" } });
  await ensureSchema();
  const rows = await db()`SELECT id, content, display_name, created_at FROM comments WHERE post_id = ${id} AND status = 'approved' ORDER BY created_at ASC LIMIT 200`;
  const stored = rows.map((row: Record<string, unknown>) => ({ id: String(row.id), body: String(row.content), displayName: String(row.display_name || "익명"), createdAt: new Date(String(row.created_at)).toISOString() }));
  const merged = new Map(fallback.map((comment) => [String(comment.id), comment]));
  for (const comment of stored) merged.set(String(comment.id), comment);
  return Response.json({ comments: [...merged.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const { id: postId } = await context.params;
  if (HIDDEN_DUPLICATE_POST_IDS.has(postId)) return Response.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
  const payload = await request.json() as { content?: string; displayName?: string };
  const content = payload.content?.trim() ?? "";
  const displayName = (payload.displayName?.trim() || "익명").slice(0, 12);
  const review = reviewText(content);
  if (content.length < 2 || content.length > 2000 || hasPii(content) || ["high", "urgent"].includes(review.riskLevel)) return Response.json({ error: "개인정보와 위험 표현을 제거하고 2~2,000자로 작성해주세요." }, { status: 400 });
  await ensureSchema();
  let rows = await db()`SELECT id FROM posts WHERE id = ${postId} AND status = 'approved' LIMIT 1`;
  if (!rows[0]) {
    const fallback = editorialPost(postId);
    if (!fallback) return Response.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });
    await db()`INSERT INTO posts (id, title, content, category, delete_key_hash, heard, same, support, comment_count, created_at, updated_at) VALUES (${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category}, ${await hash(`editorial:${fallback.id}`)}, ${fallback.heard}, ${fallback.same}, ${fallback.support}, ${fallback.commentCount}, ${fallback.createdAt}, ${fallback.createdAt}) ON CONFLICT (id) DO NOTHING`;
  }
  const id = token(10);
  const deleteKey = token(14);
  const createdAt = new Date().toISOString();
  await db()`INSERT INTO comments (id, post_id, content, display_name, delete_key_hash, created_at) VALUES (${id}, ${postId}, ${content}, ${displayName}, ${await hash(deleteKey)}, ${createdAt})`;
  await db()`UPDATE posts SET comment_count = comment_count + 1, updated_at = NOW() WHERE id = ${postId}`;
  return Response.json({ id, deleteKey, body: content, displayName, createdAt }, { status: 201 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
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
  await db()`UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0), updated_at = NOW() WHERE id = ${postId}`;
  return Response.json({ deleted: true }, { headers: { "cache-control": "no-store" } });
}
