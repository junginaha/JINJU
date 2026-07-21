import { db, databaseEnabled, ensureSchema, hash } from "../../../../../lib/db";
import { editorialPost } from "../../../../../lib/editorial";
import { HIDDEN_DUPLICATE_POST_IDS } from "../../../../../lib/dedup";

const REACTION_COOKIE = "jinju-reaction-device";

function reactionDevice(request: Request) {
  const cookies = request.headers.get("cookie") || "";
  const current = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${REACTION_COOKIE}=`))?.slice(REACTION_COOKIE.length + 1);
  if (current && /^[a-zA-Z0-9-]{20,80}$/.test(current)) return { id: current, setCookie: "" };
  const id = crypto.randomUUID();
  return { id, setCookie: `${REACTION_COOKIE}=${id}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax` };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const { id } = await context.params;
  if (HIDDEN_DUPLICATE_POST_IDS.has(id)) return Response.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
  const { kind } = await request.json() as { kind?: "heard" | "same" };
  if (!kind || !["heard", "same"].includes(kind)) return Response.json({ error: "올바른 반응을 선택해주세요." }, { status: 400 });
  await ensureSchema();
  const device = reactionDevice(request);
  const voterHash = await hash(`reaction:${device.id}`);
  let rows = await db()`SELECT id FROM posts WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) {
    const fallback = editorialPost(id);
    if (!fallback) return Response.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
    await db()`INSERT INTO posts (id, title, content, category, mode, visibility, risk_level, status, delete_key_hash, heard, same, support, comment_count, created_at, updated_at) VALUES (${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category}, '털어놓기', 'public', 'low', 'approved', ${await hash(`editorial:${fallback.id}`)}, ${fallback.heard}, ${fallback.same}, ${fallback.support}, 0, ${fallback.createdAt}, ${fallback.createdAt}) ON CONFLICT (id) DO NOTHING`;
  }
  const inserted = await db()`
    INSERT INTO post_reactions (post_id, voter_hash, kind)
    VALUES (${id}, ${voterHash}, ${kind})
    ON CONFLICT (post_id, voter_hash) DO NOTHING
    RETURNING kind`;
  if (!inserted[0]) {
    rows = await db()`SELECT heard, same FROM posts WHERE id = ${id} LIMIT 1`;
    return Response.json(
      { ok: true, alreadyReacted: true, post: { heard: Number(rows[0].heard), same: Number(rows[0].same) } },
      { headers: device.setCookie ? { "set-cookie": device.setCookie } : undefined },
    );
  }
  rows = kind === "heard"
    ? await db()`UPDATE posts SET heard = heard + 1, updated_at = NOW() WHERE id = ${id} RETURNING heard, same`
    : await db()`UPDATE posts SET same = same + 1, updated_at = NOW() WHERE id = ${id} RETURNING heard, same`;
  return Response.json(
    { ok: true, post: { heard: Number(rows[0].heard), same: Number(rows[0].same) } },
    { headers: device.setCookie ? { "set-cookie": device.setCookie } : undefined },
  );
}
