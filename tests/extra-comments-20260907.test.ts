import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { september7EditorialComments, september7EditorialPosts } from "../lib/daily-editorial-20260907";
import { september7ExtraComments } from "../lib/extra-comments-20260907";
import { normalizeCommentTimes } from "../lib/comment-time";

test("추가 댓글은 오늘 10편에만 5~10개씩 연결하고 기존 댓글을 보존한다", () => {
  let count = 0;
  for (const post of builtInPosts) {
    const extra = september7ExtraComments(post.id);
    if (!september7EditorialPosts.some((today) => today.id === post.id)) {
      assert.equal(extra.length, 0);
      continue;
    }
    assert.ok(extra.length >= 5 && extra.length <= 10);
    count += extra.length;
    const merged = builtInComments(post.id);
    for (const original of september7EditorialComments(post.id)) {
      assert.deepEqual(merged.find((comment) => comment.id === original.id), original);
    }
    for (const comment of extra) {
      assert.deepEqual(merged.find((item) => item.id === comment.id), comment);
      assert.ok(Date.parse(comment.createdAt) > Date.parse(post.createdAt));
      assert.ok(Date.parse(comment.createdAt) >= Date.parse("2026-09-07T14:40:00+09:00"));
    }
  }
  assert.equal(count, 65);
});

test("추가 댓글 작성자명은 두 단어이며 전체 기본 데이터와 중복되지 않는다", () => {
  const extra = september7EditorialPosts.flatMap((post) => september7ExtraComments(post.id));
  const ids = new Set(extra.map((comment) => comment.id));
  const allComments = builtInPosts.flatMap((post) => builtInComments(post.id));
  const existing = allComments.filter((comment) => !ids.has(comment.id));
  const oldNames = new Set([...builtInPosts.map((post) => post.displayName), ...existing.map((comment) => comment.displayName)]);
  const oldBodies = new Set(existing.map((comment) => comment.body));
  assert.equal(ids.size, extra.length);
  assert.equal(new Set(extra.map((comment) => comment.displayName)).size, extra.length);
  assert.equal(new Set(extra.map((comment) => comment.body)).size, extra.length);
  for (const comment of extra) {
    assert.equal(comment.displayName.trim().split(/\s+/u).length, 2);
    assert.ok(!oldNames.has(comment.displayName), comment.displayName);
    assert.ok(!oldBodies.has(comment.body), comment.body);
    assert.doesNotMatch(comment.body, /https?:|\d{2,3}-\d{3,4}-\d{4}|…|\.\.\.|까요\?/u);
  }
});

test("예약 댓글은 예정 시각부터만 공개된다", () => {
  for (const post of september7EditorialPosts) {
    const comments = september7ExtraComments(post.id);
    const first = Date.parse(comments[0].createdAt);
    assert.equal(normalizeCommentTimes(post.createdAt, comments, first - 1).length, 0);
    assert.equal(normalizeCommentTimes(post.createdAt, comments, first).length, 1);
  }
});
