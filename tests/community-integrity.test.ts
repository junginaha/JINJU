import assert from "node:assert/strict";
import test from "node:test";
import {
  combineBaseAndStoredComments,
  hasCompleteAutoCommentSet,
  mergeBaseCommentsByBody,
} from "../lib/comment-visibility";
import { autoCommentDisplayName, validatedAutoCommentBodies } from "../lib/auto-comments";
import { AUTO_COMMENT_TOTAL, newPostCommentSchedule, newPostInitialLikes } from "../lib/community-settings";
import { july30EditorialComments, july30EditorialPosts } from "../lib/daily-editorial-20260730";
import { august1EditorialComments, august1EditorialPosts } from "../lib/daily-editorial-20260801";
import { august2EditorialComments, august2EditorialPosts } from "../lib/daily-editorial-20260802";
import { august3EditorialComments, august3EditorialPosts } from "../lib/daily-editorial-20260803";
import { generateJinjuDisplayName } from "../lib/display-name";
import { activeReactionHistory, recordReaction } from "../lib/reaction-history";
import {
  AUTO_COMMENT_MAX_ATTEMPTS,
  runAutoCommentAttempts,
} from "../lib/auto-comment-jobs";

test("new posts receive the complete immediate and hourly comment schedule", () => {
  const start = "2026-07-29T00:00:00.000Z";
  const schedule = newPostCommentSchedule(start);
  assert.equal(schedule.length, AUTO_COMMENT_TOTAL);
  assert.deepEqual(schedule.slice(0, 3), [
    "2026-07-29T00:00:00.000Z",
    "2026-07-29T00:00:01.000Z",
    "2026-07-29T00:00:02.000Z",
  ]);
  assert.equal(schedule.at(-1), "2026-07-29T12:00:00.000Z");
});

test("automatic comments must be a complete unique set", () => {
  const bodies = Array.from({ length: AUTO_COMMENT_TOTAL }, (_, index) => `댓글 ${index + 1}`);
  assert.equal(validatedAutoCommentBodies(bodies).length, AUTO_COMMENT_TOTAL);
  assert.throws(() => validatedAutoCommentBodies(bodies.slice(1)));
  assert.throws(() => validatedAutoCommentBodies([...bodies.slice(0, -1), bodies[0]]));
});

test("automatic comment work retries at most three times", async () => {
  const failures: Array<{ attempt: number; final: boolean }> = [];
  const result = await runAutoCommentAttempts(
    async () => {
      throw new Error("generation failed");
    },
    {
      onFailure: ({ attempt, final }) => {
        failures.push({ attempt, final });
      },
    },
  );
  assert.deepEqual(result, {
    ok: false,
    attempt: AUTO_COMMENT_MAX_ATTEMPTS,
    error: result.error,
  });
  assert.deepEqual(failures, [
    { attempt: 1, final: false },
    { attempt: 2, final: false },
    { attempt: 3, final: true },
  ]);
});

test("automatic comment work stops retrying after success", async () => {
  let calls = 0;
  const result = await runAutoCommentAttempts(async () => {
    calls += 1;
    if (calls < 2) throw new Error("transient failure");
  });
  assert.deepEqual(result, { ok: true, attempt: 2 });
  assert.equal(calls, 2);
});

test("new post likes stay between 20 and 33", () => {
  assert.equal(newPostInitialLikes(0), 20);
  assert.equal(newPostInitialLikes(0.5), 27);
  assert.equal(newPostInitialLikes(0.999999), 33);
});

test("future post and automatic comment names use exactly two words", () => {
  for (let index = 0; index < 128; index += 1) {
    assert.equal(generateJinjuDisplayName().trim().split(/\s+/).length, 2);
    assert.equal(autoCommentDisplayName(`post-${index}`, index).trim().split(/\s+/).length, 2);
  }
});

test("July 30 posts use two-word names and 20-33 likes", () => {
  assert.equal(july30EditorialPosts.length, 10);
  for (const post of july30EditorialPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    const comments = july30EditorialComments(post.id);
    assert.equal(comments.length, post.commentCount);
    for (const comment of comments) {
      assert.equal(comment.displayName.trim().split(/\s+/).length, 2);
    }
  }
});

test("August 1 posts use two-word names, 20-33 likes, and complete comments", () => {
  const requestedIds = new Set([
    "jinju-seed-20260801-trip-cancellation-cost",
    "jinju-seed-20260801-advice-before-empathy",
    "jinju-seed-20260801-cashless-store",
    "jinju-seed-20260801-marked-borrowed-book",
    "jinju-seed-20260801-elevator-ad-revenue",
  ]);
  const requestedPosts = august1EditorialPosts.filter((post) => requestedIds.has(post.id));
  assert.equal(requestedPosts.length, requestedIds.size);
  for (const post of requestedPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    const comments = august1EditorialComments(post.id);
    assert.equal(comments.length, post.commentCount);
    for (const comment of comments) {
      assert.equal(comment.displayName.trim().split(/\s+/).length, 2);
      assert.ok(Date.parse(comment.createdAt) > Date.parse(post.createdAt));
    }
  }
});

test("selected August 2 posts use two-word names, 20-33 likes, and complete comments", () => {
  const requestedIds = new Set([
    "jinju-seed-20260802-housing-gap",
    "jinju-seed-20260802-heat-delivery",
    "jinju-seed-20260802-couple-thirty-days",
    "jinju-seed-20260802-couple-job-loss",
  ]);
  const requestedPosts = august2EditorialPosts.filter((post) => requestedIds.has(post.id));
  assert.equal(requestedPosts.length, requestedIds.size);
  assert.equal(august2EditorialPosts.length, requestedIds.size);
  for (const post of requestedPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    const comments = august2EditorialComments(post.id);
    assert.equal(comments.length, post.commentCount);
    for (const comment of comments) {
      assert.equal(comment.displayName.trim().split(/\s+/).length, 2);
      assert.ok(Date.parse(comment.createdAt) > Date.parse(post.createdAt));
    }
  }
});

test("selected August 3 posts use two-word names, 20-33 likes, and complete comments", () => {
  const requestedIds = new Set([
    "jinju-seed-20260803-convenience-store-heat-shelter",
    "jinju-seed-20260803-haircut-mistake",
  ]);
  const requestedPosts = august3EditorialPosts.filter((post) => requestedIds.has(post.id));
  assert.equal(requestedPosts.length, requestedIds.size);
  assert.equal(august3EditorialPosts.length, requestedIds.size);
  for (const post of requestedPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    const comments = august3EditorialComments(post.id);
    assert.equal(comments.length, post.commentCount);
    for (const comment of comments) {
      assert.equal(comment.displayName.trim().split(/\s+/).length, 2);
      assert.ok(Date.parse(comment.createdAt) > Date.parse(post.createdAt));
    }
  }
});

test("a partial automatic set never hides supplemental comments", () => {
  assert.equal(hasCompleteAutoCommentSet(AUTO_COMMENT_TOTAL - 1), false);
  assert.equal(hasCompleteAutoCommentSet(AUTO_COMMENT_TOTAL), true);
});

test("base comments are deduplicated against stored copies without dropping stored comments", () => {
  const base = mergeBaseCommentsByBody(
    [{ body: "같은 댓글", id: "base-1" }],
    [{ body: "같은   댓글", id: "base-2" }, { body: "보충 댓글", id: "base-3" }],
  );
  const stored = [
    { body: "같은 댓글", id: "stored-1" },
    { body: "사용자 댓글", id: "stored-2" },
  ];
  assert.deepEqual(combineBaseAndStoredComments(base, stored).map((comment) => comment.id), [
    "base-3",
    "stored-1",
    "stored-2",
  ]);
});

test("browser reaction history expires on the same retention boundary as the server", () => {
  const now = Date.parse("2026-07-29T00:00:00.000Z");
  const history = recordReaction({}, "post-1", "heard", now);
  assert.equal(activeReactionHistory(history, now)["post-1"].kind, "heard");
  assert.deepEqual(activeReactionHistory(history, history["post-1"].expiresAt), {});
});
