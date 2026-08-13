import assert from "node:assert/strict";
import test from "node:test";
import {
  issuePostSecurityFallback,
  POST_SECURITY_FALLBACK_DELAY_MS,
  POST_SECURITY_FALLBACK_TTL_MS,
  verifyPostSecurityFallback,
} from "../lib/post-security-fallback";

function request(ip = "192.0.2.10", userAgent = "jinju-desktop-test") {
  return new Request("https://xn--o55b9n.kr/api/security/post-fallback", {
    headers: {
      host: "xn--o55b9n.kr",
      "user-agent": userAgent,
      "x-forwarded-for": ip,
    },
  });
}

test("post fallback proof waits, expires, and stays bound to the same anonymous browser", async () => {
  const originalSecret = process.env.ABUSE_HMAC_SECRET;
  try {
    process.env.ABUSE_HMAC_SECRET = "post-fallback-test-secret";
    const now = 1_800_000_000_000;
    const proof = await issuePostSecurityFallback(request(), now);
    assert.ok(proof);
    assert.equal(await verifyPostSecurityFallback(request(), proof, now + POST_SECURITY_FALLBACK_DELAY_MS - 1), false);
    assert.equal(await verifyPostSecurityFallback(request(), proof, now + POST_SECURITY_FALLBACK_DELAY_MS), true);
    assert.equal(await verifyPostSecurityFallback(request("192.0.2.11"), proof, now + POST_SECURITY_FALLBACK_DELAY_MS), false);
    assert.equal(await verifyPostSecurityFallback(request("192.0.2.10", "different-browser"), proof, now + POST_SECURITY_FALLBACK_DELAY_MS), false);
    assert.equal(await verifyPostSecurityFallback(request(), proof, now + POST_SECURITY_FALLBACK_TTL_MS), false);
    assert.equal(await verifyPostSecurityFallback(request(), `${proof.slice(0, -1)}x`, now + POST_SECURITY_FALLBACK_DELAY_MS), false);
  } finally {
    if (originalSecret === undefined) delete process.env.ABUSE_HMAC_SECRET;
    else process.env.ABUSE_HMAC_SECRET = originalSecret;
  }
});

test("reviewed writing remains publishable when external challenge scripts fail", async () => {
  const app = await import("node:fs/promises").then((fs) => fs.readFile("components/JinjuApp.tsx", "utf8"));
  const reviewRoute = await import("node:fs/promises").then((fs) => fs.readFile("app/api/review/route.ts", "utf8"));
  const postRoute = await import("node:fs/promises").then((fs) => fs.readFile("app/api/posts/route.ts", "utf8"));
  const commentsRoute = await import("node:fs/promises").then((fs) => fs.readFile("app/api/posts/[id]/comments/route.ts", "utf8"));
  const feedbackRoute = await import("node:fs/promises").then((fs) => fs.readFile("app/api/feedback/route.ts", "utf8"));

  assert.doesNotMatch(app, /TurnstileChallenge action="post"/);
  assert.doesNotMatch(app, /postTurnstileRequired/);
  assert.match(app, /게시 전 검토 중입니다\. 문제가 있으면 정확히 알려드릴게요\./);
  assert.match(app, /function reviewIssueSummary/);
  assert.match(app, /reviewFeedback\.detectedIssues/);
  assert.match(app, /commentReview\.detectedIssues/);

  assert.match(reviewRoute, /rateLimit\(request, "review", 10, 60_000\)/);
  assert.doesNotMatch(reviewRoute, /verifyTurnstile/);
  assert.match(reviewRoute, /reviewSubmission\(title, text, "post"\)/);
  assert.match(reviewRoute, /issueReviewToken/);

  assert.match(postRoute, /rateLimit\(request, "post", 6, 10 \* 60_000\)/);
  assert.match(postRoute, /verifyReviewToken/);
  assert.match(postRoute, /verifyTurnstile\(request, payload\.turnstileToken, "post"\)/);
  assert.match(postRoute, /assessPostQuality\(qualityTitle, content\)/);
  assert.match(postRoute, /hasPii\(`\$\{title\} \$\{content\}`\)/);
  assert.match(postRoute, /createDuplicatePostChecker\(\)/);

  assert.doesNotMatch(commentsRoute, /verifyTurnstile/);
  assert.match(commentsRoute, /rateLimit\(request, "comment", 12, 10 \* 60_000\)/);
  assert.match(commentsRoute, /isDuplicateComment/);
  assert.match(commentsRoute, /reviewSubmission\("", content, "comment"\)/);
  assert.ok(commentsRoute.indexOf('reviewSubmission("", content, "comment")') < commentsRoute.indexOf("INSERT INTO comments"));

  assert.match(feedbackRoute, /verifyTurnstile\(request, payload\.turnstileToken, "feedback"\)/);
});
