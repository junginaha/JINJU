import { reviewText } from "../../../lib/safety";
import { generateCoreTitle } from "../../../lib/title";

export async function POST(request: Request) {
  const payload = await request.json() as { title?: string; text?: string };
  const title = payload.title?.trim() ?? "";
  const text = payload.text?.trim() ?? "";
  if (title.length > 80 || text.length < 8 || text.length > 2000) return Response.json({ error: "본문은 8~2,000자로 작성해주세요." }, { status: 400 });
  const review = reviewText(`${title}\n${text}`);
  return Response.json({ ...review, suggestedTitle: title || generateCoreTitle(text) });
}
