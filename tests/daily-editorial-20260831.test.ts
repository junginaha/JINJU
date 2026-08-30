import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august31EditorialCandidateAudit,
  august31EditorialComments,
  august31EditorialPosts,
  august31EditorialQualityAudit,
  august31EditorialResearchSources,
} from "../lib/daily-editorial-20260831";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 31일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(august31EditorialCandidateAudit.length, 20);
  assert.equal(august31EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(august31EditorialPosts.length, 10);
  assert.ok(august31EditorialResearchSources.length >= 4);
});

test("8월 31일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = august31EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(august31EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(august31EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august31EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august31EditorialPosts, august31EditorialComments), []);
});

test("8월 31일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["roman-wide-view", /로먼|우주/u, /NASA|망원경/u],
    ["receipt-return-date", /전자영수증|반품/u, /구매처|주문번호/u],
    ["water-meter-photo", /수도계량기|집/u, /계량기|수도꼭지/u],
    ["nickname-boundary", /별명|모임/u, /본명|먼저 물어/u],
    ["borrowed-car-scratch", /빌린 차|흠집/u, /사진|책임/u],
    ["transit-card-patience", /잔액 부족|줄/u, /교통카드|버스/u],
    ["large-print-library", /큰글자책|학생/u, /도서관|서가/u],
    ["shopping-bag-family", /장바구니|트렁크/u, /가방|운전석/u],
    ["signature-modern-art", /카드 서명|계산대/u, /단말기|글씨/u],
    ["bookclub-lend-a-line", /등장인물|문장/u, /북클럽|작품/u],
  ] as const;
  assert.equal(anchors.length, august31EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = august31EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("8월 31일 댓글은 9~12개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = august31EditorialPosts.map((post) => august31EditorialComments(post.id).length);
  const comments = august31EditorialPosts.flatMap((post) => august31EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260831-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(august31EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of august31EditorialPosts) {
    const commentsForPost = august31EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(august31EditorialPosts.some((post) => august31EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 31일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(august31EditorialQualityAudit.length, august31EditorialPosts.length);
  for (const [index, audit] of august31EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < august31EditorialPosts[index].commentCount));
  }
});

test("8월 31일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260831-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of august31EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("8월 31일 문장에는 금지된 번역체·개인 이름·반복 표현이 없다", () => {
  const text = august31EditorialPosts.map((post) => `${post.title}\n${post.content}\n${august31EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /써보면 합니다|장바구니를 세워|큰 공장의 감산/u);
  assert.doesNotMatch(text, /\.\.\.|…|까요\?|지현/u);
});
