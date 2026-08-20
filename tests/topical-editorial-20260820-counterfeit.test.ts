import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  counterfeitReportingComments,
  counterfeitReportingPost,
  counterfeitReportingResearchSources,
} from "../lib/topical-editorial-20260820-counterfeit";
import { editorialDiversityIssues } from "../lib/editorial-diversity";

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

test("가품 신고 글은 첨부 화면의 식별정보를 노출하지 않는다", () => {
  const publicText = [
    counterfeitReportingPost.title,
    counterfeitReportingPost.content,
    ...counterfeitReportingComments(counterfeitReportingPost.id).map((comment) => comment.body),
  ].join("\n");

  assert.equal(counterfeitReportingResearchSources.length, 2);
  assert.doesNotMatch(publicText, /압구정|청담|성수|신사|카카오|0625|open\.kakao|툴립매니아/u);
});

test("제목과 본문은 가품 신고 뒤 신고자 계정 정지라는 같은 사건을 말한다", () => {
  assert.match(counterfeitReportingPost.title, /가품|신고|계정/u);
  assert.match(counterfeitReportingPost.content, /가품|신고|계정이 먼저 정지/u);
  assert.equal((counterfeitReportingPost.content.match(/[.!?。！？]+/gu) ?? []).length, 2);
});

test("댓글 12개는 두 단어 이름과 시차 공개 규칙을 지킨다", () => {
  const comments = counterfeitReportingComments(counterfeitReportingPost.id);
  const postTime = Date.parse(counterfeitReportingPost.createdAt);

  assert.equal(comments.length, 12);
  assert.ok(comments.every((comment) => wordCount(comment.displayName) === 2));
  assert.ok(comments.every((comment) => Date.parse(comment.createdAt) > postTime));
  assert.ok(comments.some((comment) => Date.parse(comment.createdAt) > postTime + 12 * 60 * 60_000));
  assert.deepEqual(editorialDiversityIssues([counterfeitReportingPost], counterfeitReportingComments), []);
});

test("새 작성자명은 전체 기존 데이터와 겹치지 않고 피드에 한 번만 연결된다", () => {
  const postOccurrences = builtInPosts.filter((post) => post.id === counterfeitReportingPost.id);
  const comments = builtInComments(counterfeitReportingPost.id);
  const existingPostNames = new Set(
    builtInPosts
      .filter((post) => post.id !== counterfeitReportingPost.id)
      .map((post) => String(post.displayName).trim()),
  );
  const existingCommentNames = new Set(
    builtInPosts
      .filter((post) => post.id !== counterfeitReportingPost.id)
      .flatMap((post) => builtInComments(post.id))
      .map((comment) => comment.displayName.trim()),
  );

  assert.equal(postOccurrences.length, 1);
  assert.equal(comments.length, 12);
  assert.ok(!existingPostNames.has(String(counterfeitReportingPost.displayName).trim()));
  assert.ok(comments.every((comment) => !existingCommentNames.has(comment.displayName.trim())));
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, comments.length);
});
