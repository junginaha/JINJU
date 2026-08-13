import type { SubmissionReview } from "./ai-review";
import { abuseHmacReady, signAbuseValue } from "./rate-limit";

type ReviewTicket = {
  title: string;
  content: string;
  category: string;
  review: SubmissionReview;
  expiresAt: number;
};

const ABUSE_SIGNATURE_PREFIX = "jinju:review-ticket:v1:";

function dedicatedSecret() {
  return process.env.REVIEW_TOKEN_SECRET || process.env.ADMIN_REVIEW_SECRET || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "";
}

function toBase64Url(value: Uint8Array) {
  return Buffer.from(value).toString("base64url");
}

async function hmacSignature(payload: string, keyValue: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(keyValue), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
}

async function ticketSignature(payload: string) {
  const keyValue = dedicatedSecret();
  if (keyValue) return hmacSignature(payload, keyValue);
  if (!abuseHmacReady()) return "";
  return signAbuseValue(`${ABUSE_SIGNATURE_PREFIX}${payload}`);
}

export async function issueReviewToken(ticket: Omit<ReviewTicket, "expiresAt">) {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ ...ticket, expiresAt: Date.now() + 5 * 60_000 })));
  const signed = await ticketSignature(payload);
  return signed ? `${payload}.${signed}` : "";
}

export async function verifyReviewToken(token: string, title: string, content: string, category: string) {
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return null;
  const expectedSignature = await ticketSignature(payload);
  if (!expectedSignature || expectedSignature.length !== suppliedSignature.length) return null;
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
