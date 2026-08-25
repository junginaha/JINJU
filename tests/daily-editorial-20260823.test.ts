import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august23EditorialCandidateAudit,
  august23EditorialComments,
  august23EditorialPosts,
  august23EditorialQualityAudit,
  august23EditorialResearchSources,
} from "../lib/daily-editorial-20260823";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 23일은 30개 후보에서 비중복 13편을 선별한다", () => {
  assert.equal(august23EditorialCandidateAudit.length, 30);
  assert.equal(august23EditorialCandidateAudit.filter((item) => item[1]).length, 13);
  assert.equal(august23EditorialPosts.length, 13);
  assert.ok(august23EditorialResearchSources.length >= 5);
});

test("8월 23일 글은 자연스러운 두 문장과 다양한 제목 논조를 지킨다", () => {
  const forms = august23EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(august23EditorialPosts.every((post) => sentenceCount(post.content) === 2));
  assert.ok(august23EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august23EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august23EditorialPosts, august23EditorialComments), []);

  const forbidden = /써보면 합니다|방법 같습니다|용서해야 한다와|떠나야 한다가|습관이 남았으면|후기를 남겨보려고|묻고 싶어졌습니다|장바구니.{0,12}세워|큰 공장의 감산|답하는 날짜|열여|사십오 분|45분/u;
  for (const post of august23EditorialPosts) {
    assert.doesNotMatch(`${post.title} ${post.content}`, forbidden);
    for (const comment of august23EditorialComments(post.id)) assert.doesNotMatch(comment.body, forbidden);
  }
});

test("8월 23일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["illegal-site-response", /불법 촬영물 사이트/u, /불법 촬영물 사이트|피해자/u],
    ["beauty-small-brand", /립밤|법률/u, /화장품|작은 브랜드/u],
    ["rooftop-solar", /옥상 햇빛/u, /태양광|꼭대기층/u],
    ["industry-crisis-answer", /지원금|답변 날짜/u, /산업위기지역|공고/u],
    ["parent-health-app", /건강 앱|부모님/u, /아버지|건강 알림/u],
    ["swapped-umbrella", /우산/u, /오리 스티커|우산/u],
    ["lunch-sheet", /점심 메뉴표/u, /공유 문서|메뉴/u],
    ["family-calendar", /가족 달력|병원/u, /할머니 진료|달력/u],
    ["parcel-note", /택배|세 줄/u, /택배|쪽지/u],
    ["photo-restoration", /AI|셔츠/u, /흑백 가족사진|보라색/u],
    ["bookclub-dislike", /싫었던 문장/u, /북클럽|불편했던 문장/u],
    ["cash-change", /천 원짜리|현금/u, /현금|잔돈/u],
    ["neighborhood-trip", /명소|동네/u, /여행 명소|강변길/u],
  ] as const;

  assert.equal(anchors.length, august23EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = august23EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("8월 23일 댓글은 10~15개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = august23EditorialPosts.map((post) => august23EditorialComments(post.id).length);
  const comments = august23EditorialPosts.flatMap((post) => august23EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [10, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260823-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(august23EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of august23EditorialPosts) {
    const postComments = august23EditorialComments(post.id);
    const firstDelay = (Date.parse(postComments[0].createdAt) - Date.parse(post.createdAt)) / 60_000;
    assert.ok(firstDelay >= 3 && firstDelay <= 18);
    assert.ok(postComments.every((comment, index) => index === 0
      || Date.parse(comment.createdAt) > Date.parse(postComments[index - 1].createdAt)));
  }
  assert.ok(august23EditorialPosts.some((post) => august23EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 23일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(august23EditorialQualityAudit.length, august23EditorialPosts.length);
  for (const [index, audit] of august23EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < august23EditorialPosts[index].commentCount));
  }
});

test("8월 23일 제목과 본문은 기존 전체 피드의 글을 복제하지 않는다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260823-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of august23EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
  }
});

test("8월 23일 콘텐츠는 전체 피드와 댓글 경로에 등록된다", () => {
  for (const post of august23EditorialPosts) {
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});
