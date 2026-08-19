import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august19EditorialCandidateAudit,
  august19EditorialComments,
  august19EditorialPosts,
  august19EditorialQualityAudit,
  august19EditorialResearchSources,
} from "../lib/daily-editorial-20260819";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 19일은 30개 후보에서 비중복 15편을 선별한다", () => {
  assert.equal(august19EditorialCandidateAudit.length, 30);
  assert.equal(august19EditorialCandidateAudit.filter((item) => item[1]).length, 15);
  assert.equal(august19EditorialPosts.length, 15);
  assert.ok(august19EditorialResearchSources.length >= 5);
});

test("8월 19일 글은 문장·이름·반응·제목 논조 규칙을 지킨다", () => {
  const forms = august19EditorialPosts.map((post) => editorialTitleForm(post.title));

  assert.ok(august19EditorialPosts.every((post) => sentenceCount(post.content) === 2));
  assert.ok(august19EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august19EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august19EditorialPosts, august19EditorialComments), []);
});

test("8월 19일 공개 문장은 한국 게시글처럼 숫자를 자연스럽게 표기한다", () => {
  const publicText = august19EditorialPosts.flatMap((post) => [
    post.title,
    post.content,
    ...august19EditorialComments(post.id).map((comment) => comment.body),
  ]).join("\n");
  const awkwardWrittenNumbers = /마흔다섯|열아홉|이십 분|삼십 분|오천 원|십 년|십이 분|여덟 분|사십 분|여섯 분|십 분|여섯 달/u;
  const callPost = august19EditorialPosts.find((post) => post.id === "jinju-daily-20260819-long-short-call");

  assert.ok(callPost);
  assert.equal(callPost.title, "잠깐 통화하자더니 45분째입니다");
  assert.match(callPost.content, /45분/u);
  assert.doesNotMatch(publicText, awkwardWrittenNumbers);
});

test("8월 19일 제목은 본문에 없는 결론을 덧붙이지 않는다", () => {
  const titleBodyAnchors = [
    ["jinju-daily-20260819-ulchi-self-defense", /훈련|자주국방/u, /한미 연합훈련|독자 역량/u],
    ["jinju-daily-20260819-rain-commute-stop", /비|출근/u, /폭우|출근/u],
    ["jinju-daily-20260819-wang-yi-visit", /왕이|방한/u, /중국 외교부장|한국/u],
    ["jinju-daily-20260819-dawn-weather-neighbor", /새벽 3시|동대표/u, /동대표|공식 알림/u],
    ["jinju-daily-20260819-long-short-call", /통화|45분/u, /통화|45분/u],
    ["jinju-daily-20260819-mother-dinner-photos", /엄마|19장/u, /엄마|19장/u],
    ["jinju-daily-20260819-laundromat-clothes", /세탁|20분|남의 옷/u, /세탁|20분|옷/u],
    ["jinju-daily-20260819-rainy-dog-dryer", /강아지|장마/u, /강아지|소나기/u],
    ["jinju-daily-20260819-used-market-lesson", /중고거래|사용법/u, /선풍기|사용법/u],
    ["jinju-daily-20260819-half-rice", /반 공기/u, /반 공기/u],
    ["jinju-daily-20260819-peach-repayment", /5천 원|10년/u, /5천 원|10년/u],
    ["jinju-daily-20260819-trip-spreadsheet", /여행 계획표|화장실/u, /여행표|화장실/u],
    ["jinju-daily-20260819-bookclub-object", /물건|북클럽/u, /물건|모임/u],
    ["jinju-daily-20260819-medicine-colors", /약|색깔|이름/u, /약 이름|색/u],
    ["jinju-daily-20260819-grandmother-first-pay", /여름방학 숙제|할머니/u, /숙제|할머니/u],
  ] as const;

  assert.equal(titleBodyAnchors.length, august19EditorialPosts.length);
  for (const [postId, titleAnchor, bodyAnchor] of titleBodyAnchors) {
    const post = august19EditorialPosts.find((candidate) => candidate.id === postId);
    assert.ok(post);
    assert.match(post.title, titleAnchor);
    assert.match(post.content, bodyAnchor);
  }

  const laundryPost = august19EditorialPosts.find((post) => post.id === "jinju-daily-20260819-laundromat-clothes");
  assert.equal(laundryPost?.title, "세탁 끝난 지 20분, 남의 옷 앞에서 고민했습니다");
  assert.doesNotMatch(laundryPost?.title ?? "", /손대지 맙시다/u);
});

test("8월 19일 댓글은 10~13개로 달리하고 시차·고급 두 단어 이름을 지킨다", () => {
  const counts = august19EditorialPosts.map((post) => august19EditorialComments(post.id).length);
  const comments = august19EditorialPosts.flatMap((post) => august19EditorialComments(post.id));
  const discouragedNameWords = /웃음난|빵터진|울고있는|화난|지현|철수|영희/u;

  assert.deepEqual(counts, [10, 11, 12, 13, 10, 11, 12, 13, 10, 11, 12, 13, 10, 11, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.ok(comments.every((comment) => !discouragedNameWords.test(comment.displayName)));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  for (const post of august19EditorialPosts) {
    const postComments = august19EditorialComments(post.id);
    const firstDelay = (Date.parse(postComments[0].createdAt) - Date.parse(post.createdAt)) / 60_000;
    assert.ok(firstDelay >= 3 && firstDelay <= 18);
    assert.ok(postComments.every((comment, index) => index === 0
      || Date.parse(comment.createdAt) > Date.parse(postComments[index - 1].createdAt)));
  }

  assert.ok(august19EditorialPosts.some((post) => august19EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 19일은 민감한 재난 글을 제외한 모든 글에 유머와 실용 댓글을 표시한다", () => {
  assert.equal(august19EditorialQualityAudit.length, august19EditorialPosts.length);
  for (const [index, audit] of august19EditorialQualityAudit.entries()) {
    assert.ok(audit.practical.length >= 2);
    if (index !== 1) assert.ok(audit.humor.length >= 2);
    const commentCount = august19EditorialPosts[index].commentCount;
    assert.ok([...audit.humor, ...audit.practical].every((commentIndex) => commentIndex < commentCount));
  }
});

test("8월 19일 제목과 본문은 기존 전체 피드의 글을 복제하지 않는다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260819-"));
  const duplicatePost = createDuplicatePostChecker();

  for (const post of august19EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
  }
});

test("8월 19일 콘텐츠는 전체 피드와 댓글 경로에 등록된다", () => {
  for (const post of august19EditorialPosts) {
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});
