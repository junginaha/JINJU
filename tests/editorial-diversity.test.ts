import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { editorialDiversityIssues, editorialTitleForm } from "../lib/editorial-diversity";
import { august13MorningComments, august13MorningPosts } from "../lib/morning-editorial-20260813";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function sentenceCount(value: string) {
  const withoutDecimals = value.replace(/(\d)\.(\d)/gu, "$1·$2");
  return withoutDecimals.match(/[^.!?。！？]+[.!?。！？]+/gu)?.length ?? 0;
}

test("8월 13일 편집 콘텐츠는 글마다 다른 댓글 수와 관점 배열을 사용한다", () => {
  const comments = august13MorningPosts.map((post) => august13MorningComments(post.id));

  assert.equal(august13MorningPosts.length, 6);
  assert.deepEqual(comments.map((items) => items.length), [7, 6, 10, 8, 7, 9]);
  assert.deepEqual(editorialDiversityIssues(august13MorningPosts, august13MorningComments), []);
});

test("8월 13일 편집 콘텐츠는 공개 문장과 작성자 규칙을 지킨다", () => {
  const comments = august13MorningPosts.flatMap((post) => august13MorningComments(post.id));

  assert.ok(august13MorningPosts.every((post) => sentenceCount(post.content) === 2));
  assert.ok(comments.every((item) => sentenceCount(item.body) === 2));
  assert.ok(august13MorningPosts.every((post) => wordCount(String(post.displayName)) === 2));
  assert.ok(comments.every((item) => wordCount(String(item.displayName)) === 2));
  assert.ok(august13MorningPosts.every((post) => post.heard >= 20 && post.heard <= 33));
  assert.equal(new Set(comments.map((item) => item.displayName)).size, comments.length);
  assert.equal(new Set(comments.map((item) => item.body)).size, comments.length);
});

test("8월 13일 제목은 질문형을 반복하지 않고 여러 논조를 섞는다", () => {
  const forms = august13MorningPosts.map((post) => editorialTitleForm(post.title));

  assert.equal(forms.filter((form) => form === "question").length, 0);
  assert.ok(new Set(forms).size >= 4);
  assert.equal(new Set(august13MorningPosts.map((post) => post.title)).size, august13MorningPosts.length);
});

test("8월 13일 콘텐츠는 전체 피드와 댓글 경로에 등록된다", () => {
  for (const post of august13MorningPosts) {
    assert.ok(builtInPosts.some((candidate) => candidate.id === post.id));
    assert.equal(builtInComments(post.id).length, post.commentCount);
  }
});

test("편집 다양성 검사는 질문형과 작성자 반복을 차단한다", () => {
  const repeated = august13MorningPosts.map((post, index) => ({
    ...post,
    title: `같은 질문 ${index + 1}일까요?`,
    displayName: "같은 사람",
  }));
  const issues = editorialDiversityIssues(repeated, august13MorningComments);

  assert.ok(issues.includes("게시글 작성자명이 중복됩니다."));
  assert.ok(issues.includes("질문형 제목은 하루 한 편을 넘을 수 없습니다."));
});
