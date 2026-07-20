import { db, databaseEnabled, ensureSchema, hash, token } from "../../../../../lib/db";
import { editorialComments, editorialPost } from "../../../../../lib/editorial";
import { hasPii, reviewText } from "../../../../../lib/safety";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const fallback = editorialComments(id);
  if (!databaseEnabled()) return Response.json({ comments: fallback }, { headers: { "cache-control": "no-store" } });
  await ensureSchema();
  const rows = await db()`SELECT id, content, display_name, created_at FROM comments WHERE post_id = ${id} AND status = 'approved' ORDER BY created_at ASC LIMIT 200`;
  const stored = rows.map((row: Record<string, unknown>) => ({ id: String(row.id), body: String(row.content), displayName: String(row.display_name), createdAt: new Date(String(row.created_at)).toISOString() }));
  return Response.json({ comments: [...fallback, ...stored] }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const { id: postId } = await context.params;
  const payload = await request.json() as { content?: string; displayName?: string };
  const content = payload.content?.trim() ?? "";
  const displayName = (payload.displayName?.trim() || "익명").slice(0, 12);
  const review = reviewText(content);
  if (content.length < 2 || content.length > 1000 || hasPii(content) || ["high", "urgent"].includes(review.riskLevel)) return Response.json({ error: "개인정보와 위험 표현을 제거하고 2~1,000자로 작성해주세요." }, { status: 400 });
  await ensureSchema();
  let rows = await db()`SELECT id FROM posts WHERE id = ${postId} LIMIT 1`;
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
