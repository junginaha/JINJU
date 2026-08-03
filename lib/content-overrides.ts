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

const PUBLIC_COMMENT_REWRITES = new Map([
  [
    "jinju-auto-0451693t131i5b2j2s0j-14",
    {
      from: "“아내가 또 가출 했어요”라니, 제목 한 줄이 이미 작은 토론회네요. 입장료는 없지만 각자 가져온 사정은 꽤 묵직합니다.",
      to: "제목 한 줄만으로 작은 토론회가 열렸네요. 입장료는 없지만 각자 가져온 사정은 꽤 묵직합니다.",
    },
  ],
  [
    "jinju-auto-0451693t131i5b2j2s0j-15",
    {
      from: "결국 “아내가 또 가출 했어요”를 어떤 기준으로 바라보느냐가 답을 바꿀 것 같아요. 다른 결론이 나오더라도 서로를 함부로 단정하지 않는 대화였으면 합니다.",
      to: "결국 같은 갈등을 두 사람이 어떤 기준으로 바라보느냐에 따라 답이 달라질 것 같아요. 결론이 다르더라도 서로를 함부로 단정하지 않는 대화였으면 합니다.",
    },
  ],
]);

function publicCommentBody(id: string, body: string) {
  const rewrite = PUBLIC_COMMENT_REWRITES.get(id);
  return rewrite?.from === body ? rewrite.to : body;
}

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
      body: override?.content ?? publicCommentBody(String(comment.id), comment.body),
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
