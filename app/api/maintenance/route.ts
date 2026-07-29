import { builtInPost } from "../../../lib/built-in-content";
import { db, databaseEnabled, ensureSchema, hash } from "../../../lib/db";
import { LEGACY_GENERIC_AUTO_COMMENT_BODIES } from "../../../lib/auto-comments";
import { purgeExpiredReactions } from "../../../lib/reactions";
import { RECENT_POST_BOOST_20260729 } from "../../../lib/recent-post-boost-20260729";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!databaseEnabled()) return Response.json({ ok: false }, { status: 503 });
  await ensureSchema();
  const boostedPosts: Array<Record<string, unknown>> = [];
  for (const boost of RECENT_POST_BOOST_20260729) {
    let postRows = await db()`SELECT id FROM posts WHERE id = ${boost.postId} LIMIT 1`;
    if (!postRows[0]) {
      const fallback = builtInPost(boost.postId);
      if (fallback) {
        await db()`
          INSERT INTO posts (
            id, title, content, category, display_name, mode, visibility, risk_level,
            status, delete_key_hash, heard, same, support, comment_count, created_at, updated_at
          ) VALUES (
            ${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category},
            ${fallback.displayName || "익명"}, ${fallback.mode || "털어놓기"}, 'public', 'low',
            'approved', ${await hash(`editorial:${fallback.id}`)}, ${fallback.heard},
            ${fallback.same}, ${fallback.support}, 0, ${fallback.createdAt},
            ${fallback.updatedAt || fallback.createdAt}
          )
          ON CONFLICT (id) DO NOTHING`;
      }
      postRows = await db()`SELECT id FROM posts WHERE id = ${boost.postId} LIMIT 1`;
    }
    if (!postRows[0]) continue;
    const now = Date.now();
    const commentRows = await Promise.all(boost.comments.map(async (content, index) => {
      const id = `jinju-recent12-20260729-${boost.postId}-${index + 1}`;
      return {
        id,
        post_id: boost.postId,
        content,
        display_name: ["다정한 찻잔", "웃는 우체통", "생각 깊은 창문", "느긋한 책갈피", "따뜻한 정류장"][index],
        delete_key_hash: await hash(`recent12:${id}`),
        created_at: new Date(now - (boost.comments.length - index) * 60_000).toISOString(),
      };
    }));
    const updated = await db()`
      WITH inserted AS (
        INSERT INTO comments (
          id, post_id, content, display_name, delete_key_hash, status, created_at
        )
        SELECT input.id, input.post_id, input.content, input.display_name,
               input.delete_key_hash, 'approved', input.created_at::TIMESTAMPTZ
        FROM jsonb_to_recordset(${JSON.stringify(commentRows)}::JSONB) AS input(
          id TEXT,
          post_id TEXT,
          content TEXT,
          display_name TEXT,
          delete_key_hash TEXT,
          created_at TEXT
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      )
      UPDATE posts
      SET heard = heard + 20,
          same = same + 20,
          comment_count = comment_count + 5,
          updated_at = NOW()
      WHERE id = ${boost.postId}
        AND (SELECT COUNT(*) FROM inserted) = 5
      RETURNING id, heard, same, comment_count`;
    boostedPosts.push(...updated);
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
    purgeExpiredReactions(),
    db()`DELETE FROM posts WHERE status = 'preparing' AND created_at <= NOW() - INTERVAL '15 minutes'`,
  ]);
  return Response.json({
    ok: true,
    removedLegacyComments: removedLegacyComments.length,
    boostedPosts,
  }, { headers: { "cache-control": "no-store" } });
}
