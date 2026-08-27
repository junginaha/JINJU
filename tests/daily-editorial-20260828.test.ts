import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august28EditorialCandidateAudit,
  august28EditorialComments,
  august28EditorialPosts,
  august28EditorialQualityAudit,
  august28EditorialResearchSources,
} from "../lib/daily-editorial-20260828";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 28일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(august28EditorialCandidateAudit.length, 20);
  assert.equal(august28EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(august28EditorialPosts.length, 10);
  assert.ok(august28EditorialResearchSources.length >= 4);
});

test("8월 28일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = august28EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(august28EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(august28EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august28EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august28EditorialPosts, august28EditorialComments), []);
});

test("8월 28일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["base-rate-reset-date", /기준금리|대출/u, /3.00%|조정 주기/u],
    ["cooking-oil-disposal", /기름|신문지/u, /싱크대|폐식용유/u],
    ["power-bank-keys", /보조배터리|열쇠/u, /단자|보호캡/u],
    ["friend-shopping-decisions", /구매 결정|결제/u, /링크|최종 선택/u],
    ["mother-coffee-note", /엄마|커피 주문/u, /냉장고|어머니/u],
    ["smart-speaker-sneeze", /재채기|스피커/u, /마이크|호출 기록/u],
    ["bookclub-side-character-letter", /조연|주인공/u, /북클럽|편지/u],
    ["bakery-last-day", /빵집|이름/u, /단골|마지막 봉투/u],
    ["wet-phone-first-aid", /휴대전화|쌀통/u, /전원|통풍/u],
    ["bus-waited-ten-seconds", /버스|십 초/u, /우산|기사님/u],
  ] as const;
  assert.equal(anchors.length, august28EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = august28EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("8월 28일 댓글은 9~12개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = august28EditorialPosts.map((post) => august28EditorialComments(post.id).length);
  const comments = august28EditorialPosts.flatMap((post) => august28EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260828-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(august28EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of august28EditorialPosts) {
    const commentsForPost = august28EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(august28EditorialPosts.some((post) => august28EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 28일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(august28EditorialQualityAudit.length, august28EditorialPosts.length);
  for (const [index, audit] of august28EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < august28EditorialPosts[index].commentCount));
  }
});

test("8월 28일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260828-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of august28EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("8월 28일 문장에는 금지된 번역체와 반복 표현이 없다", () => {
  const text = august28EditorialPosts.map((post) => `${post.title}\n${post.content}\n${august28EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /써보면 합니다|장바구니를 세워|미사일 열여발|큰 공장의 감산/u);
  assert.doesNotMatch(text, /\.{3,}|…/u);
});
