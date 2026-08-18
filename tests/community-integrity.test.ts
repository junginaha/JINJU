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
import {
  NEW_POST_COMMUNITY_DEFAULTS,
  newPostAutoCommentTarget,
  newPostCommentSchedule,
  newPostInitialLikes,
} from "../lib/community-settings";
import { normalizeCommentTimes, visibleCommentsAt } from "../lib/comment-time";
import { applyCommentOverrides, PUBLIC_COMMENT_REWRITES } from "../lib/content-overrides";
import { july30EditorialComments, july30EditorialPosts } from "../lib/daily-editorial-20260730";
import { august1EditorialComments, august1EditorialPosts } from "../lib/daily-editorial-20260801";
import { august2EditorialComments, august2EditorialPosts } from "../lib/daily-editorial-20260802";
import { august3EditorialComments, august3EditorialPosts } from "../lib/daily-editorial-20260803";
import { august6EditorialComments, august6EditorialPosts } from "../lib/daily-editorial-20260806";
import { august12EditorialComments, august12EditorialPosts } from "../lib/daily-editorial-20260812";
import { august5MorningComments, august5MorningPosts } from "../lib/morning-editorial-20260805";
import { august6MorningComments, august6MorningPosts } from "../lib/morning-editorial-20260806";
import { august8MorningComments, august8MorningPosts } from "../lib/morning-editorial-20260808";
import { august9MorningComments, august9MorningPosts } from "../lib/morning-editorial-20260809";
import { august10MorningComments, august10MorningPosts } from "../lib/morning-editorial-20260810";
import { august12MorningComments, august12MorningPosts } from "../lib/morning-editorial-20260812";
import { august9EditorialComments, august9EditorialPosts } from "../lib/daily-editorial-20260809";
import {
  AUGUST8_FRESH_COMMENT_POST_IDS,
  august8FreshComments,
} from "../lib/fresh-comments-20260808";
import {
  AUGUST9_FRESH_COMMENT_POST_IDS,
  august9FreshComments,
} from "../lib/fresh-comments-20260809";
import {
  AUGUST10_TOP_COMMENT_POST_IDS,
  august10TopComments,
} from "../lib/fresh-comments-20260810";
import {
  AUGUST12_TOP_COMMENT_POST_IDS,
  august12TopComments,
} from "../lib/fresh-comments-20260812";
import {
  deterministicJinjuDisplayName,
  generateJinjuDisplayName,
  refinedJinjuDisplayName,
} from "../lib/display-name";
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

test("new posts start with three immediate comments and grow to around ten", () => {
  const start = "2026-07-29T00:00:00.000Z";
  const postId = "new-community-post";
  const schedule = newPostCommentSchedule(start, postId);
  assert.equal(schedule.length, newPostAutoCommentTarget(postId));
  assert.ok(schedule.length >= NEW_POST_COMMUNITY_DEFAULTS.autoCommentMin);
  assert.ok(schedule.length <= NEW_POST_COMMUNITY_DEFAULTS.autoCommentMax);
  assert.deepEqual(schedule.slice(0, 3), [
    "2026-07-29T00:00:00.000Z",
    "2026-07-29T00:00:01.000Z",
    "2026-07-29T00:00:02.000Z",
  ]);
  assert.ok(schedule.slice(3).every((createdAt, index, followups) => (
    Date.parse(createdAt) > Date.parse(index ? followups[index - 1] : schedule[2])
  )));
  assert.ok(Date.parse(schedule[3]) - Date.parse(start) >= 6 * 60_000);
  assert.ok(Date.parse(schedule.at(-1) || "") - Date.parse(start) <= 13 * 60 * 60_000);
});

test("new posts naturally vary between nine, ten, and eleven automatic comments", () => {
  const targets = new Set(Array.from({ length: 200 }, (_, index) => newPostAutoCommentTarget(`post-${index}`)));
  assert.deepEqual([...targets].sort((a, b) => a - b), [9, 10, 11]);
});

test("automatic comments must be a complete unique set", () => {
  const targetCount = newPostAutoCommentTarget("complete-comment-set");
  const bodies = Array.from(
    { length: targetCount },
    (_, index) => `충전 자리 ${index + 1}의 이용 기준을 구체적으로 짚었습니다. 야간 유예시간도 함께 정하면 좋겠습니다.`,
  );
  bodies[0] = "충전 완료 뒤에는 자리를 비워주세요.";
  bodies[1] = "완충 알림 뒤 야간에는 두세 시간 유예하고, 아침부터 점유요금을 붙이면 현실과 회전율을 함께 챙길 수 있습니다. 단지별 충전기 수와 대기 순번도 앱에서 보여주면 주민끼리 눈치게임을 덜 하겠네요.";
  assert.equal(validatedAutoCommentBodies(bodies, targetCount).length, targetCount);
  assert.throws(() => validatedAutoCommentBodies(bodies.slice(1), targetCount));
  assert.throws(() => validatedAutoCommentBodies([...bodies.slice(0, -1), bodies[0]], targetCount));
  assert.throws(() => validatedAutoCommentBodies([
    "“첫 번째 직접 인용”은 기준을 선명하게 보여줍니다. 다른 사정도 함께 살펴야 합니다.",
    "“두 번째 직접 인용”은 논점을 분명하게 보여줍니다. 반대 이유도 차분히 들어야 합니다.",
    ...bodies.slice(2),
  ], targetCount));
  assert.throws(() => validatedAutoCommentBodies([
    "짧음",
    ...bodies.slice(1),
  ], targetCount));
  assert.equal(validatedAutoCommentBodies([
    "충전 자리의 약속은 간단할수록 좋습니다.",
    ...bodies.slice(1),
  ], targetCount).length, targetCount);
});

test("unknown posts fail closed instead of publishing generic fallback comments", async () => {
  const openAiKey = process.env.OPENAI_API_KEY;
  const aiKey = process.env.AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    await assert.rejects(
      generateAutoCommentBodies({
        id: "natural-comment-policy",
        title: "충전이 끝난 자리를 언제 비워야 할까요",
        content: "아파트 충전기가 부족합니다. 밤에 충전이 끝난 차를 바로 옮기기는 어렵습니다. 다른 주민은 아침까지 기다려야 했습니다.",
        category: "사회",
        createdAt: "2026-08-06T14:10:00+09:00",
      }),
      /require the AI review service/,
    );
  } finally {
    if (openAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = openAiKey;
    if (aiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = aiKey;
  }
});

test("a reviewed topic fallback remains complete and natural without the AI service", async () => {
  const openAiKey = process.env.OPENAI_API_KEY;
  const aiKey = process.env.AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    const comments = await generateAutoCommentBodies({
      id: "reviewed-beauty-topic",
      title: "얼굴과 몸매 중 무엇이 더 중요할까요",
      content: "외모 취향을 두 가지 선택지로 나눠 물어봤습니다. 관계에서 무엇을 오래 보는지도 궁금합니다.",
      category: "질문",
      createdAt: "2026-08-06T14:10:00+09:00",
    });
    const targetCount = newPostAutoCommentTarget("reviewed-beauty-topic");
    assert.equal(comments.length, targetCount);
    assert.equal(new Set(comments).size, targetCount);
    assert.ok(comments.every((body) => {
      const sentences = (body.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || []).filter((part) => part.trim()).length;
      return sentences >= 1 && sentences <= 3;
    }));
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
  const names = Array.from({ length: 11 }, (_, index) => autoCommentDisplayName("same-post", index));
  assert.equal(new Set(names).size, names.length);
});

test("new anonymous names avoid awkward mood-person combinations", () => {
  const banned = /웃음난|기분좋은|빌리|지현|휴지통|종이컵|국자|도마|두부|만두/;
  for (let index = 0; index < 256; index += 1) {
    assert.doesNotMatch(generateJinjuDisplayName(), banned);
    assert.doesNotMatch(deterministicJinjuDisplayName("refined-name", index), banned);
  }
  const refined = refinedJinjuDisplayName("웃음난 지현", "legacy-post");
  assert.notEqual(refined, "웃음난 지현");
  assert.equal(refined.trim().split(/\s+/).length, 2);
  assert.equal(refinedJinjuDisplayName("고요한 여백", "already-refined"), "고요한 여백");
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

test("August 8 morning posts use two-word names, 20-33 likes, and four complete comments", () => {
  assert.equal(august8MorningPosts.length, 5);
  assert.equal(new Set(august8MorningPosts.map((post) => post.id)).size, 5);
  for (const post of august8MorningPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    const comments = august8MorningComments(post.id);
    assert.equal(comments.length, 4);
    assert.equal(comments.length, post.commentCount);
    assert.equal(new Set(comments.map((comment) => comment.id)).size, 4);
    assert.equal(new Set(comments.map((comment) => comment.body)).size, 4);
    for (const item of comments) {
      assert.equal(item.displayName.trim().split(/\s+/).length, 2);
      assert.ok(Date.parse(item.createdAt) > Date.parse(post.createdAt));
    }
  }
});

test("a partial automatic set never hides supplemental comments", () => {
  const postId = "partial-comment-set";
  const targetCount = newPostAutoCommentTarget(postId);
  assert.equal(hasCompleteAutoCommentSet(targetCount - 1, postId), false);
  assert.equal(hasCompleteAutoCommentSet(targetCount, postId), true);
});

test("the latest post keeps its natural comments and selected top posts receive two more", () => {
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
  const latestComments = commentsFor(latestId).filter((comment) => !comment.id.startsWith("fresh-0809-"));
  const otherComments = otherIds.flatMap((id) => {
    const comments = commentsFor(id).filter((comment) => !comment.id.startsWith("fresh-0809-"));
    assert.equal(comments.length, otherIds.slice(0, 3).includes(id) ? 5 : 3);
    return comments;
  });
  const allComments = [...latestComments, ...otherComments];

  assert.equal(latestComments.length, 12);
  assert.equal(otherComments.length, 36);
  assert.equal(allComments.length, 48);
  assert.equal(new Set(allComments.map((comment) => comment.body)).size, 48);
  assert.equal(new Set(allComments.map((comment) => comment.displayName)).size, 48);
  assert.ok(allComments.every((comment) => comment.displayName.trim().split(/\s+/).length === 2));
  assert.ok(allComments.every((comment) => !/[“”"]/u.test(comment.body)));
  assert.equal(keepsSupplementalCommentsWithAutoSet(latestId), true);
  assert.equal(keepsSupplementalCommentsWithAutoSet(otherIds[0]), false);
});

test("the current top ten receive two fresh human comments each", () => {
  assert.equal(AUGUST8_FRESH_COMMENT_POST_IDS.length, 10);
  assert.equal(new Set(AUGUST8_FRESH_COMMENT_POST_IDS).size, 10);
  const comments = AUGUST8_FRESH_COMMENT_POST_IDS.flatMap((postId) => {
    const additions = august8FreshComments(postId);
    assert.equal(additions.length, 2);
    assert.deepEqual(
      supplementalComments({
        id: postId,
        title: "검증용 제목",
        content: "검증용 본문입니다.",
        category: "사회",
        createdAt: "2026-08-06T00:00:00.000Z",
      }).filter((comment) => comment.id.startsWith("fresh-0808-")),
      additions,
    );
    return additions;
  });

  assert.equal(comments.length, 20);
  assert.equal(new Set(comments.map((comment) => comment.id)).size, 20);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, 20);
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, 20);
  assert.ok(comments.every((comment) => comment.displayName.trim().split(/\s+/).length === 2));
  assert.ok(comments.every((comment) => !/[“”"]/u.test(comment.body)));
  assert.ok(comments.every((comment) => Number.isFinite(Date.parse(comment.createdAt))));
});

test("selected August 9 posts use two-word names, 20-33 likes, and six complete comments", () => {
  assert.equal(august9EditorialPosts.length, 3);
  assert.equal(new Set(august9EditorialPosts.map((post) => post.id)).size, 3);
  const allNames: string[] = [];
  const allBodies: string[] = [];
  for (const post of august9EditorialPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    const comments = august9EditorialComments(post.id);
    assert.equal(comments.length, 6);
    assert.equal(comments.length, post.commentCount);
    for (const item of comments) {
      assert.equal(item.displayName.trim().split(/\s+/).length, 2);
      assert.ok(Date.parse(item.createdAt) > Date.parse(post.createdAt));
      allNames.push(item.displayName);
      allBodies.push(item.body);
    }
  }
  assert.equal(new Set(allNames).size, 18);
  assert.equal(new Set(allBodies).size, 18);
});

test("August 9 news posts keep balanced six-comment debates and two-word names", () => {
  assert.equal(august9MorningPosts.length, 5);
  assert.equal(new Set(august9MorningPosts.map((post) => post.id)).size, 5);
  const allNames: string[] = [];
  const allBodies: string[] = [];
  for (const post of august9MorningPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    const comments = august9MorningComments(post.id);
    assert.equal(comments.length, 6);
    assert.equal(comments.length, post.commentCount);
    for (const item of comments) {
      assert.equal(item.displayName.trim().split(/\s+/).length, 2);
      assert.ok(Date.parse(item.createdAt) > Date.parse(post.createdAt));
      assert.ok(!/[“”"]/u.test(item.body));
      allNames.push(item.displayName);
      allBodies.push(item.body);
    }
  }
  assert.equal(new Set(allNames).size, 30);
  assert.equal(new Set(allBodies).size, 30);
});

test("selected August 10 news posts keep balanced six-comment debates and two-word names", () => {
  const immediatePublicationCutoff = Date.parse("2026-08-10T09:00:00+09:00");
  assert.equal(august10MorningPosts.length, 3);
  assert.equal(new Set(august10MorningPosts.map((post) => post.id)).size, 3);
  const allNames: string[] = [];
  const allBodies: string[] = [];
  for (const post of august10MorningPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    assert.ok(Date.parse(post.createdAt) <= immediatePublicationCutoff);
    const comments = august10MorningComments(post.id);
    assert.equal(comments.length, 6);
    assert.equal(comments.length, post.commentCount);
    assert.equal(
      (post.content.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || []).filter((part) => part.trim()).length,
      2,
    );
    for (const item of comments) {
      assert.equal(item.displayName.trim().split(/\s+/).length, 2);
      assert.ok(Date.parse(item.createdAt) > Date.parse(post.createdAt));
      assert.ok(Date.parse(item.createdAt) <= immediatePublicationCutoff);
      assert.ok(!/[“”"]/u.test(item.body));
      assert.equal(
        (item.body.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || []).filter((part) => part.trim()).length,
        2,
      );
      allNames.push(item.displayName);
      allBodies.push(item.body);
    }
  }
  assert.equal(new Set(allNames).size, 18);
  assert.equal(new Set(allBodies).size, 18);
});

test("August 12 news posts keep balanced six-comment debates and two-sentence human writing", () => {
  assert.equal(august12MorningPosts.length, 5);
  assert.equal(new Set(august12MorningPosts.map((post) => post.id)).size, 5);
  const allNames: string[] = [];
  const allBodies: string[] = [];
  for (const post of august12MorningPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    assert.equal(
      (post.content.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || []).filter((part) => part.trim()).length,
      2,
    );
    const comments = august12MorningComments(post.id);
    assert.equal(comments.length, 6);
    assert.equal(comments.length, post.commentCount);
    for (const item of comments) {
      assert.equal(item.displayName.trim().split(/\s+/).length, 2);
      assert.ok(Date.parse(item.createdAt) > Date.parse(post.createdAt));
      assert.ok(!/[“”"]/u.test(item.body));
      assert.equal(
        (item.body.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || []).filter((part) => part.trim()).length,
        2,
      );
      allNames.push(item.displayName);
      allBodies.push(item.body);
    }
  }
  assert.equal(new Set(allNames).size, 30);
  assert.equal(new Set(allBodies).size, 30);
});

test("August 12 policy debates keep balanced six-comment discussions and distinct two-word names", () => {
  assert.equal(august12EditorialPosts.length, 5);
  assert.equal(new Set(august12EditorialPosts.map((post) => post.id)).size, 5);
  const allNames: string[] = [];
  const allBodies: string[] = [];
  for (const post of august12EditorialPosts) {
    assert.equal(String(post.displayName).trim().split(/\s+/).length, 2);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    assert.equal(
      (post.content.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || []).filter((part) => part.trim()).length,
      2,
    );
    const comments = august12EditorialComments(post.id);
    assert.equal(comments.length, 6);
    assert.equal(comments.length, post.commentCount);
    for (const item of comments) {
      assert.equal(item.displayName.trim().split(/\s+/).length, 2);
      assert.ok(Date.parse(item.createdAt) > Date.parse(post.createdAt));
      assert.ok(!/[“”"]/u.test(item.body));
      assert.equal(
        (item.body.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || []).filter((part) => part.trim()).length,
        2,
      );
      allNames.push(item.displayName);
      allBodies.push(item.body);
    }
  }
  assert.equal(new Set(allNames).size, 30);
  assert.equal(new Set(allBodies).size, 30);
});

test("the current top ten receive exactly one new natural humorous comment each", () => {
  assert.equal(AUGUST9_FRESH_COMMENT_POST_IDS.length, 10);
  assert.equal(new Set(AUGUST9_FRESH_COMMENT_POST_IDS).size, 10);
  const comments = AUGUST9_FRESH_COMMENT_POST_IDS.flatMap((postId) => {
    const additions = august9FreshComments(postId);
    assert.equal(additions.length, 1);
    assert.deepEqual(
      supplementalComments({
        id: postId,
        title: "검증용 제목",
        content: "검증용 본문입니다.",
        category: "사회",
        createdAt: "2026-08-06T00:00:00.000Z",
      }).slice(-1),
      additions,
    );
    return additions;
  });

  assert.equal(comments.length, 10);
  assert.equal(new Set(comments.map((comment) => comment.id)).size, 10);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, 10);
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, 10);
  assert.ok(comments.every((comment) => comment.displayName.trim().split(/\s+/).length === 2));
  assert.ok(comments.every((comment) => !/[“”"]/u.test(comment.body)));
  assert.ok(comments.every((comment) => Number.isFinite(Date.parse(comment.createdAt))));
});

test("the August 10 top ten receive four distinct helpful human comments each", () => {
  const immediateVisibilityCutoff = Date.parse("2026-08-10T20:00:00+09:00");
  assert.equal(AUGUST10_TOP_COMMENT_POST_IDS.length, 10);
  assert.equal(new Set(AUGUST10_TOP_COMMENT_POST_IDS).size, 10);

  const comments = AUGUST10_TOP_COMMENT_POST_IDS.flatMap((postId) => {
    const additions = august10TopComments(postId);
    assert.equal(additions.length, 4);
    assert.deepEqual(
      supplementalComments({
        id: postId,
        title: "검증용 제목",
        content: "검증용 본문입니다.",
        category: "사회",
        createdAt: "2026-08-09T00:00:00.000Z",
      }).filter((comment) => comment.id.startsWith("fresh-0810-top-")),
      additions,
    );
    return additions;
  });

  assert.equal(comments.length, 40);
  assert.equal(new Set(comments.map((comment) => comment.id)).size, 40);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, 40);
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, 40);
  assert.ok(comments.every((comment) => comment.displayName.trim().split(/\s+/).length === 2));
  assert.ok(comments.every((comment) => !/[“”"]/u.test(comment.body)));
  assert.ok(comments.every((comment) => Date.parse(comment.createdAt) <= immediateVisibilityCutoff));
  assert.ok(comments.every((comment) =>
    (comment.body.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || [])
      .filter((part) => part.trim()).length === 2));
  assert.equal(keepsSupplementalCommentsWithAutoSet("1m4m5c2q5x121a066u5v"), true);
});

test("the August 12 top ten receive five distinct engaging human comments each", () => {
  const immediateVisibilityCutoff = Date.parse("2026-08-12T00:00:00+09:00");
  assert.equal(AUGUST12_TOP_COMMENT_POST_IDS.length, 10);
  assert.equal(new Set(AUGUST12_TOP_COMMENT_POST_IDS).size, 10);

  const comments = AUGUST12_TOP_COMMENT_POST_IDS.flatMap((postId) => {
    const additions = august12TopComments(postId);
    assert.equal(additions.length, 5);
    assert.deepEqual(
      supplementalComments({
        id: postId,
        title: "검증용 제목",
        content: "검증용 본문입니다.",
        category: "사회",
        createdAt: "2026-08-09T00:00:00.000Z",
      }).filter((comment) => comment.id.startsWith("fresh-0812-top-")),
      additions,
    );
    return additions;
  });

  assert.equal(comments.length, 50);
  assert.equal(new Set(comments.map((comment) => comment.id)).size, 50);
  assert.equal(new Set(comments.map((comment) => comment.body)).size, 50);
  assert.equal(new Set(comments.map((comment) => comment.displayName)).size, 50);
  assert.ok(comments.every((comment) => comment.displayName.trim().split(/\s+/).length === 2));
  assert.ok(comments.every((comment) => !/[“”"]/u.test(comment.body)));
  assert.ok(comments.every((comment) => Date.parse(comment.createdAt) <= immediateVisibilityCutoff));
  assert.ok(comments.every((comment) =>
    (comment.body.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || [])
      .filter((part) => part.trim()).length === 2));
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
    "부부 사이에는 누가 더 힘든지 겨루는 대신 각자가 견딘 비용을 나란히 놓는 시간이 필요합니다. 떠난 사람의 답답함과 남은 사람의 불안을 함께 인정해야 합의가 시작돼요.",
    "결혼 생활이 출발 안내판처럼 수시로 바뀌면 남은 사람도 지칩니다. 다음 행선지보다 두 사람이 지킬 연락 규칙부터 정해보세요.",
    "다른 댓글은 그대로 둡니다.",
  ]);
  assert.equal(
    applyCommentOverrides([
      { id: "jinju-auto-0451693t131i5b2j2s0j-14", body: "나중에 직접 수정한 댓글" },
    ], new Map())[0].body,
    "나중에 직접 수정한 댓글",
  );
});

test("all identified incoherent automatic comments have contextual two-sentence rewrites", () => {
  const affectedPostIds = ["1m4m5c2q5x121a066u5v", "0451693t131i5b2j2s0j"];
  const rewrites = [...PUBLIC_COMMENT_REWRITES.entries()]
    .filter(([id]) => affectedPostIds.some((postId) => id.startsWith(`jinju-auto-${postId}-`)));
  assert.equal(rewrites.length, 28);

  const oldComments = rewrites.map(([id, rewrite]) => ({ id, body: rewrite.from }));
  const newComments = applyCommentOverrides(oldComments, new Map());
  assert.equal(new Set(newComments.map((comment) => comment.body)).size, 28);
  for (const comment of newComments) {
    assert.ok(!/[“”"]/u.test(comment.body));
    assert.ok(!/(작품을만으로|했습니다를|에서를|제목 한 줄|작은 토론회)/.test(comment.body));
    assert.equal(
      (comment.body.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g) || []).filter((part) => part.trim()).length,
      2,
    );
  }
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
