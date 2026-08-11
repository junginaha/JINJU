import {
  issuePostSecurityFallback,
  POST_SECURITY_FALLBACK_DELAY_MS,
} from "../../../../lib/post-security-fallback";

const headers = { "cache-control": "no-store" };

export async function POST(request: Request) {
  const proof = await issuePostSecurityFallback(request);
  if (!proof) {
    return Response.json(
      { error: "보안 확인 준비가 잠시 늦어지고 있습니다." },
      { status: 503, headers },
    );
  }
  return Response.json({ proof, readyAfterMs: POST_SECURITY_FALLBACK_DELAY_MS }, { headers });
}
