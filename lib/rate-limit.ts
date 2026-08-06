import { db, databaseEnabled, ensureSchema } from "./db";

type Bucket = { count: number; resetAt: number };
type Restriction = { strikeCount: number; blockedUntil: number; lastWindowStart: number; expiresAt: number };

const globalRateLimit = globalThis as typeof globalThis & {
  __jinjuRateLimits?: Map<string, Bucket>;
  __jinjuAbuseRestrictions?: Map<string, Restriction>;
};
const buckets = globalRateLimit.__jinjuRateLimits ?? new Map<string, Bucket>();
const restrictions = globalRateLimit.__jinjuAbuseRestrictions ?? new Map<string, Restriction>();
globalRateLimit.__jinjuRateLimits = buckets;
globalRateLimit.__jinjuAbuseRestrictions = restrictions;

const ESCALATING_SCOPES = new Set([
  "post",
  "review",
  "comment",
  "comment-delete",
  "reaction",
  "feedback",
  "transcribe",
]);

function clientKey(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown"
  );
}

async function hmacSha256(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function abuseSecret() {
  const configured = process.env.ABUSE_HMAC_SECRET
    || process.env.RATE_LIMIT_SECRET
    || process.env.ADMIN_REVIEW_SECRET
    || process.env.DATABASE_URL;
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return "jinju-rate-limit-development";
  throw new Error("ABUSE_HMAC_SECRET is not configured");
}

export async function anonymousActorHash(request: Request, purpose = "visitor") {
  const userAgent = request.headers.get("user-agent") || "unknown";
  return hmacSha256(abuseSecret(), [purpose, clientKey(request), userAgent].join(":"));
}

export function blockDurationMsForStrike(strikeCount: number, windowMs: number) {
  if (strikeCount <= 1) return windowMs;
  if (strikeCount === 2) return 60 * 60_000;
  if (strikeCount === 3) return 24 * 60 * 60_000;
  return 30 * 24 * 60 * 60_000;
}

function retryAfterSeconds(blockedUntil: number, now: number) {
  return Math.max(1, Math.ceil((blockedUntil - now) / 1000));
}

export async function rateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const actorHash = await anonymousActorHash(request, scope);
  const key = scope + ":" + actorHash;
  const escalating = ESCALATING_SCOPES.has(scope);

  if (databaseEnabled()) {
    await ensureSchema();
    const sql = db();
    if (escalating) {
      const active = await sql`
        SELECT blocked_until
        FROM abuse_restrictions
        WHERE scope = ${scope}
          AND actor_hash = ${actorHash}
          AND expires_at > NOW()
          AND blocked_until > NOW()
        LIMIT 1`;
      if (active[0]?.blocked_until) {
        const blockedUntil = new Date(String(active[0].blocked_until)).getTime();
        return { allowed: false, retryAfter: retryAfterSeconds(blockedUntil, now), escalated: true };
      }
    }

    const windowStart = Math.floor(now / windowMs);
    const expiresAt = new Date((windowStart + 1) * windowMs);
    const rows = await sql`
      INSERT INTO rate_limits (scope, actor_hash, window_start, request_count, expires_at)
      VALUES (${scope}, ${actorHash}, ${windowStart}, 1, ${expiresAt.toISOString()})
      ON CONFLICT (scope, actor_hash, window_start)
      DO UPDATE SET request_count = rate_limits.request_count + 1
      RETURNING request_count`;
    if (Math.random() < 0.02) {
      await Promise.all([
        sql`DELETE FROM rate_limits WHERE expires_at <= NOW()`,
        sql`DELETE FROM abuse_restrictions WHERE expires_at <= NOW()`,
      ]);
    }
    const count = Number(rows[0]?.request_count || 1);
    if (count <= limit) return { allowed: true, retryAfter: 0, escalated: false };

    if (!escalating) {
      return { allowed: false, retryAfter: retryAfterSeconds(expiresAt.getTime(), now), escalated: false };
    }

    const blocked = await sql`
      INSERT INTO abuse_restrictions (
        scope, actor_hash, strike_count, blocked_until, last_window_start, last_violation_at, expires_at
      ) VALUES (
        ${scope}, ${actorHash}, 1, ${expiresAt.toISOString()}, ${windowStart}, NOW(), NOW() + INTERVAL '30 days'
      )
      ON CONFLICT (scope, actor_hash)
      DO UPDATE SET
        strike_count = CASE
          WHEN abuse_restrictions.last_window_start = EXCLUDED.last_window_start
            THEN abuse_restrictions.strike_count
          ELSE LEAST(abuse_restrictions.strike_count + 1, 4)
        END,
        blocked_until = CASE
          WHEN abuse_restrictions.last_window_start = EXCLUDED.last_window_start
            THEN abuse_restrictions.blocked_until
          WHEN abuse_restrictions.strike_count = 1 THEN NOW() + INTERVAL '1 hour'
          WHEN abuse_restrictions.strike_count = 2 THEN NOW() + INTERVAL '24 hours'
          ELSE NOW() + INTERVAL '30 days'
        END,
        last_window_start = EXCLUDED.last_window_start,
        last_violation_at = NOW(),
        expires_at = NOW() + INTERVAL '30 days'
      RETURNING strike_count, blocked_until`;
    const blockedUntil = new Date(String(blocked[0]?.blocked_until || expiresAt.toISOString())).getTime();
    return { allowed: false, retryAfter: retryAfterSeconds(blockedUntil, now), escalated: true };
  }

  const activeRestriction = restrictions.get(key);
  if (escalating && activeRestriction && activeRestriction.expiresAt > now && activeRestriction.blockedUntil > now) {
    return { allowed: false, retryAfter: retryAfterSeconds(activeRestriction.blockedUntil, now), escalated: true };
  }

  const windowStart = Math.floor(now / windowMs);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0, escalated: false };
  }
  current.count += 1;
  if (current.count <= limit) return { allowed: true, retryAfter: 0, escalated: false };

  if (!escalating) {
    return { allowed: false, retryAfter: retryAfterSeconds(current.resetAt, now), escalated: false };
  }

  const previous = restrictions.get(key);
  const strikeCount = previous?.lastWindowStart === windowStart ? previous.strikeCount : Math.min((previous?.strikeCount || 0) + 1, 4);
  const blockedUntil = previous?.lastWindowStart === windowStart
    ? previous.blockedUntil
    : now + blockDurationMsForStrike(strikeCount, windowMs);
  restrictions.set(key, {
    strikeCount,
    blockedUntil,
    lastWindowStart: windowStart,
    expiresAt: now + 30 * 24 * 60 * 60_000,
  });
  return { allowed: false, retryAfter: retryAfterSeconds(blockedUntil, now), escalated: true };
}
