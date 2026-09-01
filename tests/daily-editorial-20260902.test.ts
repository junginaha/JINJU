import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september2EditorialCandidateAudit,
  september2EditorialComments,
  september2EditorialPosts,
  september2EditorialQualityAudit,
  september2EditorialResearchSources,
} from "../lib/daily-editorial-20260902";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("9월 2일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(september2EditorialCandidateAudit.length, 20);
  assert.equal(september2EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(september2EditorialPosts.length, 10);
  assert.ok(september2EditorialResearchSources.length >= 4);
});

test("9월 2일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = september2EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(september2EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(september2EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(september2EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(september2EditorialPosts, september2EditorialComments), []);
});

test("9월 2일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["reading-month-local-library", /독서의 달|도서관/u, /1만여 건|일정표/u],
    ["care-label-photo", /세탁표시|라벨/u, /사진|건조기/u],
    ["keypad-worn-digits", /현관|숫자/u, /비밀번호|번호/u],
    ["apology-coffee-coupon", /사과|커피 쿠폰/u, /친구|사용/u],
    ["friend-secret-question", /비밀|질문/u, /퇴사|대신 말/u],
    ["recycling-box-tape", /분리수거장|박스/u, /테이프|종이/u],
    ["library-bookmark-photo", /가족사진|책갈피/u, /사서|분실물/u],
    ["earbuds-wrong-tablet", /이어폰|태블릿/u, /영어 노래|자동 연결/u],
    ["rice-cooker-99-hours", /밥솥|99/u, /보온|아흔아홉/u],
    ["bookclub-dinner-menu", /소설|북클럽/u, /식탁|메뉴/u],
  ] as const;
  assert.equal(anchors.length, september2EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = september2EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("9월 2일 댓글은 9~12개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = september2EditorialPosts.map((post) => september2EditorialComments(post.id).length);
  const comments = september2EditorialPosts.flatMap((post) => september2EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260902-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(september2EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of september2EditorialPosts) {
    const commentsForPost = september2EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(september2EditorialPosts.some((post) => september2EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("9월 2일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(september2EditorialQualityAudit.length, september2EditorialPosts.length);
  for (const [index, audit] of september2EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < september2EditorialPosts[index].commentCount));
  }
});

test("9월 2일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260902-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of september2EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("9월 2일 문장에는 금지된 번역체·개인 이름·반복 표현이 없다", () => {
  const text = september2EditorialPosts.map((post) => `${post.title}\n${post.content}\n${september2EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /써보면 합니다|장바구니를 세워|큰 공장의 감산/u);
  assert.doesNotMatch(text, /\.\.\.|…|까요\?|지현|씨앗/u);
});
