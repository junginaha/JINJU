import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  applyCommentOverrides,
  applyPostOverride,
  PUBLIC_COMMENT_REWRITES,
  PUBLIC_POST_REWRITES,
} from "../lib/content-overrides";

const REVISED_POST_IDS = [
  "jinju-daily-20260822-venture-investment",
  "jinju-daily-20260822-bread-slice",
  "jinju-daily-20260822-bookclub-ending",
  "jinju-daily-20260822-date-slides",
  "jinju-daily-20260822-patient-voice",
  "jinju-daily-20260822-encore-last-train",
  "jinju-daily-20260821-leftover-packing-fee",
  "jinju-daily-20260820-lock-screen-medical-id",
] as const;

const BAD_KOREAN = /써보면 합니다|해보면 합니다|방법 같습니다|용서해야 한다와|떠나야 한다가|습관이 남았으면|후기를 남겨보려고|묻고 싶어졌습니다|장바구니.{0,12}세워|큰 공장의 감산|답하는 날짜/u;

test("공개 게시글에는 확인된 번역체와 어법 오류가 남지 않는다", () => {
  const publicPosts = builtInPosts.flatMap((post) => {
    const revised = applyPostOverride(post, new Map());
    return revised ? [revised] : [];
  });
  const publicComments = builtInPosts.flatMap((post) => applyCommentOverrides(builtInComments(post.id), new Map()));

  assert.ok(publicPosts.every((post) => !BAD_KOREAN.test(`${post.title} ${post.content}`)));
  assert.ok(publicComments.every((comment) => !BAD_KOREAN.test(comment.body)));
});

test("운영 DB에 복사된 글도 공개 단계에서 자연스러운 한국어로 교정된다", () => {
  for (const id of REVISED_POST_IDS) {
    assert.ok(PUBLIC_POST_REWRITES.has(id));
    const publicPost = applyPostOverride({
      id,
      title: "교정 전 제목",
      content: "교정 전 본문",
      category: "일상",
    }, new Map());
    assert.ok(publicPost);
    assert.notEqual(publicPost.content, "교정 전 본문");
  }

  const medicalPost = applyPostOverride({
    id: "jinju-daily-20260820-lock-screen-medical-id",
    title: "비상연락처가 잠금화면 밖으로 나오는 날",
    content: "교정 전 본문",
    category: "제안",
  }, new Map());
  assert.equal(medicalPost?.title, "잠금화면에서도 보이는 비상연락처, 미리 설정해둘걸");
});

test("교정 댓글은 경험·대화·유머·실용 조언이 섞인 공개 문장으로 바뀐다", () => {
  const targetIds = [
    "daily-0822-9-1-caution",
    "daily-0822-9-2-agree",
    "daily-0822-9-3-agree",
    "daily-0822-9-4-caution",
    "daily-0822-9-10-caution",
    "daily-0822-9-11-agree",
    "daily-0822-5-3-caution",
    "daily-0822-5-7-agree",
    "daily-0822-5-14-caution",
    "daily-0822-11-2-agree",
    "daily-0822-11-12-caution",
    "daily-0822-12-3-caution",
    "daily-0822-12-9-caution",
    "daily-0822-12-15-agree",
    "daily-0822-13-1-agree",
    "daily-0822-13-10-caution",
    "daily-0822-3-2-caution",
    "daily-0822-3-6-caution",
    "daily-0822-3-11-agree",
    "daily-0821-9-4-caution",
    "daily-0821-9-8-caution",
    "daily-0821-9-9-caution",
    "daily-0820-3-6-caution",
    "daily-0820-3-7-agree",
    "daily-0820-3-12-caution",
    "daily-0801-cash-7",
  ];

  for (const id of targetIds) {
    const rewrite = PUBLIC_COMMENT_REWRITES.get(id);
    assert.ok(rewrite);
    const sourceComment = builtInPosts
      .flatMap((post) => builtInComments(post.id))
      .find((comment) => String(comment.id) === id);
    assert.ok(sourceComment);
    assert.equal(sourceComment.body, rewrite.from);
    const [comment] = applyCommentOverrides([sourceComment], new Map());
    assert.equal(comment.body, rewrite.to);
    assert.notEqual(comment.body, rewrite.from);
  }

  const rewrittenBodies = targetIds.map((id) => PUBLIC_COMMENT_REWRITES.get(id)?.to ?? "");
  assert.ok(rewrittenBodies.filter((body) => /저는|저도|저라면|더라고요|듯해요/u.test(body)).length >= 3);
  assert.ok(rewrittenBodies.filter((body) => /확인|설정|계약서|출발점|서비스/u.test(body)).length >= 3);
  assert.ok(rewrittenBodies.filter((body) => /억울|수사|독립|오답|난감/u.test(body)).length >= 3);
});
