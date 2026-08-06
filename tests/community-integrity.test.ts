import assert from "node:assert/strict";
import test from "node:test";
import {
  combineBaseAndStoredComments,
  hasCompleteAutoCommentSet,
  mergeBaseCommentsByBody,
} from "../lib/comment-visibility";
import {
  autoCommentDisplayName,
  generateAutoCommentBodies,
  validatedAutoCommentBodies,
} from "../lib/auto-comments";
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
import {
  keepsSupplementalCommentsWithAutoSet,
  supplementalComments,
} from "../lib/supplemental-comments";
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
  assert.throws(() => validatedAutoCommentBodies([
    "“첫 번째 직접 인용”을 담은 댓글",
    "“두 번째 직접 인용”을 담은 댓글",
    ...bodies.slice(2),
  ]));
});

test("automatic fallback comments paraphrase the post without repeated quotations", async () => {
  const openAiKey = process.env.OPENAI_API_KEY;
  const aiKey = process.env.AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    const comments = await generateAutoCommentBodies({
      id: "natural-comment-policy",
      title: "충전이 끝난 자리를 언제 비워야 할까요",
      content: "아파트 충전기가 부족합니다. 밤에 충전이 끝난 차를 바로 옮기기는 어렵습니다. 다른 주민은 아침까지 기다려야 했습니다.",
      category: "사회",
      createdAt: "2026-08-06T14:10:00+09:00",
    });
    assert.equal(comments.length, AUTO_COMMENT_TOTAL);
    assert.equal(new Set(comments).size, AUTO_COMMENT_TOTAL);
    assert.ok(comments.filter((body) => /[“”"]/u.test(body)).length <= 1);
  } finally {
    if (openAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = openAiKey;
    if (aiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = aiKey;
  }
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

test("the latest post receives ten natural comments and the next ten receive three each", () => {
  const latestId = "303t1k08482d6n4q5x4b";
  const otherIds = [
    "jinju-morning-20260806-palace-admission-fee",
    "jinju-seed-20260806-ev-charger-overnight",
    "jinju-morning-20260806-ai-emergency-triage",
    "jinju-morning-20260806-benefit-auto-application",
    "jinju-morning-20260806-regional-universities",
    "jinju-seed-20260805-birthday-deposit",
    "jinju-seed-20260805-delivery-ice-water",
    "jinju-seed-20260805-office-fridge-peach",
    "jinju-morning-20260805-small-store-negotiation",
    "jinju-morning-20260805-platform-refund-duty",
  ];
  const commentsFor = (id: string) => supplementalComments({
    id,
    title: "검증용 제목",
    content: "검증용 본문입니다.",
    category: "사회",
    createdAt: "2026-08-06T00:00:00.000Z",
  });
  const latestComments = commentsFor(latestId);
  const otherComments = otherIds.flatMap((id) => {
    const comments = commentsFor(id);
    assert.equal(comments.length, 3);
    return comments;
  });
  const allComments = [...latestComments, ...otherComments];

  assert.equal(latestComments.length, 10);
  assert.equal(otherComments.length, 30);
  assert.equal(allComments.length, 40);
  assert.equal(new Set(allComments.map((comment) => comment.body)).size, 40);
  assert.equal(new Set(allComments.map((comment) => comment.displayName)).size, 40);
  assert.ok(allComments.every((comment) => comment.displayName.trim().split(/\s+/).length === 2));
  assert.ok(allComments.every((comment) => !/[“”"]/u.test(comment.body)));
  assert.equal(keepsSupplementalCommentsWithAutoSet(latestId), true);
  assert.equal(keepsSupplementalCommentsWithAutoSet(otherIds[0]), false);
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

test("the latest tax post automatic comments are rewritten in natural language", () => {
  const comments = [
    {
      id: "jinju-auto-303t1k08482d6n4q5x4b-1",
      body: "“최근 정부에서 대통령의 초기 약속과 다르게보유세 강화로 세제 개편안을” 대목에서 상황이 바로 그려졌어요. 웃고 넘길 수도 있지만, 당사자에게는 꽤 오래 남을 만한 순간이었겠네요.",
    },
    {
      id: "jinju-auto-303t1k08482d6n4q5x4b-8",
      body: "정답만 고르기보다 “최근 정부에서 대통령의 초기 약속과 다르게보유세 강화로 세제 개편안을”를 왜 그렇게 판단했는지 한 문장씩 덧붙이면 서로의 기준이 더 선명하게 보이겠습니다.",
    },
    {
      id: "jinju-auto-303t1k08482d6n4q5x4b-15",
      body: "결국 “1주택 거주자 세금 인하”를 어떤 기준으로 바라보느냐가 답을 바꿀 것 같아요. 다른 결론이 나오더라도 서로를 함부로 단정하지 않는 대화였으면 합니다.",
    },
  ];
  const rewritten = applyCommentOverrides(comments, new Map());
  assert.deepEqual(rewritten.map((comment) => comment.body), [
    "약속과 달라졌다고 느낀 지점이 무엇인지 공식 개편안과 함께 확인해보면 좋겠습니다. 세금 이야기는 첫 단추가 사실관계라서요.",
    "세법은 읽을수록 제가 집을 가진 건지 집이 저를 신고하는 건지 헷갈립니다. 사례별 계산표부터 쉽게 공개해줬으면 해요.",
    "실거주자를 보호하면서도 부동산 쏠림을 줄이려는 두 목표가 충돌하네요. 어느 쪽의 비용을 누가 부담하는지 공개해야 토론도 정확해지겠습니다.",
  ]);
  assert.ok(rewritten.every((comment) => !/[“”"]/u.test(comment.body)));
});

test("browser reaction history expires on the same retention boundary as the server", () => {
  const now = Date.parse("2026-07-29T00:00:00.000Z");
  const history = recordReaction({}, "post-1", "heard", now);
  assert.equal(activeReactionHistory(history, now)["post-1"].kind, "heard");
  assert.deepEqual(activeReactionHistory(history, history["post-1"].expiresAt), {});
});
