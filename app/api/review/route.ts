import { reviewSubmission } from "../../../lib/ai-review";
import { generateCoreTitle } from "../../../lib/title";
import { rateLimit } from "../../../lib/rate-limit";
import { issueReviewToken } from "../../../lib/review-token";

export async function POST(request: Request) {
  const limit = await rateLimit(request, "review", 10, 60_000);
  if (!limit.allowed) return Response.json({ error: "검수 요청이 잠시 몰렸습니다. 잠깐 뒤 다시 눌러주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  const payload = await request.json() as { title?: string; text?: string; category?: string };
  const title = payload.title?.trim() ?? "";
  const text = payload.text?.trim() ?? "";
  const category = payload.category?.trim() || "일상";
  if (title.length > 80 || text.length < 8 || text.length > 2000) return Response.json({ error: "본문은 8~2,000자로 작성해주세요." }, { status: 400 });
  const suggestedTitle = title || generateCoreTitle(text);
  const review = await reviewSubmission(suggestedTitle, text);
  const reviewToken = await issueReviewToken({ title: suggestedTitle, content: text, category, review });
  return Response.json({ ...review, suggestedTitle, reviewToken });
}
