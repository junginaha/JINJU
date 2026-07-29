import { getPublicPost } from "../../../../lib/public-posts";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const post = await getPublicPost(id);
  return post ? Response.json({ post }, { headers: { "cache-control": "no-store" } }) : Response.json({ error: "찾을 수 없는 진주입니다." }, { status: 404 });
}
