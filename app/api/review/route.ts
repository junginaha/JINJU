import { reviewSubmission } from "../../../lib/ai-review";
import { normalizeGeneratedTitle } from "../../../lib/title";
import { rateLimit } from "../../../lib/rate-limit";
import { issueReviewToken } from "../../../lib/review-token";
import { POST_MIN_CONTENT_LENGTH } from "../../../lib/post-quality";
import { turnstileFailure, verifyTurnstile } from "../../../lib/turnstile";

export async function POST(request: Request) {
  const limit = await rateLimit(request, "review", 10, 60_000);
  if (!limit.allowed) return Response.json({ error: "검수 요청이 잠시 몰렸습니다. 잠깐 뒤 다시 눌러주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  const payload = await request.json() as { title?: string; text?: string; category?: string; turnstileToken?: string; turnstileFallbackProof?: string };
  const title = payload.title?.trim() ?? "";
  const text = payload.text?.trim() ?? "";
  const category = payload.category?.trim() || "일상";
  if (title.length > 80 || text.length < POST_MIN_CONTENT_LENGTH || text.length > 2000) return Response.json({ error: `상황과 느낀 점을 ${POST_MIN_CONTENT_LENGTH}자 이상 적어주세요.` }, { status: 400 });
  const turnstile = await verifyTurnstile(request, payload.turnstileToken, "post", payload.turnstileFallbackProof);
  if (!turnstile.ok) return turnstileFailure(turnstile);
  const review = await reviewSubmission(title, text, "post");
  const suggestedTitle = title || normalizeGeneratedTitle(review.suggestedTitle, text);
  const reviewToken = await issueReviewToken({ title: suggestedTitle, content: text, category, review });
  return Response.json({ ...review, suggestedTitle, reviewToken });
}
