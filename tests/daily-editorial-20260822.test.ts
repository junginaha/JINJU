import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august22EditorialCandidateAudit,
  august22EditorialComments,
  august22EditorialPosts,
  august22EditorialQualityAudit,
  august22EditorialResearchSources,
} from "../lib/daily-editorial-20260822";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 22일은 30개 후보에서 비중복 13편을 선별한다", () => {
  assert.equal(august22EditorialCandidateAudit.length, 30);
  assert.equal(august22EditorialCandidateAudit.filter((item) => item[1]).length, 13);
  assert.equal(august22EditorialPosts.length, 13);
  assert.ok(august22EditorialResearchSources.length >= 5);
});

test("8월 22일 글은 두 문장·두 단어 이름·반응·제목 논조 규칙을 지킨다", () => {
  const forms = august22EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(august22EditorialPosts.every((post) => sentenceCount(post.content) === 2));
  assert.ok(august22EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august22EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august22EditorialPosts, august22EditorialComments), []);
  assert.ok(august22EditorialPosts.every((post) => !/열여|사십오 분|45분/u.test(`${post.title} ${post.content}`)));
});

test("8월 22일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["wage-guarantee", /월급 여섯 달|회사/u, /도산대지급금|6개월/u],
    ["nakdong-algae", /초록빛 강|수돗물/u, /낙동강|유해남조류/u],
    ["venture-investment", /벤처투자|작은 창업/u, /8조 8천676억|초기기업/u],
    ["moving-elevator", /이사 엘리베이터|두 집/u, /같은 동|엘리베이터/u],
    ["bread-slice", /식빵 1센티미터|자를/u, /식빵|1센티미터/u],
    ["father-friend-names", /아버지 수첩|친구 이름/u, /수첩|이름/u],
    ["paper-notebook", /종이 노트|와이파이/u, /노트를 펴자|할 일 목록/u],
    ["piano-859", /피아노|8시 59분/u, /아랫집|연습 시간/u],
    ["bookclub-ending", /결말|북클럽/u, /소설|결말/u],
    ["cart-mystery", /장바구니|주인/u, /마트|지갑/u],
    ["date-slides", /소개팅 후기|발표자료/u, /장점·단점|발표자료/u],
    ["patient-voice", /진료실|엄마/u, /의사가|환자/u],
    ["encore-last-train", /앙코르|막차/u, /공연|막차/u],
  ] as const;

  assert.equal(anchors.length, august22EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = august22EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("8월 22일 댓글은 10~15개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = august22EditorialPosts.map((post) => august22EditorialComments(post.id).length);
  const comments = august22EditorialPosts.flatMap((post) => august22EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [10, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260822-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(august22EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of august22EditorialPosts) {
    const postComments = august22EditorialComments(post.id);
    const firstDelay = (Date.parse(postComments[0].createdAt) - Date.parse(post.createdAt)) / 60_000;
    assert.ok(firstDelay >= 3 && firstDelay <= 18);
    assert.ok(postComments.every((comment, index) => index === 0
      || Date.parse(comment.createdAt) > Date.parse(postComments[index - 1].createdAt)));
  }

  assert.ok(august22EditorialPosts.some((post) => august22EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 22일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(august22EditorialQualityAudit.length, august22EditorialPosts.length);
  for (const [index, audit] of august22EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < august22EditorialPosts[index].commentCount));
  }
});

test("8월 22일 제목과 본문은 기존 전체 피드의 글을 복제하지 않는다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260822-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of august22EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
  }
});

test("8월 22일 콘텐츠는 전체 피드와 댓글 경로에 등록된다", () => {
  for (const post of august22EditorialPosts) {
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});
