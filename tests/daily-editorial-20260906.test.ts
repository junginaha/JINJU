import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september6EditorialCandidateAudit,
  september6EditorialComments,
  september6EditorialPosts,
  september6EditorialQualityAudit,
  september6EditorialResearchSources,
} from "../lib/daily-editorial-20260906";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("9월 6일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(september6EditorialCandidateAudit.length, 20);
  assert.equal(september6EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(september6EditorialPosts.length, 10);
  assert.ok(september6EditorialResearchSources.length >= 6);
  assert.ok(september6EditorialResearchSources.every((source) => source.startsWith("https://")));
  assert.ok(september6EditorialResearchSources.some((source) => source.includes("press.un.org")));
  assert.ok(september6EditorialResearchSources.some((source) => source.includes("apnews.com")));

  const categories = september6EditorialPosts.map((post) => post.category);
  assert.ok(categories.includes("시사"));
  assert.ok(categories.filter((category) => category === "생활").length >= 2);
  assert.ok(categories.filter((category) => category === "관계" || category === "감정").length >= 2);
  assert.ok(categories.filter((category) => category === "따뜻함" || category === "유머").length >= 4);
  assert.ok(categories.includes("책"));
});

test("9월 6일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = september6EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(september6EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(september6EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(september6EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.ok(forms.filter((form) => form === "question").length <= 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(september6EditorialPosts, september6EditorialComments), []);
});

test("9월 6일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["equal-earth-map", /세계지도|지구/u, /유엔|이퀄 어스|등면적/u],
    ["detergent-refill-label", /세제|용기/u, /세정제|라벨/u],
    ["shared-document-permission", /공유 문서|점검/u, /권한|숨김 탭/u],
    ["friend-different-choice", /조언|친구/u, /이직|결정/u],
    ["apology-not-ready", /사과|괜찮/u, /시간|회복/u],
    ["bus-stop-dry-seat", /정류장|마른 자리/u, /학생|의자/u],
    ["stroller-door-pace", /문|유모차/u, /문턱|보호자/u],
    ["dough-fingerprint-lock", /반죽|지문/u, /밀가루|비밀번호/u],
    ["kitchen-scale-tare", /전자저울|1그램/u, /영점|키친타월/u],
    ["bookclub-two-translations", /문장|번역/u, /소설|문단/u],
  ] as const;
  assert.equal(anchors.length, september6EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = september6EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("9월 6일 게시 시각과 댓글 공개 시차를 지킨다", () => {
  const counts = september6EditorialPosts.map((post) => september6EditorialComments(post.id).length);
  const comments = september6EditorialPosts.flatMap((post) => september6EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const postMinutes = september6EditorialPosts.map((post) => {
    const date = new Date(post.createdAt);
    return (date.getUTCHours() + 9) % 24 * 60 + date.getUTCMinutes();
  });
  assert.ok(postMinutes.every((minutes) => minutes >= 7 * 60 && minutes <= 22 * 60 + 30));
  assert.equal(new Set(postMinutes).size, postMinutes.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260906-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(september6EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of september6EditorialPosts) {
    const commentsForPost = september6EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(september6EditorialPosts.some((post) => september6EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("9월 6일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(september6EditorialQualityAudit.length, september6EditorialPosts.length);
  for (const [index, audit] of september6EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < september6EditorialPosts[index].commentCount));
  }
});

test("9월 6일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260906-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of september6EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("9월 6일 문장에는 금지된 어법·개인 이름·과장된 뉴스 표현이 없다", () => {
  const text = september6EditorialPosts.map((post) => `${post.title}\n${post.content}\n${september6EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /\.\.\.|…|까요\?|지현|씨앗/u);
  assert.doesNotMatch(text, /완전히 대체|사용 금지|의무 채택/u);
  const newsPost = september6EditorialPosts.find((post) => post.id.endsWith("equal-earth-map"));
  assert.ok(newsPost);
  assert.match(newsPost.content, /권고|비구속|목적/u);
});
