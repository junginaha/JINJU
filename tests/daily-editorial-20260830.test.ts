import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august30EditorialCandidateAudit,
  august30EditorialComments,
  august30EditorialPosts,
  august30EditorialQualityAudit,
  august30EditorialResearchSources,
} from "../lib/daily-editorial-20260830";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 30일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(august30EditorialCandidateAudit.length, 20);
  assert.equal(august30EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(august30EditorialPosts.length, 10);
  assert.ok(august30EditorialResearchSources.length >= 4);
});

test("8월 30일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = august30EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(august30EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(august30EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august30EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august30EditorialPosts, august30EditorialComments), []);
});

test("8월 30일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["home-blood-pressure", /혈압|약/u, /아침|두 번/u],
    ["autopay-calendar", /자동결제|한 장/u, /출금일|구독료/u],
    ["towel-drying-place", /수건|침대/u, /걸 수 있는 봉|말랐/u],
    ["friend-shared-news", /내 소식|친구/u, /단체방|공개 범위/u],
    ["group-chat-thumb", /단체방|엄지/u, /찬성|반대/u],
    ["delivery-route-map", /경비원|배송 동선/u, /배송기사|지도/u],
    ["photo-booth-props", /사진관|머리띠/u, /바구니|소품/u],
    ["child-pushed-chair", /식당 의자|먹은 사람/u, /통로|정리반장/u],
    ["squeaky-video-meeting-chair", /화상회의|의자/u, /삐걱|나사/u],
    ["bookclub-breaking-news", /주인공|속보/u, /북클럽|스무 자/u],
  ] as const;
  assert.equal(anchors.length, august30EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = august30EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("8월 30일 댓글은 9~12개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = august30EditorialPosts.map((post) => august30EditorialComments(post.id).length);
  const comments = august30EditorialPosts.flatMap((post) => august30EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260830-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(august30EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of august30EditorialPosts) {
    const commentsForPost = august30EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(august30EditorialPosts.some((post) => august30EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 30일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(august30EditorialQualityAudit.length, august30EditorialPosts.length);
  for (const [index, audit] of august30EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < august30EditorialPosts[index].commentCount));
  }
});

test("8월 30일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260830-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of august30EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("8월 30일 문장에는 금지된 번역체·개인 이름·반복 표현이 없다", () => {
  const text = august30EditorialPosts.map((post) => `${post.title}\n${post.content}\n${august30EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /써보면 합니다|장바구니를 세워|큰 공장의 감산/u);
  assert.doesNotMatch(text, /\.\.\.|…|까요\?|지현/u);
});
