import { db, databaseEnabled, ensureSchema } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!databaseEnabled()) return Response.json({ ok: false }, { status: 503 });
  await ensureSchema();
  await Promise.all([
    db()`DELETE FROM admin_sessions WHERE expires_at <= NOW()`,
    db()`DELETE FROM rate_limits WHERE expires_at <= NOW()`,
    db()`DELETE FROM feedback_reports WHERE expires_at <= NOW()`,
    db()`DELETE FROM post_reactions WHERE created_at <= NOW() - INTERVAL '30 days'`,
  ]);
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
