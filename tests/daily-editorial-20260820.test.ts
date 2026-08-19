import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august20EditorialCandidateAudit,
  august20EditorialComments,
  august20EditorialPosts,
  august20EditorialQualityAudit,
  august20EditorialResearchSources,
} from "../lib/daily-editorial-20260820";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 20일은 28개 후보에서 비중복 14편을 선별한다", () => {
  assert.equal(august20EditorialCandidateAudit.length, 28);
  assert.equal(august20EditorialCandidateAudit.filter((item) => item[1]).length, 14);
  assert.equal(august20EditorialPosts.length, 14);
  assert.ok(august20EditorialResearchSources.length >= 5);
});

test("8월 20일 글은 두 문장·두 단어 이름·반응·제목 논조 규칙을 지킨다", () => {
  const forms = august20EditorialPosts.map((post) => editorialTitleForm(post.title));

  assert.ok(august20EditorialPosts.every((post) => sentenceCount(post.content) === 2));
  assert.ok(august20EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august20EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august20EditorialPosts, august20EditorialComments), []);
});

test("8월 20일 제목과 본문은 같은 사건과 결론을 말한다", () => {
  const titleBodyAnchors = [
    ["jinju-daily-20260820-hynix-buyback", /40조 원|자사주/u, /40조 원|자사주/u],
    ["jinju-daily-20260820-dinner-bill", /술|똑같이/u, /와인|술값/u],
    ["jinju-daily-20260820-lock-screen-medical-id", /비상연락처|잠금화면/u, /잠긴 휴대전화|비상정보/u],
    ["jinju-daily-20260820-empathy-or-solution", /해결|공감/u, /해결책|공감/u],
    ["jinju-daily-20260820-parent-camera-towel", /거실 카메라|수건/u, /카메라|수건/u],
    ["jinju-daily-20260820-missed-restaurant-charge", /계산|다시 간/u, /계산에서 빠져|다시 가서/u],
    ["jinju-daily-20260820-salon-silence-choice", /미용실|침묵/u, /미용실|조용히/u],
    ["jinju-daily-20260820-rider-restroom", /배달기사|화장실/u, /배달기사|화장실/u],
    ["jinju-daily-20260820-cake-revisions", /케이크|수정 18번/u, /케이크|18번째/u],
    ["jinju-daily-20260820-borrowed-book-stain", /커피 얼룩|빌린 책/u, /책|커피 얼룩/u],
    ["jinju-daily-20260820-mother-voice-message", /엄마|음성메시지|2초/u, /엄마|2초|숨/u],
    ["jinju-daily-20260820-work-request-channels", /업무 요청|한곳/u, /수정 요청|창구 하나/u],
    ["jinju-daily-20260820-smart-doorbell-corridor", /현관 카메라|귀가/u, /스마트 초인종|귀가 시간/u],
    ["jinju-daily-20260820-power-peak", /전력 피크|절약/u, /최대 전력수요|절약 요청/u],
  ] as const;

  assert.equal(titleBodyAnchors.length, august20EditorialPosts.length);
  for (const [postId, titleAnchor, bodyAnchor] of titleBodyAnchors) {
    const post = august20EditorialPosts.find((candidate) => candidate.id === postId);
    assert.ok(post);
    assert.match(post.title, titleAnchor);
    assert.match(post.content, bodyAnchor);
  }
});

test("8월 20일 댓글은 10~15개로 달리하고 실제 공개시각을 지킨다", () => {
  const counts = august20EditorialPosts.map((post) => august20EditorialComments(post.id).length);
  const comments = august20EditorialPosts.flatMap((post) => august20EditorialComments(post.id));
  const discouragedNameWords = /웃음난|빵터진|울고있는|화난|지현|철수|영희/u;

  assert.deepEqual(counts, [10, 11, 12, 13, 14, 15, 10, 11, 12, 13, 14, 15, 10, 11]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.ok(comments.every((comment) => !discouragedNameWords.test(comment.displayName)));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260820-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(august20EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of august20EditorialPosts) {
    const postComments = august20EditorialComments(post.id);
    const firstDelay = (Date.parse(postComments[0].createdAt) - Date.parse(post.createdAt)) / 60_000;
    assert.ok(firstDelay >= 3 && firstDelay <= 18);
    assert.ok(postComments.every((comment, index) => index === 0
      || Date.parse(comment.createdAt) > Date.parse(postComments[index - 1].createdAt)));
  }

  assert.ok(august20EditorialPosts.some((post) => august20EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 20일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(august20EditorialQualityAudit.length, august20EditorialPosts.length);
  for (const [index, audit] of august20EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    const commentCount = august20EditorialPosts[index].commentCount;
    assert.ok([...audit.humor, ...audit.practical].every((commentIndex) => commentIndex < commentCount));
  }
});

test("8월 20일 제목과 본문은 기존 전체 피드의 글을 복제하지 않는다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260820-"));
  const duplicatePost = createDuplicatePostChecker();

  for (const post of august20EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
  }
});

test("8월 20일 콘텐츠는 전체 피드와 댓글 경로에 등록된다", () => {
  for (const post of august20EditorialPosts) {
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});
