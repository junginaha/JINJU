import { builtInPost } from "../../../../../lib/built-in-content";
import { REACTION_SETTINGS } from "../../../../../lib/community-settings";
import { db, databaseEnabled, ensureSchema, hash, token } from "../../../../../lib/db";
import { HIDDEN_DUPLICATE_POST_IDS } from "../../../../../lib/dedup";
import { rateLimit } from "../../../../../lib/rate-limit";

function anonymousReactionId(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const prefix = `${REACTION_SETTINGS.anonymousCookieName}=`;
  const stored = cookie.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
  if (stored && /^[a-z0-9]{24,80}$/i.test(stored)) return { id: stored, fresh: false };
  return { id: token(18), fresh: true };
}

function reactionResponse(
  request: Request,
  body: Record<string, unknown>,
  identity: { id: string; fresh: boolean },
) {
  const headers = new Headers({ "cache-control": "no-store" });
  if (identity.fresh) {
    const maxAge = REACTION_SETTINGS.retentionDays * 24 * 60 * 60;
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    headers.append(
      "set-cookie",
      `${REACTION_SETTINGS.anonymousCookieName}=${identity.id}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`,
    );
  }
  return Response.json(body, { headers });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(request, "reaction", 30, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "반응 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const { id } = await context.params;
  if (HIDDEN_DUPLICATE_POST_IDS.has(id)) return Response.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
  const payload = await request.json() as { kind?: "heard" | "same" };
  const { kind } = payload;
  if (!kind || !["heard", "same"].includes(kind)) return Response.json({ error: "올바른 반응을 선택해주세요." }, { status: 400 });
  await ensureSchema();
  await db()`DELETE FROM post_reactions WHERE created_at <= NOW() - INTERVAL '30 days'`;
  let rows = await db()`SELECT id FROM posts WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) {
    const fallback = builtInPost(id);
    if (!fallback) return Response.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
    await db()`INSERT INTO posts (id, title, content, category, display_name, mode, visibility, risk_level, status, delete_key_hash, heard, same, support, comment_count, created_at, updated_at) VALUES (${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category}, ${fallback.displayName || "익명"}, ${fallback.mode || "털어놓기"}, 'public', 'low', 'approved', ${await hash(`editorial:${fallback.id}`)}, ${fallback.heard}, ${fallback.same}, ${fallback.support}, 0, ${fallback.createdAt}, ${fallback.createdAt}) ON CONFLICT (id) DO NOTHING`;
  }
  const identity = anonymousReactionId(request);
  const voterHash = await hash(`reaction:${identity.id}`);
  const inserted = await db()`
    INSERT INTO post_reactions (post_id, voter_hash, kind)
    VALUES (${id}, ${voterHash}, ${kind})
    ON CONFLICT (post_id, voter_hash) DO NOTHING
    RETURNING kind`;
  if (!inserted[0]) {
    rows = await db()`SELECT heard, same FROM posts WHERE id = ${id} LIMIT 1`;
    return reactionResponse(
      request,
      { ok: true, alreadyReacted: true, post: { heard: Number(rows[0].heard), same: Number(rows[0].same) } },
      identity,
    );
  }
  rows = kind === "heard"
    ? await db()`UPDATE posts SET heard = heard + 1, updated_at = NOW() WHERE id = ${id} RETURNING heard, same`
    : await db()`UPDATE posts SET same = same + 1, updated_at = NOW() WHERE id = ${id} RETURNING heard, same`;
  return reactionResponse(
    request,
    { ok: true, post: { heard: Number(rows[0].heard), same: Number(rows[0].same) } },
    identity,
  );
}
