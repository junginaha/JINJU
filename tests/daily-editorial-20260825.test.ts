import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august25EditorialCandidateAudit,
  august25EditorialComments,
  august25EditorialPosts,
  august25EditorialQualityAudit,
  august25EditorialResearchSources,
} from "../lib/daily-editorial-20260825";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 25일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(august25EditorialCandidateAudit.length, 20);
  assert.equal(august25EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(august25EditorialPosts.length, 10);
  assert.ok(august25EditorialResearchSources.length >= 3);
});

test("8월 25일 글은 자연스러운 두 문장과 다양한 제목 논조를 지킨다", () => {
  const forms = august25EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(august25EditorialPosts.every((post) => sentenceCount(post.content) === 2));
  assert.ok(august25EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august25EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august25EditorialPosts, august25EditorialComments), []);
});

test("8월 25일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["financial-welfare-call", /주민센터/u, /금융 위기정보|먼저 연락/u],
    ["geostationary-satellite", /위성/u, /천리안위성 6호/u],
    ["ai-meeting-minutes", /회의록|발언/u, /자동 작성된 회의록/u],
    ["eat-first-fridge", /반찬/u, /냉장고|반찬/u],
    ["friend-plus-one", /셋|넷/u, /친구 셋|배우자/u],
    ["parent-doorlock-boundary", /비밀번호/u, /도어록 번호/u],
    ["dry-cleaner-cash", /세탁소|삼만 원/u, /현금 삼만 원/u],
    ["bookclub-silence", /90초/u, /북클럽|침묵/u],
    ["math-alarm", /구구단/u, /계산 문제|7×8/u],
    ["apartment-app-notice", /아파트 공지/u, /아파트 앱|승강기/u],
  ] as const;

  assert.equal(anchors.length, august25EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = august25EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("8월 25일 댓글은 9~12개로 달리하고 실제 시각에 맞춰 공개된다", () => {
  const counts = august25EditorialPosts.map((post) => august25EditorialComments(post.id).length);
  const comments = august25EditorialPosts.flatMap((post) => august25EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260825-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(august25EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of august25EditorialPosts) {
    const postComments = august25EditorialComments(post.id);
    const firstThreeDelays = postComments.slice(0, 3)
      .map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThreeDelays.every((delay) => delay >= 3 && delay <= 18));
    assert.ok(postComments.every((comment, index) => index === 0
      || Date.parse(comment.createdAt) > Date.parse(postComments[index - 1].createdAt)));
  }

  assert.ok(august25EditorialPosts.some((post) => august25EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 25일 모든 글은 유머와 실용 댓글을 각각 두 개 이상 표시한다", () => {
  assert.equal(august25EditorialQualityAudit.length, august25EditorialPosts.length);
  for (const [index, audit] of august25EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < august25EditorialPosts[index].commentCount));
  }
});

test("8월 25일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260825-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of august25EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});
