import { db, databaseEnabled, ensureSchema } from "../../../lib/db";
import { LEGACY_GENERIC_AUTO_COMMENT_BODIES } from "../../../lib/auto-comments";
import { processDueAutoCommentJobs } from "../../../lib/auto-comment-jobs";
import { PUBLIC_COMMENT_REWRITES } from "../../../lib/content-overrides";
import { purgeExpiredReactions } from "../../../lib/reactions";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!databaseEnabled()) return Response.json({ ok: false }, { status: 503 });
  await ensureSchema();
  let rewrittenComments = 0;
  for (const [id, rewrite] of PUBLIC_COMMENT_REWRITES) {
    const rows = await db()`
      UPDATE comments
      SET content = ${rewrite.to}
      WHERE id = ${id} AND content = ${rewrite.from}
      RETURNING id`;
    rewrittenComments += rows.length;
  }
  const removedLegacyComments: Array<Record<string, unknown>> = [];
  for (const body of LEGACY_GENERIC_AUTO_COMMENT_BODIES) {
    const rows = await db()`
      DELETE FROM comments
      WHERE id LIKE 'jinju-auto-%' AND content = ${body}
      RETURNING post_id`;
    removedLegacyComments.push(...rows);
  }
  const affectedPostIds = [...new Set(removedLegacyComments.map((row) => String(row.post_id)))];
  for (const postId of affectedPostIds) {
    await db()`
      UPDATE posts
      SET comment_count = (
        SELECT COUNT(*)::INTEGER FROM comments
        WHERE post_id = ${postId} AND status = 'approved' AND created_at <= NOW()
      ), updated_at = NOW()
      WHERE id = ${postId}`;
  }
  await Promise.all([
    db()`DELETE FROM admin_sessions WHERE expires_at <= NOW()`,
    db()`DELETE FROM rate_limits WHERE expires_at <= NOW()`,
    db()`DELETE FROM abuse_restrictions WHERE expires_at <= NOW()`,
    db()`DELETE FROM zk_members WHERE expires_at <= NOW()`,
    db()`DELETE FROM zk_group_roots WHERE expires_at <= NOW()`,
    db()`DELETE FROM zk_nullifiers WHERE expires_at <= NOW()`,
    db()`DELETE FROM feedback_reports WHERE expires_at <= NOW()`,
    purgeExpiredReactions(),
  ]);
  const autoCommentJobs = await processDueAutoCommentJobs();
  return Response.json({
    ok: true,
    rewrittenComments,
    removedLegacyComments: removedLegacyComments.length,
    processedAutoCommentJobs: autoCommentJobs.length,
  }, { headers: { "cache-control": "no-store" } });
}
