import { cache } from "react";
import { builtInComments, builtInPost, builtInPosts } from "./built-in-content";
import { normalizePublicCategory } from "./categories";
import { visibleCommentsAt } from "./comment-time";
import { db, databaseEnabled, ensureSchema } from "./db";
import { applyPostOverride, contentOverrides, hiddenCommentCounts } from "./content-overrides";
import { dedupePosts, HIDDEN_DUPLICATE_POST_IDS } from "./dedup";
import type { EditorialPost } from "./editorial";
import { supplementalComments } from "./supplemental-comments";
import {
  hasCompleteAutoCommentSet,
  mergeBaseCommentsByBody,
  visibleBaseCommentCount,
} from "./comment-visibility";
import type { Post } from "../components/JinjuApp";

function cleanRow(row: Record<string, unknown>): EditorialPost {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    category: normalizePublicCategory(String(row.category)),
    displayName: String(row.display_name || "익명"),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at || row.created_at)).toISOString(),
    heard: Number(row.heard),
    same: Number(row.same),
    support: Number(row.support),
    commentCount: Number(row.stored_comment_count ?? row.comment_count ?? 0),
  };
}

function isPublished(post: Pick<EditorialPost, "createdAt">, now = Date.now()) {
  const publishedAt = Date.parse(post.createdAt);
  return !Number.isFinite(publishedAt) || publishedAt <= now;
}

type VisibleBaseComment = ReturnType<typeof builtInComments>[number];

export function visibleBuiltInComments(post: EditorialPost, now = Date.now()): VisibleBaseComment[] {
  return visibleCommentsAt(
    mergeBaseCommentsByBody(builtInComments(post.id), supplementalComments(post)),
    now,
  );
}

function withVisibleCommentCount(post: EditorialPost, autoCommentCount = 0, storedBodies: string[] = [], now = Date.now()) {
  const baseComments = builtInPost(post.id)
    ? visibleBuiltInComments(post, now)
    : hasCompleteAutoCommentSet(autoCommentCount) ? [] : visibleCommentsAt(supplementalComments(post), now);
  const builtInCount = visibleBaseCommentCount(baseComments, storedBodies);
  return {
    ...post,
    category: normalizePublicCategory(post.category),
    commentCount: post.commentCount + builtInCount,
  };
}

function builtInWithVisibleCommentCount(post: EditorialPost, now = Date.now()) {
  return {
    ...post,
    category: normalizePublicCategory(post.category),
    commentCount: visibleBuiltInComments(post, now).length,
  };
}

export function toClientPost(post: EditorialPost): Post {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    category: normalizePublicCategory(post.category),
    displayName: post.displayName,
    date: new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(post.createdAt)),
    heard: post.heard,
    same: post.same,
    comments: Array.from(
      { length: post.commentCount },
      (_, index) => ({ id: `count-${index}`, body: "", createdAt: "" }),
    ),
  };
}

export const getPublicPosts = cache(async () => {
  const now = Date.now();
  const byId = new Map(
    builtInPosts
      .filter((post) => isPublished(post, now))
      .map((post) => [post.id, builtInWithVisibleCommentCount(post, now)]),
  );
  let overrides = await contentOverrides();
  if (databaseEnabled()) {
    try {
      await ensureSchema();
      const rows = await db()`
        SELECT post.id, post.title, post.content, post.category, post.display_name, post.created_at, post.updated_at,
               post.status, post.visibility,
               post.heard, post.same, post.support,
               COUNT(comment.id)::INTEGER AS stored_comment_count,
               (SELECT COUNT(*)::INTEGER FROM comments AS auto_comment
                WHERE auto_comment.post_id = post.id
                  AND auto_comment.id LIKE 'jinju-auto-%'
                  AND auto_comment.status = 'approved') AS auto_comment_count,
               COALESCE(
                 ARRAY_AGG(comment.content) FILTER (WHERE comment.id IS NOT NULL),
                 ARRAY[]::TEXT[]
               ) AS stored_comment_bodies
        FROM posts AS post
        LEFT JOIN comments AS comment
          ON comment.post_id = post.id AND comment.status = 'approved' AND comment.created_at <= NOW()
        WHERE post.created_at <= NOW()
        GROUP BY post.id
        ORDER BY post.created_at DESC
        LIMIT 500`;
      for (const row of rows) {
        const record = row as Record<string, unknown>;
        if (String(record.status) !== "approved" || String(record.visibility) !== "public") {
          byId.delete(String(record.id));
          continue;
        }
        const storedBodies = Array.isArray(record.stored_comment_bodies)
          ? record.stored_comment_bodies.map(String)
          : [];
        const post = withVisibleCommentCount(cleanRow(record), Number(record.auto_comment_count || 0), storedBodies, now);
        if (!HIDDEN_DUPLICATE_POST_IDS.has(post.id) && isPublished(post, now)) byId.set(post.id, post);
      }
    } catch {
      overrides = new Map();
    }
  }
  const hiddenCounts = hiddenCommentCounts(overrides);
  return dedupePosts([...byId.values()])
    .flatMap((post) => {
      if (!isPublished(post, now)) return [];
      const visible = applyPostOverride(post, overrides);
      return visible ? [{
        ...visible,
        category: normalizePublicCategory(visible.category),
        commentCount: Math.max(0, visible.commentCount - (hiddenCounts.get(visible.id) || 0)),
      }] : [];
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
});

export const getPublicPost = cache(async (id: string) => {
  if (HIDDEN_DUPLICATE_POST_IDS.has(id)) return null;
  const now = Date.now();
  const overrides = await contentOverrides();
  const hiddenCount = hiddenCommentCounts(overrides).get(id) || 0;
  if (databaseEnabled()) {
    try {
      await ensureSchema();
      const rows = await db()`
        SELECT post.id, post.title, post.content, post.category, post.display_name, post.created_at, post.updated_at,
               post.status, post.visibility,
               post.heard, post.same, post.support,
               (SELECT COUNT(*)::INTEGER FROM comments AS comment WHERE comment.post_id = post.id AND comment.status = 'approved' AND comment.created_at <= NOW()) AS stored_comment_count,
               (SELECT COUNT(*)::INTEGER FROM comments AS auto_comment
                WHERE auto_comment.post_id = post.id
                  AND auto_comment.id LIKE 'jinju-auto-%'
                  AND auto_comment.status = 'approved') AS auto_comment_count,
               ARRAY(
                 SELECT comment.content FROM comments AS comment
                 WHERE comment.post_id = post.id
                   AND comment.status = 'approved'
                   AND comment.created_at <= NOW()
               ) AS stored_comment_bodies
        FROM posts AS post
        WHERE post.id = ${id} AND post.created_at <= NOW()
        LIMIT 1`;
      if (rows[0]) {
        const record = rows[0] as Record<string, unknown>;
        if (String(record.status) !== "approved" || String(record.visibility) !== "public") return null;
        const storedBodies = Array.isArray(record.stored_comment_bodies)
          ? record.stored_comment_bodies.map(String)
          : [];
        const candidate = cleanRow(record);
        if (!isPublished(candidate, now)) return null;
        const post = applyPostOverride(
          withVisibleCommentCount(candidate, Number(record.auto_comment_count || 0), storedBodies, now),
          overrides,
        );
        return post ? {
          ...post,
          category: normalizePublicCategory(post.category),
          commentCount: Math.max(0, post.commentCount - hiddenCount),
        } : null;
      }
    } catch {
      // Fall through to the built-in editorial copy.
    }
  }
  const fallback = builtInPost(id);
  if (!fallback || !isPublished(fallback, now)) return null;
  const post = applyPostOverride(builtInWithVisibleCommentCount(fallback, now), overrides);
  return post ? {
    ...post,
    category: normalizePublicCategory(post.category),
    commentCount: Math.max(0, post.commentCount - hiddenCount),
  } : null;
});
