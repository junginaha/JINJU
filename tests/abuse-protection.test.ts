import assert from "node:assert/strict";
import test from "node:test";
import { isDuplicateComment, normalizeCommentForDedup } from "../lib/comment-dedup";
import { abuseHmacReady, anonymousActorHash, blockDurationMsForStrike } from "../lib/rate-limit";
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

test("requires Turnstile on every public production address", () => {
  assert.equal(isJinjuPublicHost("xn--o55b9n.kr"), true);
  assert.equal(isJinjuPublicHost("www.xn--o55b9n.kr"), true);
  assert.equal(isJinjuPublicHost("jinju-two.vercel.app"), true);
  assert.equal(isJinjuPublicHost("preview.vercel.app"), false);
});

test("uses the existing Turnstile server secret as a fail-safe HMAC root", async () => {
  const originalAbuseSecret = process.env.ABUSE_HMAC_SECRET;
  const originalRateLimitSecret = process.env.RATE_LIMIT_SECRET;
  const originalTurnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  try {
    delete process.env.ABUSE_HMAC_SECRET;
    delete process.env.RATE_LIMIT_SECRET;
    process.env.TURNSTILE_SECRET_KEY = "test-turnstile-secret";
    assert.equal(abuseHmacReady(), true);
    const actorHash = await anonymousActorHash(new Request("https://xn--o55b9n.kr/api/review", {
      headers: {
        "user-agent": "jinju-test-browser",
        "x-forwarded-for": "192.0.2.1",
      },
    }), "review");
    assert.match(actorHash, /^[0-9a-f]{64}$/);
  } finally {
    if (originalAbuseSecret === undefined) delete process.env.ABUSE_HMAC_SECRET;
    else process.env.ABUSE_HMAC_SECRET = originalAbuseSecret;
    if (originalRateLimitSecret === undefined) delete process.env.RATE_LIMIT_SECRET;
    else process.env.RATE_LIMIT_SECRET = originalRateLimitSecret;
    if (originalTurnstileSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = originalTurnstileSecret;
  }
});
