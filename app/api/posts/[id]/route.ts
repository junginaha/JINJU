import { db, databaseEnabled, ensureSchema } from "../../../../lib/db";
import { editorialPost } from "../../../../lib/editorial";
import { HIDDEN_DUPLICATE_POST_IDS } from "../../../../lib/dedup";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (HIDDEN_DUPLICATE_POST_IDS.has(id)) return Response.json({ error: "찾을 수 없는 진주입니다." }, { status: 404 });
  if (databaseEnabled()) {
    await ensureSchema();
    const rows = await db()`SELECT id, title, content, category, created_at, heard, same, support, comment_count FROM posts WHERE id = ${id} AND status = 'approved' LIMIT 1`;
    if (rows[0]) {
      const row = rows[0];
      return Response.json({ post: { id: row.id, title: row.title, content: row.content, category: row.category, createdAt: new Date(String(row.created_at)).toISOString(), heard: Number(row.heard), same: Number(row.same), support: Number(row.support), commentCount: Number(row.comment_count) } });
    }
  }
  const post = editorialPost(id);
  return post ? Response.json({ post }) : Response.json({ error: "찾을 수 없는 진주입니다." }, { status: 404 });
}
