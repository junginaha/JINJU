export const HIDDEN_DUPLICATE_POST_IDS = new Set([
  "unused-subscriptions",
  "53446x5m240c181m1n5c",
]);

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

type TextProfile = {
  normalized: string;
  bigramCount: number;
  counts: Map<string, number>;
};

function buildTextProfile(value: string) {
  const normalized = normalize(value);
  const bigramCount = normalized.length < 2 ? (normalized ? 1 : 0) : normalized.length - 1;
  const counts = new Map<string, number>();
  if (normalized.length < 2) {
    if (normalized) counts.set(normalized, 1);
  } else {
    for (let index = 0; index < normalized.length - 1; index += 1) {
      const item = normalized.slice(index, index + 2);
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }
  }

  return { normalized, bigramCount, counts };
}

function createTextProfiler() {
  const profiles = new Map<string, TextProfile>();
  return (value: string) => {
    const cached = profiles.get(value);
    if (cached) return cached;
    const profile = buildTextProfile(value);
    profiles.set(value, profile);
    return profile;
  };
}

function overlapCount(a: TextProfile, b: TextProfile) {
  const [smaller, larger] = a.counts.size <= b.counts.size
    ? [a.counts, b.counts]
    : [b.counts, a.counts];
  let overlap = 0;
  for (const [item, count] of smaller) overlap += Math.min(count, larger.get(item) ?? 0);
  return overlap;
}

export function similarity(left: string, right: string) {
  const textProfile = createTextProfiler();
  const a = textProfile(left);
  const b = textProfile(right);
  if (!a.bigramCount && !b.bigramCount) return 1;
  return (2 * overlapCount(a, b)) / (a.bigramCount + b.bigramCount || 1);
}

function contentMatches(left: string, right: string, textProfile: ReturnType<typeof createTextProfiler>, threshold = 0.9) {
  const a = textProfile(left);
  const b = textProfile(right);
  if (!a.bigramCount && !b.bigramCount) return true;
  const maximumSimilarity = (2 * Math.min(a.bigramCount, b.bigramCount))
    / (a.bigramCount + b.bigramCount || 1);
  if (maximumSimilarity < threshold) return false;
  return (2 * overlapCount(a, b)) / (a.bigramCount + b.bigramCount || 1) >= threshold;
}

function duplicatePost(candidate: Pick<ComparablePost, "title" | "content">, existing: Pick<ComparablePost, "title" | "content">, textProfile: ReturnType<typeof createTextProfiler>) {
  const candidateTitle = textProfile(candidate.title).normalized;
  const sameTitle = candidateTitle.length >= 4 && candidateTitle === textProfile(existing.title).normalized;
  return sameTitle || contentMatches(candidate.content, existing.content, textProfile);
}

export function createDuplicatePostChecker() {
  const textProfile = createTextProfiler();
  return (candidate: Pick<ComparablePost, "title" | "content">, existing: Pick<ComparablePost, "title" | "content">) => (
    duplicatePost(candidate, existing, textProfile)
  );
}

export function isDuplicatePost(candidate: Pick<ComparablePost, "title" | "content">, existing: Pick<ComparablePost, "title" | "content">) {
  return createDuplicatePostChecker()(candidate, existing);
}

export function dedupePosts<T extends ComparablePost>(posts: T[]) {
  const kept: T[] = [];
  const isDuplicate = createDuplicatePostChecker();
  for (const post of posts.filter((item) => !HIDDEN_DUPLICATE_POST_IDS.has(item.id))) {
    const duplicateIndex = kept.findIndex((item) => isDuplicate(post, item));
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
