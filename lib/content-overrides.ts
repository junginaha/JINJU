import { db, databaseEnabled, ensureSchema } from "./db";

export type ContentOverride = {
  kind: "post" | "comment";
  id: string;
  postId: string;
  title: string | null;
  content: string | null;
  category: string | null;
  displayName: string | null;
  hidden: boolean;
};

export async function contentOverrides() {
  const overrides = new Map<string, ContentOverride>();
  if (!databaseEnabled()) return overrides;
  await ensureSchema();
  const rows = await db()`
    SELECT kind, id, post_id, title, content, category, display_name, hidden
    FROM admin_content_overrides`;
  for (const row of rows) {
    const item: ContentOverride = {
      kind: String(row.kind) as ContentOverride["kind"],
      id: String(row.id),
      postId: String(row.post_id || ""),
      title: row.title === null ? null : String(row.title),
      content: row.content === null ? null : String(row.content),
      category: row.category === null ? null : String(row.category),
      displayName: row.display_name === null ? null : String(row.display_name),
      hidden: Boolean(row.hidden),
    };
    overrides.set(`${item.kind}:${item.id}`, item);
  }
  return overrides;
}

export function applyPostOverride<T extends { id: string; title: string; content: string; category: string }>(post: T, overrides: Map<string, ContentOverride>) {
  const override = overrides.get(`post:${post.id}`);
  if (override?.hidden) return null;
  return override ? {
    ...post,
    title: override.title ?? post.title,
    content: override.content ?? post.content,
    category: override.category ?? post.category,
  } : post;
}

export function applyCommentOverrides<T extends { id: string | number; body: string; displayName?: string }>(comments: T[], overrides: Map<string, ContentOverride>) {
  return comments.flatMap((comment) => {
    const override = overrides.get(`comment:${String(comment.id)}`);
    if (override?.hidden) return [];
    return [{
      ...comment,
      body: override?.content ?? comment.body,
      displayName: override?.displayName ?? comment.displayName,
    }];
  });
}

export function hiddenCommentCounts(overrides: Map<string, ContentOverride>) {
  const counts = new Map<string, number>();
  for (const override of overrides.values()) {
    if (override.kind === "comment" && override.hidden) counts.set(override.postId, (counts.get(override.postId) || 0) + 1);
  }
  return counts;
}
