import { cache } from "react";
import { builtInComments, builtInPost } from "./built-in-content";
import { normalizeCommentTimes } from "./comment-time";
import { applyCommentOverrides, contentOverrides, type ContentOverride } from "./content-overrides";
import { db, databaseEnabled, ensureSchema } from "./db";
import { HIDDEN_DUPLICATE_POST_IDS } from "./dedup";
import { getPublicPost } from "./public-posts";
import {
  keepsSupplementalCommentsWithAutoSet,
  supplementalComments,
} from "./supplemental-comments";
import {
  combineBaseAndStoredComments,
  hasCompleteAutoCommentSet,
  mergeBaseCommentsByBody,
} from "./comment-visibility";

export type PublicComment = {
  id: string;
  body: string;
  displayName: string;
  createdAt: string;
};

export type PublicCommentsResult =
  | { ok: true; comments: PublicComment[]; fallback: boolean }
  | { ok: false; reason: "not-found" | "unavailable" };

function publicComment(comment: PublicComment): PublicComment {
  return {
    id: String(comment.id),
    body: String(comment.body),
    displayName: String(comment.displayName || "익명"),
    createdAt: String(comment.createdAt),
  };
}

async function safeContentOverrides(): Promise<Map<string, ContentOverride>> {
  try {
    return await contentOverrides();
  } catch (error) {
    console.error("[comments] content overrides unavailable", error);
    return new Map<string, ContentOverride>();
  }
}

export const getPublicComments = cache(async (id: string): Promise<PublicCommentsResult> => {
  if (HIDDEN_DUPLICATE_POST_IDS.has(id)) return { ok: false, reason: "not-found" };
  const publicPost = await getPublicPost(id);
  if (!publicPost) return { ok: false, reason: "not-found" };

  const builtIn = builtInPost(id);
  const fallback = builtInComments(id);
  const supplemental = supplementalComments(publicPost);
  const baseComments = builtIn ? mergeBaseCommentsByBody(fallback, supplemental) : supplemental;
  const overrides = await safeContentOverrides();
  const fallbackResult = (): PublicCommentsResult => ({
    ok: true,
    comments: normalizeCommentTimes(
      publicPost.createdAt,
      applyCommentOverrides(baseComments, overrides),
    ).map(publicComment),
    fallback: true,
  });

  if (!databaseEnabled()) return builtIn ? fallbackResult() : { ok: false, reason: "not-found" };

  try {
    await ensureSchema();
    const postRows = await db()`
      SELECT post.id, post.title, post.content, post.category, post.created_at,
             (SELECT COUNT(*)::INTEGER FROM comments AS auto_comment
              WHERE auto_comment.post_id = post.id
                AND auto_comment.id LIKE 'jinju-auto-%'
                AND auto_comment.status = 'approved') AS auto_comment_count
      FROM posts AS post
      WHERE post.id = ${id} AND post.status = 'approved' AND post.visibility = 'public'
      LIMIT 1`;
    const row = postRows[0] as Record<string, unknown> | undefined;
    if (!row && !builtIn) return { ok: false, reason: "not-found" };

    const rows = await db()`
      SELECT id, content, display_name, created_at
      FROM comments
      WHERE post_id = ${id} AND status = 'approved' AND created_at <= NOW()
      ORDER BY created_at ASC
      LIMIT 200`;
    const stored = rows.map((storedRow: Record<string, unknown>) => ({
      id: String(storedRow.id),
      body: String(storedRow.content),
      displayName: String(storedRow.display_name || "익명"),
      createdAt: new Date(String(storedRow.created_at)).toISOString(),
    }));
    const visibleBaseComments = !builtIn
      && hasCompleteAutoCommentSet(Number(row?.auto_comment_count || 0))
      && !keepsSupplementalCommentsWithAutoSet(id)
      ? []
      : baseComments;
    const comments = normalizeCommentTimes(
      publicPost.createdAt,
      combineBaseAndStoredComments(visibleBaseComments, stored),
    );
    return {
      ok: true,
      comments: applyCommentOverrides(comments, overrides).map(publicComment),
      fallback: false,
    };
  } catch (error) {
    console.error("[comments] database read unavailable", error);
    return builtIn ? fallbackResult() : { ok: false, reason: "unavailable" };
  }
});
