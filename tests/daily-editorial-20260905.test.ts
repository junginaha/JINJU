import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september5EditorialCandidateAudit,
  september5EditorialComments,
  september5EditorialPosts,
  september5EditorialQualityAudit,
  september5EditorialResearchSources,
} from "../lib/daily-editorial-20260905";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("9월 5일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(september5EditorialCandidateAudit.length, 20);
  assert.equal(september5EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(september5EditorialPosts.length, 10);
  assert.ok(september5EditorialResearchSources.length >= 5);

  const categories = september5EditorialPosts.map((post) => post.category);
  assert.ok(categories.includes("시사"));
  assert.ok(categories.filter((category) => category === "생활").length >= 2);
  assert.ok(categories.filter((category) => category === "관계" || category === "감정").length >= 2);
  assert.ok(categories.filter((category) => category === "따뜻함" || category === "유머").length >= 4);
  assert.ok(categories.includes("책"));
});

test("9월 5일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = september5EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(september5EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(september5EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(september5EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(september5EditorialPosts, september5EditorialComments), []);
});

test("9월 5일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["sports-record-plan", /운동 기록|포인트/u, /120만|110곳|2027/u],
    ["travel-return-list", /여행 가방|귀가 목록/u, /충전기|콘센트/u],
    ["tailoring-before-photo", /수선|출발 사진/u, /소매|접수증/u],
    ["borrowed-scratch-tell", /빌린 물건|흠집/u, /여행 가방|수리/u],
    ["group-photo-exclusion", /모임 사진|없었/u, /초대|상상/u],
    ["gallery-child-height", /전시장|눈높이/u, /노란 점|무릎/u],
    ["rider-rolling-ball", /굴러간 공|배달원/u, /차도|골목/u],
    ["ice-tray-ingredients", /얼음|가족회의/u, /마늘|멸치육수/u],
    ["delivery-address-label", /배달 주소|별칭/u, /야식 본부|요청사항/u],
    ["bookclub-apology-grid", /소설|사과/u, /잘못|영향|바꿀/u],
  ] as const;
  assert.equal(anchors.length, september5EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = september5EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("9월 5일 게시 시각과 댓글 공개 시차를 지킨다", () => {
  const counts = september5EditorialPosts.map((post) => september5EditorialComments(post.id).length);
  const comments = september5EditorialPosts.flatMap((post) => september5EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const postMinutes = september5EditorialPosts.map((post) => {
    const date = new Date(post.createdAt);
    return (date.getUTCHours() + 9) % 24 * 60 + date.getUTCMinutes();
  });
  assert.ok(postMinutes.every((minutes) => minutes >= 7 * 60 && minutes <= 22 * 60 + 30));
  assert.equal(new Set(postMinutes).size, postMinutes.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260905-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(september5EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of september5EditorialPosts) {
    const commentsForPost = september5EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(september5EditorialPosts.some((post) => september5EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("9월 5일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(september5EditorialQualityAudit.length, september5EditorialPosts.length);
  for (const [index, audit] of september5EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < september5EditorialPosts[index].commentCount));
  }
});

test("9월 5일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260905-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of september5EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("9월 5일 문장에는 금지된 번역체·개인 이름·반복 표현이 없다", () => {
  const text = september5EditorialPosts.map((post) => `${post.title}\n${post.content}\n${september5EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /써보면 합니다|장바구니를 세워|큰 공장의 감산/u);
  assert.doesNotMatch(text, /\.\.\.|…|까요\?|지현|씨앗/u);
  const newsPost = september5EditorialPosts.find((post) => post.id.endsWith("sports-record-plan"));
  assert.ok(newsPost);
  assert.match(newsPost.content, /계획|추진|확인/u);
});
