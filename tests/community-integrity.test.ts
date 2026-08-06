import assert from "node:assert/strict";
import test from "node:test";
import {
  combineBaseAndStoredComments,
  hasCompleteAutoCommentSet,
  mergeBaseCommentsByBody,
} from "../lib/comment-visibility";
import { autoCommentDisplayName, validatedAutoCommentBodies } from "../lib/auto-comments";
import { AUTO_COMMENT_TOTAL, newPostCommentSchedule, newPostInitialLikes } from "../lib/community-settings";
import { normalizeCommentTimes, visibleCommentsAt } from "../lib/comment-time";
import { applyCommentOverrides } from "../lib/content-overrides";
import { july30EditorialComments, july30EditorialPosts } from "../lib/daily-editorial-20260730";
import { august1EditorialComments, august1EditorialPosts } from "../lib/daily-editorial-20260801";
import { august2EditorialComments, august2EditorialPosts } from "../lib/daily-editorial-20260802";
import { august3EditorialComments, august3EditorialPosts } from "../lib/daily-editorial-20260803";
import { august6EditorialComments, august6EditorialPosts } from "../lib/daily-editorial-20260806";
import { august5MorningComments, august5MorningPosts } from "../lib/morning-editorial-20260805";
import { august6MorningComments, august6MorningPosts } from "../lib/morning-editorial-20260806";
import { generateJinjuDisplayName } from "../lib/display-name";
import { visibleBuiltInComments } from "../lib/public-posts";
import { activeReactionHistory, recordReaction } from "../lib/reaction-history";
import { reviewSubmission } from "../lib/ai-review";
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

test("feed and detail use the same visibility boundary for scheduled comments", () => {
  const post = august6EditorialPosts.find((item) => item.id === "jinju-seed-20260806-ev-charger-overnight");
  assert.ok(post);
  const comments = august6EditorialComments(post.id);
  const beforeFirstComment = Date.parse("2026-08-06T14:12:00+09:00");
  const afterFirstComment = Date.parse("2026-08-06T14:15:00+09:00");

  assert.equal(visibleCommentsAt(comments, beforeFirstComment).length, 0);
  assert.equal(visibleBuiltInComments(post, beforeFirstComment).length, 0);
  assert.equal(normalizeCommentTimes(post.createdAt, comments, beforeFirstComment).length, 0);

  assert.equal(visibleCommentsAt(comments, afterFirstComment).length, 1);
  assert.equal(visibleBuiltInComments(post, afterFirstComment).length, 1);
  assert.equal(normalizeCommentTimes(post.createdAt, comments, afterFirstComment).length, 1);
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

test("the shared writing review protects both ordinary comments and risky comments", async () => {
  const openAiKey = process.env.OPENAI_API_KEY;
  const aiKey = process.env.AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    assert.equal((await reviewSubmission("", "저는 조금 다르게 생각해요.", "comment")).decision, "allow");
    assert.equal((await reviewSubmission("", "연락은 010-1234-5678로 주세요.", "comment")).decision, "revise");
    assert.equal((await reviewSubmission("", "저 사람은 쓰레기고 무조건 사기꾼입니다.", "comment")).decision, "revise");
  } finally {
    if (openAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = openAiKey;
    if (aiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = aiKey;
  }
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

test("August 5 morning posts use two-word names, 20-33 likes, and complete comments", () => {
  assert.equal(august5MorningPosts.length, 5);
  for (const post of august5MorningPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    const comments = august5MorningComments(post.id);
    assert.equal(comments.length, post.commentCount);
    for (const comment of comments) {
      assert.equal(comment.displayName.trim().split(/\s+/).length, 2);
      assert.ok(Date.parse(comment.createdAt) > Date.parse(post.createdAt));
    }
  }
});

test("selected August 6 posts use two-word names, 20-33 likes, and complete comments", () => {
  assert.equal(august6MorningPosts.length, 5);
  assert.equal(august6EditorialPosts.length, 2);
  for (const [posts, commentsFor] of [
    [august6MorningPosts, august6MorningComments],
    [august6EditorialPosts, august6EditorialComments],
  ] as const) {
    for (const post of posts) {
      assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
      assert.ok(post.heard >= 20 && post.heard <= 33);
      const comments = commentsFor(post.id);
      assert.equal(comments.length, post.commentCount);
      assert.ok(comments.length >= 5);
      for (const comment of comments) {
        assert.equal(comment.displayName.trim().split(/\s+/).length, 2);
        assert.ok(Date.parse(comment.createdAt) > Date.parse(post.createdAt));
      }
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

test("repetitive bottom comments are rewritten without changing other comment content", () => {
  const comments = [
    {
      id: "jinju-auto-0451693t131i5b2j2s0j-14",
      body: "“아내가 또 가출 했어요”라니, 제목 한 줄이 이미 작은 토론회네요. 입장료는 없지만 각자 가져온 사정은 꽤 묵직합니다.",
    },
    {
      id: "jinju-auto-0451693t131i5b2j2s0j-15",
      body: "결국 “아내가 또 가출 했어요”를 어떤 기준으로 바라보느냐가 답을 바꿀 것 같아요. 다른 결론이 나오더라도 서로를 함부로 단정하지 않는 대화였으면 합니다.",
    },
    { id: "unrelated-comment", body: "다른 댓글은 그대로 둡니다." },
  ];
  const rewritten = applyCommentOverrides(comments, new Map());
  assert.deepEqual(rewritten.map((comment) => comment.body), [
    "제목 한 줄만으로 작은 토론회가 열렸네요. 입장료는 없지만 각자 가져온 사정은 꽤 묵직합니다.",
    "결국 같은 갈등을 두 사람이 어떤 기준으로 바라보느냐에 따라 답이 달라질 것 같아요. 결론이 다르더라도 서로를 함부로 단정하지 않는 대화였으면 합니다.",
    "다른 댓글은 그대로 둡니다.",
  ]);
  assert.equal(
    applyCommentOverrides([
      { id: "jinju-auto-0451693t131i5b2j2s0j-14", body: "나중에 직접 수정한 댓글" },
    ], new Map())[0].body,
    "나중에 직접 수정한 댓글",
  );
});

test("browser reaction history expires on the same retention boundary as the server", () => {
  const now = Date.parse("2026-07-29T00:00:00.000Z");
  const history = recordReaction({}, "post-1", "heard", now);
  assert.equal(activeReactionHistory(history, now)["post-1"].kind, "heard");
  assert.deepEqual(activeReactionHistory(history, history["post-1"].expiresAt), {});
});
