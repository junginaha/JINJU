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

test("desktop composer has a recoverable security path without weakening feedback reports", async () => {
  const component = await import("node:fs/promises").then((fs) => fs.readFile("components/TurnstileChallenge.tsx", "utf8"));
  const app = await import("node:fs/promises").then((fs) => fs.readFile("components/JinjuApp.tsx", "utf8"));
  const reviewRoute = await import("node:fs/promises").then((fs) => fs.readFile("app/api/review/route.ts", "utf8"));
  const postRoute = await import("node:fs/promises").then((fs) => fs.readFile("app/api/posts/route.ts", "utf8"));
  const feedbackRoute = await import("node:fs/promises").then((fs) => fs.readFile("app/api/feedback/route.ts", "utf8"));

  assert.match(component, /fetch\(FALLBACK_ENDPOINT/);
  assert.match(component, /"timeout-callback"/);
  assert.match(component, /"unsupported-callback"/);
  assert.match(component, />다시 확인<\/button>/);
  assert.match(app, /turnstileFallbackProof: postTurnstileFallbackProof/);
  assert.match(reviewRoute, /verifyTurnstile\(request, payload\.turnstileToken, "post", payload\.turnstileFallbackProof\)/);
  assert.ok(reviewRoute.indexOf("reviewSubmission(title, text, \"post\")") > reviewRoute.indexOf("verifyTurnstile(request"));
  assert.match(postRoute, /rateLimit\(request, "post", 6, 10 \* 60_000\)/);
  assert.match(postRoute, /assessPostQuality\(qualityTitle, content\)/);
  assert.match(postRoute, /hasPii\(`\$\{title\} \$\{content\}`\)/);
  assert.match(postRoute, /createDuplicatePostChecker\(\)/);
  assert.match(feedbackRoute, /verifyTurnstile\(request, payload\.turnstileToken, "feedback"\)/);
  assert.doesNotMatch(feedbackRoute, /turnstileFallbackProof/);
});
