import { databaseEnabled } from "../../../../lib/db";
import { rateLimit } from "../../../../lib/rate-limit";
import { registerAnonymousMember, validIdentityCommitment } from "../../../../lib/zk-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = await rateLimit(request, "zk-membership", 6, 24 * 60 * 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: "익명 이용 자격 요청이 많았습니다. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }
  if (!databaseEnabled()) {
    return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({})) as { commitment?: unknown };
  if (!validIdentityCommitment(payload.commitment)) {
    return Response.json({ error: "올바르지 않은 익명 이용 자격입니다." }, { status: 400 });
  }

  const membership = await registerAnonymousMember(payload.commitment);
  return Response.json(membership, {
    status: 201,
    headers: { "cache-control": "no-store" },
  });
}
