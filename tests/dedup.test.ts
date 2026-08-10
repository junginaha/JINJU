import assert from "node:assert/strict";
import test from "node:test";
import { builtInPosts } from "../lib/built-in-content";
import { dedupePosts, isDuplicatePost, similarity } from "../lib/dedup";

function normalize(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[^가-힣a-z0-9]/g, "");
}

function naiveBigrams(value: string) {
  const normalized = normalize(value);
  if (normalized.length < 2) return normalized ? [normalized] : [];
  return Array.from({ length: normalized.length - 1 }, (_, index) => normalized.slice(index, index + 2));
}

function naiveSimilarity(left: string, right: string) {
  const a = naiveBigrams(left);
  const b = naiveBigrams(right);
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

function naiveDuplicate(
  candidate: Pick<(typeof builtInPosts)[number], "title" | "content">,
  existing: Pick<(typeof builtInPosts)[number], "title" | "content">,
) {
  const candidateTitle = normalize(candidate.title);
  return (candidateTitle.length >= 4 && candidateTitle === normalize(existing.title))
    || naiveSimilarity(candidate.content, existing.content) >= 0.9;
}

test("optimized duplicate checks preserve the original Dice similarity", () => {
  const samples = [
    "",
    "가",
    "같은 문장입니다.",
    "같은 문장 입니다!",
    "전혀 다른 내용입니다.",
    ...builtInPosts.slice(0, 24).flatMap((post) => [post.title, post.content]),
  ];

  for (const left of samples) {
    for (const right of samples) {
      assert.equal(similarity(left, right), naiveSimilarity(left, right));
    }
  }
});

test("optimized post deduplication keeps the same posts and order", () => {
  const sample = builtInPosts.slice(0, 60);
  for (const candidate of sample) {
    for (const existing of sample) {
      assert.equal(isDuplicatePost(candidate, existing), naiveDuplicate(candidate, existing));
    }
  }

  assert.deepEqual(dedupePosts(builtInPosts).map((post) => post.id), builtInPosts.map((post) => post.id));
});
