import assert from "node:assert/strict";
import test from "node:test";
import { issueReviewToken, verifyReviewToken } from "../lib/review-token";
import type { SubmissionReview } from "../lib/ai-review";

const review: SubmissionReview = {
  decision: "allow",
  riskLevel: "low",
  detectedIssues: [],
  explanation: "검토를 통과했습니다.",
  suggestion: "바로 게시할 수 있습니다.",
  containsPii: false,
  source: "rules",
  suggestedTitle: "안전한 제목",
};

test("review tickets use the existing abuse signing secret when a dedicated secret is absent", async () => {
  const names = ["REVIEW_TOKEN_SECRET", "ADMIN_REVIEW_SECRET", "ABUSE_HMAC_SECRET", "OPENAI_API_KEY", "AI_API_KEY"] as const;
  const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    process.env.ABUSE_HMAC_SECRET = "review-ticket-test-secret";
    const ticket = { title: "안전한 제목", content: "서른 자 이상인 안전한 게시글 본문입니다. 오늘의 경험과 느낀 점을 함께 적었습니다.", category: "일상", review };
    const token = await issueReviewToken(ticket);
    assert.ok(token);
    assert.deepEqual(await verifyReviewToken(token, ticket.title, ticket.content, ticket.category), review);
    assert.equal(await verifyReviewToken(token, ticket.title, ticket.content + "변경", ticket.category), null);
  } finally {
    for (const name of names) {
      const value = original[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
