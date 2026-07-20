import { cache } from "react";
import { db, databaseEnabled } from "./db";
import { dedupePosts, HIDDEN_DUPLICATE_POST_IDS } from "./dedup";
import { editorialComments, editorialPost, editorialPosts, type EditorialPost } from "./editorial";
import type { Post } from "../components/JinjuApp";

function cleanRow(row: Record<string, unknown>): EditorialPost {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    category: String(row.category),
    createdAt: new Date(String(row.created_at)).toISOString(),
    heard: Number(row.heard),
    same: Number(row.same),
    support: Number(row.support),
    commentCount: Number(row.comment_count),
  };
}

export function toClientPost(post: EditorialPost): Post {
  const comments = editorialComments(post.id);
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category,
    date: new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(post.createdAt)),
    heard: post.heard,
    same: post.same,
    comments: comments.length
      ? comments
      : Array.from({ length: post.commentCount }, (_, index) => ({ id: `count-${index}`, body: "", createdAt: "" })),
  };
}

export const getPublicPosts = cache(async () => {
  const byId = new Map(editorialPosts.map((post) => [post.id, post]));
  if (databaseEnabled()) {
    try {
      const rows = await db()`SELECT id, title, content, category, created_at, heard, same, support, comment_count FROM posts WHERE status = 'approved' ORDER BY created_at DESC LIMIT 500`;
      for (const row of rows) {
        const post = cleanRow(row as Record<string, unknown>);
        if (!HIDDEN_DUPLICATE_POST_IDS.has(post.id)) byId.set(post.id, post);
      }
    } catch {
      // Editorial content keeps public pages readable during a database cold start.
    }
  }
  return dedupePosts([...byId.values()]).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
});

export const getPublicPost = cache(async (id: string) => {
  if (HIDDEN_DUPLICATE_POST_IDS.has(id)) return null;
  if (databaseEnabled()) {
    try {
      const rows = await db()`SELECT id, title, content, category, created_at, heard, same, support, comment_count FROM posts WHERE id = ${id} AND status = 'approved' LIMIT 1`;
      if (rows[0]) return cleanRow(rows[0] as Record<string, unknown>);
    } catch {
      // Fall through to the built-in editorial copy.
    }
  }
  return editorialPost(id);
});
