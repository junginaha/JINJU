import { builtInPost } from "../../../../../lib/built-in-content";
import { db, databaseEnabled, ensureSchema } from "../../../../../lib/db";
import { getPublicPost } from "../../../../../lib/public-posts";
import { anonymousActorHash, rateLimit } from "../../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

type TemperatureSummary = {
  count: number;
  average: number;
  buckets: number[];
};

async function storeBuiltInPost(id: string) {
  const fallback = builtInPost(id);
  if (!fallback) return false;
  await db()`
    INSERT INTO posts (
      id, title, content, category, display_name, mode, visibility, risk_level,
      status, heard, same, support, comment_count, created_at, updated_at
    ) VALUES (
      ${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category}, ${fallback.displayName || "익명"},
      ${fallback.mode || "털어놓기"}, 'public', 'low', 'approved', ${fallback.heard}, ${fallback.same},
      ${fallback.support}, 0, ${fallback.createdAt}, ${fallback.createdAt}
    ) ON CONFLICT (id) DO NOTHING`;
  return true;
}

async function summary(postId: string): Promise<TemperatureSummary> {
  const rows = await db()`
    SELECT
      COUNT(*)::INTEGER AS count,
      COALESCE(AVG(value), 50)::FLOAT AS average,
      ARRAY[
        COUNT(*) FILTER (WHERE value BETWEEN 0 AND 9),
        COUNT(*) FILTER (WHERE value BETWEEN 10 AND 19),
        COUNT(*) FILTER (WHERE value BETWEEN 20 AND 29),
        COUNT(*) FILTER (WHERE value BETWEEN 30 AND 39),
        COUNT(*) FILTER (WHERE value BETWEEN 40 AND 49),
        COUNT(*) FILTER (WHERE value BETWEEN 50 AND 59),
        COUNT(*) FILTER (WHERE value BETWEEN 60 AND 69),
        COUNT(*) FILTER (WHERE value BETWEEN 70 AND 79),
        COUNT(*) FILTER (WHERE value BETWEEN 80 AND 89),
        COUNT(*) FILTER (WHERE value BETWEEN 90 AND 99),
        COUNT(*) FILTER (WHERE value = 100)
      ]::INTEGER[] AS buckets
    FROM temperature_samples
    WHERE post_id = ${postId}`;
  const row = rows[0] as Record<string, unknown> | undefined;
  return {
    count: Number(row?.count || 0),
    average: Math.max(0, Math.min(100, Number(row?.average || 50))),
    buckets: Array.isArray(row?.buckets) ? row.buckets.map(Number) : Array(11).fill(0),
  };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!await getPublicPost(id)) return Response.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
  if (!databaseEnabled()) return Response.json({ count: 0, average: 50, buckets: Array(11).fill(0), available: false }, { headers: { "cache-control": "no-store" } });
  try {
    await ensureSchema();
    return Response.json({ ...(await summary(id)), available: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ count: 0, average: 50, buckets: Array(11).fill(0), available: false }, { headers: { "cache-control": "no-store" } });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(request, "temperature", 20, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "짧은 시간에 반응이 많았습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled()) return Response.json({ error: "익명 통계 저장소가 연결되지 않았습니다." }, { status: 503 });
  const { id } = await context.params;
  const post = await getPublicPost(id);
  if (!post) return Response.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
  const payload = await request.json().catch(() => ({})) as { value?: number };
  const value = Number(payload.value);
  if (!Number.isInteger(value) || value < 0 || value > 100) return Response.json({ error: "슬라이더 위치를 확인해주세요." }, { status: 400 });

  await ensureSchema();
  let rows = await db()`SELECT id FROM posts WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) {
    if (!await storeBuiltInPost(id)) return Response.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
    rows = await db()`SELECT id FROM posts WHERE id = ${id} LIMIT 1`;
    if (!rows[0]) return Response.json({ error: "의견을 저장할 수 없습니다." }, { status: 503 });
  }

  const actorHash = await anonymousActorHash(request, "temperature");
  await db()`DELETE FROM temperature_vote_locks WHERE expires_at <= NOW()`;
  const inserted = await db()`
    INSERT INTO temperature_vote_locks (post_id, actor_hash, expires_at)
    VALUES (${id}, ${actorHash}, NOW() + INTERVAL '30 days')
    ON CONFLICT (post_id, actor_hash) DO NOTHING
    RETURNING post_id`;
  if (!inserted[0]) {
    return Response.json({ ...(await summary(id)), recorded: false, alreadyRecorded: true }, { headers: { "cache-control": "no-store" } });
  }

  await db()`INSERT INTO temperature_samples (post_id, value) VALUES (${id}, ${value})`;
  return Response.json({ ...(await summary(id)), recorded: true, alreadyRecorded: false }, { status: 201, headers: { "cache-control": "no-store" } });
}
