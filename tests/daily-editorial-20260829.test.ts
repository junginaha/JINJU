import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august29EditorialCandidateAudit,
  august29EditorialComments,
  august29EditorialPosts,
  august29EditorialQualityAudit,
  august29EditorialResearchSources,
} from "../lib/daily-editorial-20260829";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 29일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(august29EditorialCandidateAudit.length, 20);
  assert.equal(august29EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(august29EditorialPosts.length, 10);
  assert.ok(august29EditorialResearchSources.length >= 4);
});

test("8월 29일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = august29EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(august29EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(august29EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august29EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 0);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august29EditorialPosts, august29EditorialComments), []);
});

test("8월 29일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["pension-first-premium", /국민연금|보험료/u, /2027년|신청/u],
    ["resident-survey-mobile", /주민등록|휴대폰/u, /9월 7일|정부24/u],
    ["washer-tissue-snow", /세탁기|첫눈/u, /휴지|거름망/u],
    ["freezer-door-list", /냉동실|목록/u, /자석판|재고/u],
    ["unannounced-plus-one", /약속|동행/u, /연인|단체방/u],
    ["delayed-congratulations", /좋은 소식|한 박자/u, /합격|비교/u],
    ["found-child-drawing", /화단|그림/u, /관리실|게시판/u],
    ["mismatched-container-lids", /반찬통|뚜껑/u, /용기|짝/u],
    ["latte-heart-practice", /우유 하트|손님/u, /라테아트|카운터/u],
    ["bookclub-retitle", /책 제목|토론/u, /북클럽|문장/u],
  ] as const;
  assert.equal(anchors.length, august29EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = august29EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("8월 29일 댓글은 9~12개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = august29EditorialPosts.map((post) => august29EditorialComments(post.id).length);
  const comments = august29EditorialPosts.flatMap((post) => august29EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260829-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(august29EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of august29EditorialPosts) {
    const commentsForPost = august29EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(august29EditorialPosts.some((post) => august29EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 29일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(august29EditorialQualityAudit.length, august29EditorialPosts.length);
  for (const [index, audit] of august29EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < august29EditorialPosts[index].commentCount));
  }
});

test("8월 29일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260829-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of august29EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("8월 29일 문장에는 금지된 번역체와 반복 표현이 없다", () => {
  const text = august29EditorialPosts.map((post) => `${post.title}\n${post.content}\n${august29EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /써보면 합니다|장바구니를 세워|미사일 열여발|큰 공장의 감산/u);
  assert.doesNotMatch(text, /\.\.\.|…/u);
  assert.doesNotMatch(text, /까요\?|\.\.\./u);
});
