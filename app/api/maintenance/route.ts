import { db, databaseEnabled, ensureSchema } from "../../../lib/db";
import { ensureAutoComments, LEGACY_GENERIC_AUTO_COMMENT_BODIES } from "../../../lib/auto-comments";
import { NEW_POST_COMMUNITY_DEFAULTS } from "../../../lib/community-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!databaseEnabled()) return Response.json({ ok: false }, { status: 503 });
  await ensureSchema();
  const backfillPostId = "5m1e2b3g081f5x5e455c";
  const backfillRows = await db()`
    SELECT id, title, content, category, created_at
    FROM posts
    WHERE id = ${backfillPostId} AND status = 'approved' AND visibility = 'public'
    LIMIT 1`;
  let backfilledPost: Record<string, unknown> | null = null;
  if (backfillRows[0]) {
    const post = backfillRows[0] as Record<string, unknown>;
    await ensureAutoComments({
      id: String(post.id),
      title: String(post.title),
      content: String(post.content),
      category: String(post.category),
      createdAt: new Date(String(post.created_at)).toISOString(),
    });
    const updated = await db()`
      UPDATE posts
      SET heard = GREATEST(heard, ${NEW_POST_COMMUNITY_DEFAULTS.likes}), updated_at = NOW()
      WHERE id = ${backfillPostId}
      RETURNING id, heard, same`;
    backfilledPost = updated[0] as Record<string, unknown>;
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
    db()`DELETE FROM zk_members WHERE expires_at <= NOW()`,
    db()`DELETE FROM zk_group_roots WHERE expires_at <= NOW()`,
    db()`DELETE FROM zk_nullifiers WHERE expires_at <= NOW()`,
    db()`DELETE FROM feedback_reports WHERE expires_at <= NOW()`,
    db()`DELETE FROM post_reactions WHERE created_at <= NOW() - INTERVAL '30 days'`,
  ]);
  return Response.json({ ok: true, removedLegacyComments: removedLegacyComments.length, backfilledPost }, { headers: { "cache-control": "no-store" } });
}
