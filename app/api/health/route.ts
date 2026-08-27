import * as Sentry from "@sentry/nextjs";
import { db, databaseEnabled } from "@/lib/db";
import { abuseHmacReady } from "@/lib/rate-limit";
import { configuredSocialPlatforms } from "@/lib/social-providers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const headers = {
  "cache-control": "no-store, max-age=0",
  "content-type": "application/json; charset=utf-8",
};

export async function GET() {
  const checkedAt = new Date().toISOString();
  const abuseProtection = {
    hmac: abuseHmacReady(),
    turnstile: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY),
  };
  const protectionReady = abuseProtection.hmac && abuseProtection.turnstile;
  const maintenanceCron = Boolean(process.env.CRON_SECRET?.trim());
  const socialPublishing = {
    enabled: process.env.SOCIAL_PUBLISH_ENABLED === "true",
    configuredPlatforms: [
      ...configuredSocialPlatforms(),
      ...(process.env.YOUTUBE_PUBLISH_ENABLED === "true" ? ["youtube"] : []),
    ],
  };

  if (!databaseEnabled()) {
    const error = new Error("DATABASE_URL is not configured");
    Sentry.captureException(error, { tags: { area: "health-check", service: "database" } });
    console.error("[health] database disabled");
    return Response.json({
      service: "jinju.kr",
      status: "degraded",
      database: "disabled",
      abuseProtection,
      maintenanceCron,
      socialPublishing,
      checkedAt,
    }, { status: 503, headers });
  }

  try {
    const sql = db();
    const rows = await sql`
      SELECT
        COUNT(*) FILTER (
          WHERE status = 'approved'
            AND visibility = 'public'
            AND created_at <= NOW()
        )::INTEGER AS public_post_count,
        MAX(created_at) FILTER (
          WHERE status = 'approved'
            AND visibility = 'public'
            AND created_at <= NOW()
        ) AS latest_post_at,
        (
          SELECT COUNT(*)::INTEGER
          FROM comments
          WHERE status = 'approved'
            AND created_at <= NOW()
        ) AS public_comment_count
      FROM posts`;
    const row = rows[0] as Record<string, unknown> | undefined;

    return Response.json({
      service: "jinju.kr",
      status: protectionReady ? "ok" : "degraded",
      database: "connected",
      abuseProtection,
      maintenanceCron,
      socialPublishing,
      publicPostCount: Number(row?.public_post_count || 0),
      publicCommentCount: Number(row?.public_comment_count || 0),
      latestPostAt: row?.latest_post_at ? new Date(String(row.latest_post_at)).toISOString() : null,
      checkedAt,
    }, { status: protectionReady ? 200 : 503, headers });
  } catch (error) {
    Sentry.captureException(error, { tags: { area: "health-check", service: "database" } });
    console.error("[health] database read failed", error);
    return Response.json({
      service: "jinju.kr",
      status: "degraded",
      database: "unavailable",
      abuseProtection,
      maintenanceCron,
      socialPublishing,
      checkedAt,
    }, { status: 503, headers });
  }
}
