import { REACTION_SETTINGS } from "./community-settings";
import { db } from "./db";

export async function purgeExpiredReactions() {
  const retention = `${REACTION_SETTINGS.retentionDays} days`;
  return db()`
    WITH expired AS (
      DELETE FROM post_reactions
      WHERE created_at <= NOW() - ${retention}::INTERVAL
      RETURNING post_id, kind
    ),
    expired_counts AS (
      SELECT post_id,
             COUNT(*) FILTER (WHERE kind = 'heard')::INTEGER AS heard_count,
             COUNT(*) FILTER (WHERE kind = 'same')::INTEGER AS same_count
      FROM expired
      GROUP BY post_id
    )
    UPDATE posts AS post
    SET heard = GREATEST(0, post.heard - expired_counts.heard_count),
        same = GREATEST(0, post.same - expired_counts.same_count),
        updated_at = NOW()
    FROM expired_counts
    WHERE post.id = expired_counts.post_id
    RETURNING post.id`;
}
