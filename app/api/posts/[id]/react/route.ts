import { builtInPost } from "../../../../../lib/built-in-content";
import { db, databaseEnabled, ensureSchema, hash } from "../../../../../lib/db";
import { HIDDEN_DUPLICATE_POST_IDS } from "../../../../../lib/dedup";
import { rateLimit } from "../../../../../lib/rate-limit";
import { parseSemaphoreProof, reactionProofMessage, reactionProofScope } from "../../../../../lib/zk-shared";
import { anonymousProofExpiry, verifyAnonymousAction } from "../../../../../lib/zk-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(request, "reaction", 30, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "반응 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const { id } = await context.params;
  if (HIDDEN_DUPLICATE_POST_IDS.has(id)) return Response.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
  const payload = await request.json() as { kind?: "heard" | "same"; proof?: unknown };
  const { kind } = payload;
  if (!kind || !["heard", "same"].includes(kind)) return Response.json({ error: "올바른 반응을 선택해주세요." }, { status: 400 });
  const proof = parseSemaphoreProof(payload.proof);
  if (!proof) {
    return Response.json(
      { error: "익명 이용 증명이 필요합니다.", code: "anonymous_proof_required" },
      { status: 428 },
    );
  }
  await ensureSchema();
  await db()`DELETE FROM post_reactions WHERE created_at <= NOW() - INTERVAL '30 days'`;
  const checked = await verifyAnonymousAction(
    proof,
    reactionProofMessage(id, kind),
    reactionProofScope(id),
  );
  if (!checked.valid) {
    return Response.json(
      {
        error: checked.reason === "expired_root"
          ? "익명 이용 증명을 새로 준비해주세요."
          : "익명 이용 증명을 확인하지 못했습니다.",
        code: checked.reason === "expired_root" ? "anonymous_proof_expired" : "anonymous_proof_invalid",
      },
      { status: 403 },
    );
  }

  const voterHash = await hash(`zk-reaction:${proof.nullifier}`);
  let rows = await db()`SELECT id FROM posts WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) {
    const fallback = builtInPost(id);
    if (!fallback) return Response.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
    await db()`INSERT INTO posts (id, title, content, category, display_name, mode, visibility, risk_level, status, delete_key_hash, heard, same, support, comment_count, created_at, updated_at) VALUES (${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category}, ${fallback.displayName || "익명"}, ${fallback.mode || "털어놓기"}, 'public', 'low', 'approved', ${await hash(`editorial:${fallback.id}`)}, ${fallback.heard}, ${fallback.same}, ${fallback.support}, 0, ${fallback.createdAt}, ${fallback.createdAt}) ON CONFLICT (id) DO NOTHING`;
  }
  const inserted = await db()`
    WITH consumed AS (
      INSERT INTO zk_nullifiers (nullifier, action, scope, expires_at)
      VALUES (${proof.nullifier}, 'reaction', ${proof.scope}, ${anonymousProofExpiry()})
      ON CONFLICT (nullifier) DO NOTHING
      RETURNING nullifier
    )
    INSERT INTO post_reactions (post_id, voter_hash, kind)
    SELECT ${id}, ${voterHash}, ${kind}
    FROM consumed
    ON CONFLICT (post_id, voter_hash) DO NOTHING
    RETURNING kind`;
  if (!inserted[0]) {
    rows = await db()`SELECT heard, same FROM posts WHERE id = ${id} LIMIT 1`;
    return Response.json(
      { ok: true, alreadyReacted: true, post: { heard: Number(rows[0].heard), same: Number(rows[0].same) } },
    );
  }
  rows = kind === "heard"
    ? await db()`UPDATE posts SET heard = heard + 1, updated_at = NOW() WHERE id = ${id} RETURNING heard, same`
    : await db()`UPDATE posts SET same = same + 1, updated_at = NOW() WHERE id = ${id} RETURNING heard, same`;
  return Response.json(
    { ok: true, post: { heard: Number(rows[0].heard), same: Number(rows[0].same) } },
  );
}
