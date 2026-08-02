import { REACTION_SETTINGS } from "./community-settings";
import { db } from "./db";

export async function purgeExpiredReactions() {
  const retention = `${REACTION_SETTINGS.retentionDays} days`;
  return db()`
    DELETE FROM post_reactions
    WHERE created_at <= NOW() - ${retention}::INTERVAL
    RETURNING post_id`;
}
