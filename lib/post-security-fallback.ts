import { abuseHmacReady, anonymousActorHash, signAbuseValue } from "./rate-limit";

type PostSecurityFallbackTicket = {
  version: 1;
  actorHash: string;
  availableAt: number;
  expiresAt: number;
  nonce: string;
};

export const POST_SECURITY_FALLBACK_DELAY_MS = 8_000;
export const POST_SECURITY_FALLBACK_TTL_MS = 10 * 60_000;
const SIGNATURE_PREFIX = "jinju:post-security-fallback:v1:";

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sameText(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function issuePostSecurityFallback(request: Request, now = Date.now()) {
  if (!abuseHmacReady()) return "";
  const ticket: PostSecurityFallbackTicket = {
    version: 1,
    actorHash: await anonymousActorHash(request, "post-security-fallback"),
    availableAt: now + POST_SECURITY_FALLBACK_DELAY_MS,
    expiresAt: now + POST_SECURITY_FALLBACK_TTL_MS,
    nonce: crypto.randomUUID(),
  };
  const payload = encode(JSON.stringify(ticket));
  const signature = await signAbuseValue(`${SIGNATURE_PREFIX}${payload}`);
  return `${payload}.${signature}`;
}

export async function verifyPostSecurityFallback(request: Request, proof: string | undefined, now = Date.now()) {
  const value = proof?.trim() || "";
  if (!abuseHmacReady() || !value || value.length > 2048) return false;
  const [payload, suppliedSignature, extra] = value.split(".");
  if (!payload || !suppliedSignature || extra) return false;
  const expectedSignature = await signAbuseValue(`${SIGNATURE_PREFIX}${payload}`);
  if (!sameText(expectedSignature, suppliedSignature)) return false;
  try {
    const ticket = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<PostSecurityFallbackTicket>;
    if (
      ticket.version !== 1
      || typeof ticket.actorHash !== "string"
      || typeof ticket.availableAt !== "number"
      || typeof ticket.expiresAt !== "number"
      || typeof ticket.nonce !== "string"
      || ticket.nonce.length < 16
      || ticket.availableAt > now
      || ticket.expiresAt <= now
      || ticket.expiresAt - ticket.availableAt > POST_SECURITY_FALLBACK_TTL_MS
    ) return false;
    const actorHash = await anonymousActorHash(request, "post-security-fallback");
    return sameText(ticket.actorHash, actorHash);
  } catch {
    return false;
  }
}
