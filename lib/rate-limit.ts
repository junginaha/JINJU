import { db, databaseEnabled, ensureSchema, hash } from "./db";

type Bucket = { count: number; resetAt: number };

const globalRateLimit = globalThis as typeof globalThis & { __jinjuRateLimits?: Map<string, Bucket> };
const buckets = globalRateLimit.__jinjuRateLimits ?? new Map<string, Bucket>();
globalRateLimit.__jinjuRateLimits = buckets;

function clientKey(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export async function anonymousActorHash(request: Request, purpose = "visitor") {
  const secret = process.env.RATE_LIMIT_SECRET || process.env.ADMIN_REVIEW_SECRET || process.env.DATABASE_URL || "jinju-rate-limit";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return hash(`${purpose}:${secret}:${clientKey(request)}:${userAgent}`);
}

export async function rateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const actorHash = await anonymousActorHash(request, scope);
  const key = `${scope}:${actorHash}`;
  if (databaseEnabled()) {
    await ensureSchema();
    const windowStart = Math.floor(now / windowMs);
    const expiresAt = new Date((windowStart + 1) * windowMs);
    const rows = await db()`
      INSERT INTO rate_limits (scope, actor_hash, window_start, request_count, expires_at)
      VALUES (${scope}, ${actorHash}, ${windowStart}, 1, ${expiresAt.toISOString()})
      ON CONFLICT (scope, actor_hash, window_start)
      DO UPDATE SET request_count = rate_limits.request_count + 1
      RETURNING request_count`;
    if (Math.random() < 0.02) await db()`DELETE FROM rate_limits WHERE expires_at <= NOW()`;
    const count = Number(rows[0]?.request_count || 1);
    return { allowed: count <= limit, retryAfter: count <= limit ? 0 : Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)) };
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count <= limit) return { allowed: true, retryAfter: 0 };
  return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}
