type Bucket = { count: number; resetAt: number };

const globalRateLimit = globalThis as typeof globalThis & { __jinjuRateLimits?: Map<string, Bucket> };
const buckets = globalRateLimit.__jinjuRateLimits ?? new Map<string, Bucket>();
globalRateLimit.__jinjuRateLimits = buckets;

function clientKey(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export function rateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${clientKey(request)}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count <= limit) return { allowed: true, retryAfter: 0 };
  return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}
