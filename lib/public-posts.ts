import { cache } from "react";
import { db, databaseEnabled, ensureSchema } from "./db";
import { applyPostOverride, contentOverrides, hiddenCommentCounts } from "./content-overrides";
import { dedupePosts, HIDDEN_DUPLICATE_POST_IDS } from "./dedup";
import { editorialComments, editorialPost, editorialPosts, type EditorialPost } from "./editorial";
import { launchEditorialComments, launchEditorialPost, launchEditorialPosts } from "./launch-editorial";
import { supplementalComments } from "./supplemental-comments";
import { normalizeCommentTimes } from "./comment-time";
import type { Post } from "../components/JinjuApp";

function normalizeCategory(category: string) {
  if (category === "건강") return "사회";
  if (category === "문화") return "질문";
  return category;
}

function commentsFor(postId: string) {
  return launchEditorialPost(postId) ? launchEditorialComments(postId) : editorialComments(postId);
}

function builtInPost(postId: string) {
  return launchEditorialPost(postId) ?? editorialPost(postId);
}

function cleanRow(row: Record<string, unknown>): EditorialPost {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    category: normalizeCategory(String(row.category)),
    displayName: String(row.display_name || "익명"),
    createdAt: new Date(String(row.created_at)).toISOString(),
    heard: Number(row.heard),
    same: Number(row.same),
    support: Number(row.support),
    commentCount: Number(row.stored_comment_count ?? row.comment_count ?? 0),
  };
}

function withVisibleCommentCount(post: EditorialPost, hasAutoComments = false) {
  const builtInCount = builtInPost(post.id)
    ? commentsFor(post.id).length
    : hasAutoComments ? 0 : supplementalComments(post).length;
  return { ...post, category: normalizeCategory(post.category), commentCount: post.commentCount + builtInCount };
}

function editorialWithVisibleCommentCount(post: EditorialPost) {
  return {
    ...post,
    category: normalizeCategory(post.category),
    commentCount: commentsFor(post.id).length,
  };
}

export function toClientPost(post: EditorialPost): Post {
  const comments = normalizeCommentTimes(post.createdAt, commentsFor(post.id))
    .map(({ id, body, displayName, createdAt }) => ({ id, body, displayName, createdAt }));
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    category: normalizeCategory(post.category),
    displayName: post.displayName,
    date: new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(post.createdAt)),
    heard: post.heard,
    same: post.same,
    comments: comments.length
      ? comments
      : Array.from({ length: post.commentCount }, (_, index) => ({ id: `count-${index}`, body: "", createdAt: "" })),
  };
}

export const getPublicPosts = cache(async () => {
  const allEditorialPosts = [...launchEditorialPosts, ...editorialPosts];
  const byId = new Map(allEditorialPosts.map((post) => [post.id, editorialWithVisibleCommentCount(post)]));
  let overrides = await contentOverrides();
  if (databaseEnabled()) {
    try {
      await ensureSchema();
      const rows = await db()`
        SELECT post.id, post.title, post.content, post.category, post.display_name, post.created_at,
               post.status, post.visibility,
               post.heard, post.same, post.support,
               COUNT(comment.id)::INTEGER AS stored_comment_count,
               EXISTS (
                 SELECT 1 FROM comments AS auto_comment
                 WHERE auto_comment.post_id = post.id AND auto_comment.id LIKE 'jinju-auto-%'
               ) AS has_auto_comments
        FROM posts AS post
        LEFT JOIN comments AS comment
          ON comment.post_id = post.id AND comment.status = 'approved' AND comment.created_at <= NOW()
        GROUP BY post.id
        ORDER BY post.created_at DESC
        LIMIT 500`;
      for (const row of rows) {
        const record = row as Record<string, unknown>;
        if (String(record.status) !== "approved" || String(record.visibility) !== "public") {
          byId.delete(String(record.id));
          continue;
        }
        const post = withVisibleCommentCount(cleanRow(record), Boolean(record.has_auto_comments));
        if (!HIDDEN_DUPLICATE_POST_IDS.has(post.id)) byId.set(post.id, post);
      }
    } catch {
      // Editorial content keeps public pages readable during a database cold start.
      overrides = new Map();
    }
  }
  const hiddenCounts = hiddenCommentCounts(overrides);
  return dedupePosts([...byId.values()])
    .flatMap((post) => {
      const visible = applyPostOverride(post, overrides);
      return visible ? [{
        ...visible,
        category: normalizeCategory(visible.category),
        commentCount: Math.max(0, visible.commentCount - (hiddenCounts.get(visible.id) || 0)),
      }] : [];
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
});

export const getPublicPost = cache(async (id: string) => {
  if (HIDDEN_DUPLICATE_POST_IDS.has(id)) return null;
  const overrides = await contentOverrides();
  const hiddenCount = hiddenCommentCounts(overrides).get(id) || 0;
  if (databaseEnabled()) {
    try {
      await ensureSchema();
      const rows = await db()`
        SELECT post.id, post.title, post.content, post.category, post.display_name, post.created_at,
               post.status, post.visibility,
               post.heard, post.same, post.support,
               (SELECT COUNT(*)::INTEGER FROM comments AS comment WHERE comment.post_id = post.id AND comment.status = 'approved' AND comment.created_at <= NOW()) AS stored_comment_count,
               EXISTS (
                 SELECT 1 FROM comments AS auto_comment
                 WHERE auto_comment.post_id = post.id AND auto_comment.id LIKE 'jinju-auto-%'
               ) AS has_auto_comments
        FROM posts AS post
        WHERE post.id = ${id}
        LIMIT 1`;
      if (rows[0]) {
        const record = rows[0] as Record<string, unknown>;
        if (String(record.status) !== "approved" || String(record.visibility) !== "public") return null;
        const post = applyPostOverride(withVisibleCommentCount(cleanRow(record), Boolean(record.has_auto_comments)), overrides);
        return post ? {
          ...post,
          category: normalizeCategory(post.category),
          commentCount: Math.max(0, post.commentCount - hiddenCount),
        } : null;
      }
    } catch {
      // Fall through to the built-in editorial copy.
    }
  }
  const fallback = builtInPost(id);
  if (!fallback) return null;
  const post = applyPostOverride(editorialWithVisibleCommentCount(fallback), overrides);
  return post ? {
    ...post,
    category: normalizeCategory(post.category),
    commentCount: Math.max(0, post.commentCount - hiddenCount),
  } : null;
});
