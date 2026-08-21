import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august21EditorialCandidateAudit,
  august21EditorialComments,
  august21EditorialPosts,
  august21EditorialQualityAudit,
  august21EditorialResearchSources,
} from "../lib/daily-editorial-20260821";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 21일은 30개 후보에서 비중복 13편을 선별한다", () => {
  assert.equal(august21EditorialCandidateAudit.length, 30);
  assert.equal(august21EditorialCandidateAudit.filter((item) => item[1]).length, 13);
  assert.equal(august21EditorialPosts.length, 13);
  assert.ok(august21EditorialResearchSources.length >= 5);
});

test("8월 21일 글은 두 문장·두 단어 이름·반응·제목 논조 규칙을 지킨다", () => {
  const forms = august21EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(august21EditorialPosts.every((post) => sentenceCount(post.content) === 2));
  assert.ok(august21EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august21EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august21EditorialPosts, august21EditorialComments), []);
});

test("8월 21일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["missile-dialogue", /미사일 여러 발/u, /탄도미사일 10여 발/u],
    ["office-microwave-fish", /전자레인지|생선회의/u, /고등어|방향제/u],
    ["ott-after-breakup", /OTT 프로필/u, /계정|추천 목록/u],
    ["rental-picture-hook", /액자|사진 여섯 장/u, /액자|벽 전체 사진/u],
    ["reusable-banchan-container", /반찬통|500원/u, /용기|포장값 500원/u],
    ["bookclub-counseling", /책 모임|상담실/u, /소설|연애사/u],
    ["leftover-packing-fee", /포장비 1천 원/u, /용기값 1천 원/u],
    ["wedding-transfer-memo", /축의금|계좌이체/u, /계좌|축의금/u],
    ["office-birthday-cake", /생일자|케이크/u, /생일|케이크/u],
    ["grandfather-dialect-caption", /할아버지|자막/u, /할아버지|자동자막/u],
    ["free-class-cancellation", /무료 수업|취소 버튼/u, /무료 요리수업|취소/u],
    ["smartwatch-sleep-praise", /수면 3시간|시계/u, /스마트워치|밤새/u],
    ["suitcase-stickers", /여행가방|스티커/u, /여행가방|공항 스티커/u],
  ] as const;

  assert.equal(anchors.length, august21EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = august21EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("8월 21일 댓글은 10~15개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = august21EditorialPosts.map((post) => august21EditorialComments(post.id).length);
  const comments = august21EditorialPosts.flatMap((post) => august21EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [10, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260821-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(august21EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of august21EditorialPosts) {
    const postComments = august21EditorialComments(post.id);
    const firstDelay = (Date.parse(postComments[0].createdAt) - Date.parse(post.createdAt)) / 60_000;
    assert.ok(firstDelay >= 3 && firstDelay <= 18);
    assert.ok(postComments.every((comment, index) => index === 0
      || Date.parse(comment.createdAt) > Date.parse(postComments[index - 1].createdAt)));
  }

  assert.ok(august21EditorialPosts.some((post) => august21EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 21일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(august21EditorialQualityAudit.length, august21EditorialPosts.length);
  for (const [index, audit] of august21EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < august21EditorialPosts[index].commentCount));
  }
});

test("8월 21일 제목과 본문은 기존 전체 피드의 글을 복제하지 않는다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260821-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of august21EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
  }
});

test("8월 21일 콘텐츠는 전체 피드와 댓글 경로에 등록된다", () => {
  for (const post of august21EditorialPosts) {
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});
