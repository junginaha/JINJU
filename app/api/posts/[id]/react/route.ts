import { db, databaseEnabled, ensureSchema, hash } from "../../../../../lib/db";
import { editorialPost } from "../../../../../lib/editorial";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const { id } = await context.params;
  const { kind } = await request.json() as { kind?: "heard" | "same" };
  if (!kind || !["heard", "same"].includes(kind)) return Response.json({ error: "올바른 반응을 선택해주세요." }, { status: 400 });
  await ensureSchema();
  let rows = await db()`SELECT id FROM posts WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) {
    const fallback = editorialPost(id);
    if (!fallback) return Response.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
    await db()`INSERT INTO posts (id, title, content, category, mode, visibility, risk_level, status, delete_key_hash, heard, same, support, comment_count, created_at, updated_at) VALUES (${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category}, '털어놓기', 'public', 'low', 'approved', ${await hash(`editorial:${fallback.id}`)}, ${fallback.heard}, ${fallback.same}, ${fallback.support}, ${fallback.commentCount}, ${fallback.createdAt}, ${fallback.createdAt}) ON CONFLICT (id) DO NOTHING`;
  }
  rows = kind === "heard"
    ? await db()`UPDATE posts SET heard = heard + 1, updated_at = NOW() WHERE id = ${id} RETURNING heard, same`
    : await db()`UPDATE posts SET same = same + 1, updated_at = NOW() WHERE id = ${id} RETURNING heard, same`;
  return Response.json({ ok: true, post: { heard: Number(rows[0].heard), same: Number(rows[0].same) } });
}
