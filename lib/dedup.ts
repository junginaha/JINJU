export const HIDDEN_DUPLICATE_POST_IDS = new Set(["unused-subscriptions"]);

type ComparablePost = {
  id: string;
  title: string;
  content: string;
  commentCount: number;
  createdAt: string;
};

function normalize(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[^가-힣a-z0-9]/g, "");
}

function bigrams(value: string) {
  const normalized = normalize(value);
  if (normalized.length < 2) return normalized ? [normalized] : [];
  return Array.from({ length: normalized.length - 1 }, (_, index) => normalized.slice(index, index + 2));
}

export function similarity(left: string, right: string) {
  const a = bigrams(left);
  const b = bigrams(right);
  if (!a.length && !b.length) return 1;
  const counts = new Map<string, number>();
  for (const item of a) counts.set(item, (counts.get(item) ?? 0) + 1);
  let overlap = 0;
  for (const item of b) {
    const count = counts.get(item) ?? 0;
    if (count > 0) {
      overlap += 1;
      counts.set(item, count - 1);
    }
  }
  return (2 * overlap) / (a.length + b.length || 1);
}

export function isDuplicatePost(candidate: Pick<ComparablePost, "title" | "content">, existing: Pick<ComparablePost, "title" | "content">) {
  const sameTitle = normalize(candidate.title).length >= 4 && normalize(candidate.title) === normalize(existing.title);
  return sameTitle || similarity(candidate.content, existing.content) >= 0.9;
}

export function dedupePosts<T extends ComparablePost>(posts: T[]) {
  const kept: T[] = [];
  for (const post of posts.filter((item) => !HIDDEN_DUPLICATE_POST_IDS.has(item.id))) {
    const duplicateIndex = kept.findIndex((item) => isDuplicatePost(post, item));
    if (duplicateIndex < 0) {
      kept.push(post);
      continue;
    }
    const current = kept[duplicateIndex];
    const preferPost = post.commentCount > current.commentCount
      || (post.commentCount === current.commentCount && Date.parse(post.createdAt) > Date.parse(current.createdAt));
    if (preferPost) kept[duplicateIndex] = post;
  }
  return kept;
}
