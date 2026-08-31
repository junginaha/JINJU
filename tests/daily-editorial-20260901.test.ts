import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september1EditorialCandidateAudit,
  september1EditorialComments,
  september1EditorialPosts,
  september1EditorialQualityAudit,
  september1EditorialResearchSources,
} from "../lib/daily-editorial-20260901";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("9월 1일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(september1EditorialCandidateAudit.length, 20);
  assert.equal(september1EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(september1EditorialPosts.length, 10);
  assert.ok(september1EditorialResearchSources.length >= 4);
});

test("9월 1일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = september1EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(september1EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(september1EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(september1EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(september1EditorialPosts, september1EditorialComments), []);
});

test("9월 1일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["floor-noise-chatbot", /층간소음|상담/u, /9월|챗봇/u],
    ["phone-repair-preview", /수리|휴대전화/u, /알림|백업/u],
    ["battery-separation", /건전지|보관/u, /새것|교체/u],
    ["friends-without-me", /소개한|친해졌/u, /여행|관계/u],
    ["family-photographer", /가족 사진|누가/u, /촬영|타이머/u],
    ["tomato-pickup", /방울토마토|여덟 손/u, /마트|카트/u],
    ["locker-privacy-help", /택배함|이웃/u, /비밀번호|메뉴/u],
    ["watch-dishwashing-swim", /스마트워치|설거지/u, /수영|그릇/u],
    ["phone-fridge-alarm", /냉장고|알람/u, /휴대전화|장바구니/u],
    ["bookclub-rent-budget", /주인공|월세/u, /북클럽|수입/u],
  ] as const;
  assert.equal(anchors.length, september1EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = september1EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("9월 1일 댓글은 9~12개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = september1EditorialPosts.map((post) => september1EditorialComments(post.id).length);
  const comments = september1EditorialPosts.flatMap((post) => september1EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 10, 10, 10, 11, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260901-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(september1EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of september1EditorialPosts) {
    const commentsForPost = september1EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(september1EditorialPosts.some((post) => september1EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("9월 1일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(september1EditorialQualityAudit.length, september1EditorialPosts.length);
  for (const [index, audit] of september1EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < september1EditorialPosts[index].commentCount));
  }
});

test("9월 1일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260901-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of september1EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("9월 1일 문장에는 금지된 번역체·개인 이름·반복 표현이 없다", () => {
  const text = september1EditorialPosts.map((post) => `${post.title}\n${post.content}\n${september1EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /써보면 합니다|장바구니를 세워|큰 공장의 감산/u);
  assert.doesNotMatch(text, /\.\.\.|…|까요\?|지현|씨앗/u);
});
