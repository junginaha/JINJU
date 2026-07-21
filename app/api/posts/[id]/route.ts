import { db, databaseEnabled, ensureSchema, hash } from "../../../../lib/db";
import { getPublicPost } from "../../../../lib/public-posts";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const post = await getPublicPost(id);
  return post ? Response.json({ post }, { headers: { "cache-control": "no-store" } }) : Response.json({ error: "찾을 수 없는 진주입니다." }, { status: 404 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const { id } = await context.params;
  const payload = await request.json().catch(() => ({})) as { deleteKey?: string };
  if (!payload.deleteKey) return Response.json({ error: "이 글을 삭제할 권한을 확인할 수 없습니다." }, { status: 403 });
  await ensureSchema();
  const rows = await db()`SELECT delete_key_hash FROM posts WHERE id = ${id} AND status IN ('approved','pending') LIMIT 1`;
  if (!rows[0] || String(rows[0].delete_key_hash) !== await hash(payload.deleteKey)) {
    return Response.json({ error: "이 글을 삭제할 권한을 확인할 수 없습니다." }, { status: 403 });
  }
  await db()`UPDATE posts SET status = 'deleted', updated_at = NOW() WHERE id = ${id}`;
  await db()`UPDATE comments SET status = 'hidden' WHERE post_id = ${id}`;
  return Response.json({ deleted: true }, { headers: { "cache-control": "no-store" } });
}
