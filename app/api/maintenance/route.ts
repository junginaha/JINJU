import { db, databaseEnabled, ensureSchema } from "../../../lib/db";
import { generateAutoCommentBodies, LEGACY_GENERIC_AUTO_COMMENT_BODIES } from "../../../lib/auto-comments";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!databaseEnabled()) return Response.json({ ok: false }, { status: 503 });
  await ensureSchema();
  const refreshPostId = "5m1e2b3g081f5x5e455c";
  const refreshRows = await db()`
    SELECT id, title, content, category, created_at
    FROM posts
    WHERE id = ${refreshPostId} AND status = 'approved' AND visibility = 'public'
    LIMIT 1`;
  let refreshedAutoComments = 0;
  if (refreshRows[0]) {
    const post = refreshRows[0] as Record<string, unknown>;
    const bodies = await generateAutoCommentBodies({
      id: String(post.id),
      title: String(post.title),
      content: String(post.content),
      category: String(post.category),
      createdAt: new Date(String(post.created_at)).toISOString(),
    });
    for (const [index, body] of bodies.entries()) {
      const rows = await db()`
        UPDATE comments
        SET content = ${body}
        WHERE id = ${`jinju-auto-${refreshPostId}-${index + 1}`}
        RETURNING id`;
      refreshedAutoComments += rows.length;
    }
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
  return Response.json({ ok: true, removedLegacyComments: removedLegacyComments.length, refreshedAutoComments }, { headers: { "cache-control": "no-store" } });
}
