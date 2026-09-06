import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september7EditorialCandidateAudit,
  september7EditorialComments,
  september7EditorialPosts,
  september7EditorialQualityAudit,
  september7EditorialResearchSources,
} from "../lib/daily-editorial-20260907";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("9월 7일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(september7EditorialCandidateAudit.length, 20);
  assert.equal(september7EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(september7EditorialPosts.length, 10);
  assert.ok(september7EditorialResearchSources.length >= 6);
  assert.ok(september7EditorialResearchSources.every((source) => source.startsWith("https://")));
  assert.ok(september7EditorialResearchSources.some((source) => source.includes("improbable.com")));
  assert.ok(september7EditorialResearchSources.some((source) => source.includes("apnews.com")));

  const categories = september7EditorialPosts.map((post) => post.category);
  assert.ok(categories.includes("시사"));
  assert.ok(categories.filter((category) => category === "생활").length >= 2);
  assert.ok(categories.filter((category) => category === "관계" || category === "감정").length >= 2);
  assert.ok(categories.filter((category) => category === "따뜻함" || category === "유머").length >= 4);
  assert.ok(categories.includes("책"));
});

test("9월 7일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = september7EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(september7EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(september7EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(september7EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.ok(forms.filter((form) => form === "question").length <= 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(september7EditorialPosts, september7EditorialComments), []);
});

test("9월 7일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["ig-nobel-questions", /웃긴 연구|시상식/u, /이그노벨상|취리히/u],
    ["calendar-two-timezones", /캘린더|시간대/u, /서울|파리/u],
    ["parking-column-photo", /주차 위치|사진/u, /층수|기둥/u],
    ["short-video-replies", /짧은 영상|답장/u, /친구|반응/u],
    ["accepting-compliments", /칭찬|해명/u, /발표|고맙/u],
    ["foodcourt-napkins", /쏟은 물|점심/u, /푸드코트|냅킨/u],
    ["rolling-coins", /계산대|발끝/u, /동전|지갑/u],
    ["duvet-cover-maze", /이불 커버|사라진/u, /모서리|천 유령/u],
    ["microwave-coffee", /전자레인지|커피/u, /데워|첫 잔/u],
    ["narrator-evidence-bookclub", /화자|북클럽/u, /문장|추측/u],
  ] as const;
  assert.equal(anchors.length, september7EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = september7EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("9월 7일 게시 시각과 댓글 공개 시차를 지킨다", () => {
  const counts = september7EditorialPosts.map((post) => september7EditorialComments(post.id).length);
  const comments = september7EditorialPosts.flatMap((post) => september7EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const postMinutes = september7EditorialPosts.map((post) => {
    const date = new Date(post.createdAt);
    return (date.getUTCHours() + 9) % 24 * 60 + date.getUTCMinutes();
  });
  assert.ok(postMinutes.every((minutes) => minutes >= 7 * 60 && minutes <= 22 * 60 + 30));
  assert.equal(new Set(postMinutes).size, postMinutes.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260907-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(september7EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of september7EditorialPosts) {
    const commentsForPost = september7EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(september7EditorialPosts.some((post) => september7EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("9월 7일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(september7EditorialQualityAudit.length, september7EditorialPosts.length);
  for (const [index, audit] of september7EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < september7EditorialPosts[index].commentCount));
  }
});

test("9월 7일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260907-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of september7EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("9월 7일 문장에는 금지된 어법·개인 이름·과장된 뉴스 표현이 없다", () => {
  const text = september7EditorialPosts.map((post) => `${post.title}\n${post.content}\n${september7EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /\.\.\.|…|까요\?|지현|씨앗/u);
  assert.doesNotMatch(text, /노벨상 수상|세계 최초 식품|효능이 입증/u);
  const newsPost = september7EditorialPosts.find((post) => post.id.endsWith("ig-nobel-questions"));
  assert.ok(newsPost);
  assert.match(newsPost.content, /9월 3일|취리히|열 팀/u);
});
