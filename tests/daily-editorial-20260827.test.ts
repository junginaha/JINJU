import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  august27EditorialCandidateAudit,
  august27EditorialComments,
  august27EditorialPosts,
  august27EditorialQualityAudit,
  august27EditorialResearchSources,
} from "../lib/daily-editorial-20260827";
import { createDuplicatePostChecker } from "../lib/dedup";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 27일은 후보 20개에서 비중복 콘텐츠 10편을 선별한다", () => {
  assert.equal(august27EditorialCandidateAudit.length, 20);
  assert.equal(august27EditorialCandidateAudit.filter((item) => item[1]).length, 10);
  assert.equal(august27EditorialPosts.length, 10);
  assert.ok(august27EditorialResearchSources.length >= 4);
});

test("8월 27일 글은 자연스러운 2~4문장과 다양한 제목 논조를 지킨다", () => {
  const forms = august27EditorialPosts.map((post) => editorialTitleForm(post.title));
  assert.ok(august27EditorialPosts.every((post) => {
    const count = sentenceCount(post.content);
    return count >= 2 && count <= 4;
  }));
  assert.ok(august27EditorialPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(august27EditorialPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(forms.filter((form) => form === "question").length, 1);
  assert.ok(new Set(forms).size >= 4);
  assert.deepEqual(editorialDiversityIssues(august27EditorialPosts, august27EditorialComments), []);
});

test("8월 27일 제목과 본문은 같은 장면을 가리킨다", () => {
  const anchors = [
    ["pharmacy-name-law", /약국 이름|가격/u, /약사법|약국 이름/u],
    ["robot-vacuum-escape", /로봇청소기|가출/u, /현관 턱|복도/u],
    ["father-radio-station", /아버지 라디오|출근/u, /교통방송|출근길/u],
    ["housewarming-screwdriver", /집들이 선물|물어봅시다/u, /십자드라이버|조립/u],
    ["earphone-bike-alley", /골목|이어폰/u, /자전거 벨|음량/u],
    ["cat-video-meeting", /화상회의|고양이/u, /노트북|꼬리/u],
    ["bookclub-blind-cover", /표지|책/u, /북클럽|첫 두 쪽/u],
    ["monthly-postcard-friend", /친구|한 달에 한 장/u, /엽서|답장/u],
    ["cafe-phone-charge", /카페|휴대전화/u, /충전기|비용/u],
    ["family-photo-album", /흑역사|가족 앨범/u, /졸업사진|사진 뒷면/u],
  ] as const;
  assert.equal(anchors.length, august27EditorialPosts.length);
  for (const [idPart, titlePattern, bodyPattern] of anchors) {
    const post = august27EditorialPosts.find((candidate) => candidate.id.endsWith(idPart));
    assert.ok(post);
    assert.match(post.title, titlePattern);
    assert.match(post.content, bodyPattern);
  }
});

test("8월 27일 댓글은 9~12개로 달리하고 게시 뒤 순차 공개된다", () => {
  const counts = august27EditorialPosts.map((post) => august27EditorialComments(post.id).length);
  const comments = august27EditorialPosts.flatMap((post) => august27EditorialComments(post.id));
  assert.deepEqual([...counts].sort((a, b) => a - b), [9, 9, 9, 10, 10, 10, 11, 11, 12, 12]);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);

  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260827-"));
  const oldPostNames = new Set(oldPosts.map((post) => String(post.displayName)));
  const oldCommentNames = new Set(oldPosts.flatMap((post) => builtInComments(post.id).map((comment) => comment.displayName)));
  assert.ok(august27EditorialPosts.every((post) => !oldPostNames.has(String(post.displayName))));
  assert.ok(comments.every((comment) => !oldCommentNames.has(comment.displayName)));

  for (const post of august27EditorialPosts) {
    const commentsForPost = august27EditorialComments(post.id);
    const firstThree = commentsForPost.slice(0, 3).map((comment) => (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60_000);
    assert.ok(firstThree.every((minutes) => minutes >= 3 && minutes <= 18));
    assert.ok(commentsForPost.every((comment, index) => index === 0 || Date.parse(comment.createdAt) > Date.parse(commentsForPost[index - 1].createdAt)));
  }
  assert.ok(august27EditorialPosts.some((post) => august27EditorialComments(post.id)
    .some((comment) => Date.parse(comment.createdAt) - Date.parse(post.createdAt) > 24 * 60 * 60_000)));
});

test("8월 27일 모든 글에는 유머와 실용 댓글이 각각 두 개 이상 있다", () => {
  assert.equal(august27EditorialQualityAudit.length, august27EditorialPosts.length);
  for (const [index, audit] of august27EditorialQualityAudit.entries()) {
    assert.ok(audit.humor.length >= 2);
    assert.ok(audit.practical.length >= 2);
    assert.ok([...audit.humor, ...audit.practical].every((item) => item < august27EditorialPosts[index].commentCount));
  }
});

test("8월 27일 콘텐츠는 기존 피드와 겹치지 않고 공개 경로에 등록된다", () => {
  const oldPosts = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260827-"));
  const duplicatePost = createDuplicatePostChecker();
  for (const post of august27EditorialPosts) {
    assert.ok(!oldPosts.some((oldPost) => duplicatePost(post, oldPost)), post.title);
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("8월 27일 문장에는 이전에 지적된 번역체와 어색한 표현이 없다", () => {
  const text = august27EditorialPosts.map((post) => `${post.title}\n${post.content}\n${august27EditorialComments(post.id).map((comment) => comment.body).join("\n")}`).join("\n");
  assert.doesNotMatch(text, /써보면 합니다|장바구니를 세워|미사일 열여발|큰 공장의 감산/u);
  assert.doesNotMatch(text, /\.{3,}|…/u);
});
