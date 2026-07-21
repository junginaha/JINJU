import type { SubmissionReview } from "./ai-review";

type ReviewTicket = {
  title: string;
  content: string;
  category: string;
  review: SubmissionReview;
  expiresAt: number;
};

function secret() {
  return process.env.REVIEW_TOKEN_SECRET || process.env.ADMIN_REVIEW_SECRET || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "";
}

function toBase64Url(value: Uint8Array) {
  return Buffer.from(value).toString("base64url");
}

async function signature(payload: string, keyValue: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(keyValue), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
}

export async function issueReviewToken(ticket: Omit<ReviewTicket, "expiresAt">) {
  const keyValue = secret();
  if (!keyValue) return "";
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ ...ticket, expiresAt: Date.now() + 5 * 60_000 })));
  return `${payload}.${await signature(payload, keyValue)}`;
}

export async function verifyReviewToken(token: string, title: string, content: string, category: string) {
  const keyValue = secret();
  const [payload, suppliedSignature] = token.split(".");
  if (!keyValue || !payload || !suppliedSignature) return null;
  const expectedSignature = await signature(payload, keyValue);
  if (expectedSignature.length !== suppliedSignature.length) return null;
  let difference = 0;
  for (let index = 0; index < expectedSignature.length; index += 1) difference |= expectedSignature.charCodeAt(index) ^ suppliedSignature.charCodeAt(index);
  if (difference !== 0) return null;
  try {
    const ticket = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ReviewTicket;
    if (ticket.expiresAt < Date.now() || ticket.title !== title || ticket.content !== content || ticket.category !== category) return null;
    return ticket.review;
  } catch {
    return null;
  }
}
