import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september4EditorialCandidateAudit,
  september4EditorialComments,
  september4EditorialPosts,
  september4EditorialQualityAudit,
  september4EditorialResearchSources,
} from "../lib/daily-editorial-20260904";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("9월 4일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(september4EditorialCandidateAudit.length, 20);
  assert.equal(september4EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(september4EditorialPosts.length, 10);
  assert.ok(september4EditorialResearchSources.length >= 5);

  const categories = september4EditorialPosts.map((post) => post.category);
  assert.ok(categories.includes("문화"));
  assert.ok(categories.filter((category) => category === "생활").length >= 2);
  assert.ok(categories.filter((category) => category === "관계" || category === "감정").length >= 2);
  assert.ok(categories.filter((category) => category === "따뜻함" || category === "유머").length >= 4);
  assert.ok(categories.includes("책"));
});

test("9월 4일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = september4EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(september4EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(september4EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(september4EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(september4EditorialPosts, september4EditorialComments), []);
});

test("9월 4일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["ai-gugak-context-data", /AI|국악/u, /5종|12월/u],
    ["power-strip-cord-label", /멀티탭|플러그/u, /공유기|꼬리표/u],
    ["appliance-model-photo", /모델명|찍/u, /세탁기|일련번호/u],
    ["celebrate-before-worry", /좋은 소식|걱정/u, /가족|축하/u],
    ["late-reply-reopen", /늦은 답장|안부/u, /이주|대화/u],
    ["open-bag-zipper", /가방|지퍼/u, /지하철|시선/u],
    ["laundromat-wait-note", /빨래방|메모/u, /건조|기계/u],
    ["dishwasher-lid-bowl", /식기세척기|물그릇/u, /뚜껑|아래 칸/u],
    ["duplex-upside-down", /회의자료|물구나무/u, /양면|넘김/u],
    ["bookclub-house-map", /소설|집/u, /평면도|문/u],
  ] as const;
  assert.equal(anchors.length, september4EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = september4EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("9월 4일 게시 시각과 댓글 공개 시차를 지킨다", () => {
  const counts = september4EditorialPosts.map((post) => september4EditorialComments(post.id).length);
  const comments = september4EditorialPosts.flatMap((post) => september4EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const postMinutes = september4EditorialPosts.map((post) => {
    const date = new Date(post.createdAt);
    return (date.getUTCHours() + 9) % 24 * 60 + date.getUTCMinutes();
  });
  assert.ok(postMinutes.every((minutes) => minutes >= 7 * 60 && minutes <= 22 * 60 + 30));
  assert.equal(new Set(postMinutes).size, postMinutes.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260904-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(september4EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of september4EditorialPosts) {
    const commentsForPost = september4EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(september4EditorialPosts.some((post) => september4EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("9월 4일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(september4EditorialQualityAudit.length, september4EditorialPosts.length);
  for (const [index, audit] of september4EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < september4EditorialPosts[index].commentCount));
  }
});

test("9월 4일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260904-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of september4EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("9월 4일 문장에는 금지된 번역체·개인 이름·반복 표현이 없다", () => {
  const text = september4EditorialPosts.map((post) => `${post.title}\n${post.content}\n${september4EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /써보면 합니다|장바구니를 세워|큰 공장의 감산/u);
  assert.doesNotMatch(text, /\.\.\.|…|까요\?|지현|씨앗/u);
});
