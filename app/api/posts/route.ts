import { db, databaseEnabled, ensureSchema, hash, token } from "../../../lib/db";
import { editorialPosts } from "../../../lib/editorial";
import { hasPii, reviewText } from "../../../lib/safety";
import { generateCoreTitle } from "../../../lib/title";

export const dynamic = "force-dynamic";

function cleanRow(row: Record<string, unknown>) {
  return {
    id: String(row.id), title: String(row.title), content: String(row.content), category: String(row.category),
    createdAt: new Date(String(row.created_at)).toISOString(), heard: Number(row.heard), same: Number(row.same),
    support: Number(row.support), commentCount: Number(row.comment_count),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.trim() || "전체";
  const query = url.searchParams.get("q")?.trim().toLocaleLowerCase("ko-KR") || "";
  const sort = url.searchParams.get("sort") === "popular" ? "popular" : "latest";
  let stored: ReturnType<typeof cleanRow>[] = [];
  if (databaseEnabled()) {
    await ensureSchema();
    const rows = await db()`SELECT id, title, content, category, created_at, heard, same, support, comment_count FROM posts WHERE status = 'approved' ORDER BY created_at DESC LIMIT 100`;
    stored = rows.map((row: Record<string, unknown>) => cleanRow(row));
  }
  const byId = new Map(editorialPosts.map((post) => [post.id, post]));
  for (const post of stored) byId.set(post.id, post);
  let posts = [...byId.values()].filter((post) => category === "전체" || post.category === category);
  if (query) posts = posts.filter((post) => `${post.title} ${post.content} ${post.category}`.toLocaleLowerCase("ko-KR").includes(query));
  posts.sort((a, b) => sort === "popular"
    ? (b.heard + b.same + b.commentCount * 3) - (a.heard + a.same + a.commentCount * 3)
    : Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return Response.json({ posts: posts.slice(0, 100), total: posts.length, database: databaseEnabled() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const payload = await request.json() as { title?: string; content?: string; category?: string };
  const content = payload.content?.trim() ?? "";
  const title = (payload.title?.trim() || generateCoreTitle(content)).slice(0, 80);
  const category = payload.category?.trim() || "일상";
  const allowed = ["일상", "관계", "직장", "돈", "사회", "제안", "질문"];
  const review = reviewText(`${title}\n${content}`);
  if (!allowed.includes(category) || title.length < 2 || content.length < 8 || content.length > 2000 || hasPii(`${title} ${content}`)) {
    return Response.json({ error: "개인정보를 제거하고 제목 2~80자, 본문 8~2,000자로 작성해주세요." }, { status: 400 });
  }
  if (["high", "urgent"].includes(review.riskLevel)) return Response.json({ error: review.explanation }, { status: 400 });
  await ensureSchema();
  const id = token(10);
  const deleteKey = token(16);
  await db()`INSERT INTO posts (id, title, content, category, delete_key_hash) VALUES (${id}, ${title}, ${content}, ${category}, ${await hash(deleteKey)})`;
  return Response.json({ id, deleteKey, status: "approved" }, { status: 201, headers: { "cache-control": "no-store" } });
}
