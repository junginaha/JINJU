import assert from "node:assert/strict";
import test from "node:test";
import { isDuplicateComment, normalizeCommentForDedup } from "../lib/comment-dedup";
import { blockDurationMsForStrike } from "../lib/rate-limit";
import { isJinjuPublicHost } from "../lib/turnstile";

test("normalizes harmless comment formatting before duplicate comparison", () => {
  assert.equal(normalizeCommentForDedup("  같은　의견입니다.  "), "같은 의견입니다.");
  assert.equal(isDuplicateComment("같은 의견입니다.", ["같은   의견입니다."]), true);
  assert.equal(isDuplicateComment("공감해요", ["공감해요"]), false);
});

test("escalates repeated public abuse without affecting the first request window", () => {
  assert.equal(blockDurationMsForStrike(1, 10 * 60_000), 10 * 60_000);
  assert.equal(blockDurationMsForStrike(2, 10 * 60_000), 60 * 60_000);
  assert.equal(blockDurationMsForStrike(3, 10 * 60_000), 24 * 60 * 60_000);
  assert.equal(blockDurationMsForStrike(4, 10 * 60_000), 30 * 24 * 60 * 60_000);
});

test("requires Turnstile only on the canonical public domains", () => {
  assert.equal(isJinjuPublicHost("xn--o55b9n.kr"), true);
  assert.equal(isJinjuPublicHost("www.xn--o55b9n.kr"), true);
  assert.equal(isJinjuPublicHost("preview.vercel.app"), false);
});
