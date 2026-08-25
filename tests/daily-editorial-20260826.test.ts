import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august26EditorialCandidateAudit,
  august26EditorialComments,
  august26EditorialPosts,
  august26EditorialQualityAudit,
  august26EditorialResearchSources,
} from "../lib/daily-editorial-20260826";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";
import { LOW_COMMENT_TARGET_IDS, lowCommentAdditions } from "../lib/low-comment-additions-20260826";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 26일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(august26EditorialCandidateAudit.length, 20);
  assert.equal(august26EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(august26EditorialPosts.length, 10);
  assert.ok(august26EditorialResearchSources.length >= 3);
});

test("8월 26일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = august26EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(august26EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(august26EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august26EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august26EditorialPosts, august26EditorialComments), []);
});

test("8월 26일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["nuri-fifth-launch", /누리호/u, /누리호 5호기|위성/u],
    ["family-voice-message", /음성메시지/u, /7분짜리 음성메시지/u],
    ["small-reservation-rule", /예약금|취소/u, /공방|취소/u],
    ["quick-call-before-leaving", /퇴근|잠깐/u, /38분|통화/u],
    ["parent-kiosk-practice", /키오스크/u, /무인 주문|직접 주문/u],
    ["parcel-label-privacy", /택배 상자|이름/u, /송장|주소/u],
    ["bookclub-unfinished", /읽지 않은 책|토론/u, /북클럽|완독/u],
    ["elevator-child-smile", /엘리베이터|아이/u, /유모차|웃었/u],
    ["friends-saving-fine", /저축 모임|벌금/u, /여행비|벌금/u],
    ["medicine-bag-icons", /약 봉투|해와 달/u, /약 봉투|스티커/u],
  ] as const;
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = august26EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("8월 26일 댓글은 9~12개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = august26EditorialPosts.map((post) => august26EditorialComments(post.id).length);
  const comments = august26EditorialPosts.flatMap((post) => august26EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 9, 10, 10, 10, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);
  for (const post of august26EditorialPosts) {
    const commentsForPost = august26EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(august26EditorialPosts.some((post) => august26EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 26일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(august26EditorialQualityAudit.length, august26EditorialPosts.length);
  for (const [index, audit] of august26EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < august26EditorialPosts[index].commentCount));
  }
});

test("8월 26일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260826-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of august26EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("댓글 5개 이하였던 운영 글 33편에 맥락형 댓글을 5개씩 보강한다", () => {
  assert.equal(LOW_COMMENT_TARGET_IDS.size, 33);
  const comments = [...LOW_COMMENT_TARGET_IDS].flatMap((postId) => lowCommentAdditions(postId, "2026-07-01T00:00:00+09:00"));
  assert.equal(comments.length, 165);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.id)).size, comments.length);
  assert.ok(comments.every((comment) => Date.parse(comment.createdAt) > Date.parse("2026-07-01T00:00:00+09:00")));
});
