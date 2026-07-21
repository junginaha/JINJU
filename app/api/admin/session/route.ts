import {
  authenticateAdminCredential,
  clearAdminSessionCookie,
  createAdminSession,
  deleteAdminSession,
  getAdminIdentity,
  hasValidMutationOrigin,
} from "../../../../lib/admin-auth";
import { rateLimit } from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getAdminIdentity(request);
  if (!identity) return Response.json({ authenticated: false }, { status: 401, headers: { "cache-control": "no-store" } });
  return Response.json({ authenticated: true, identity }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const limit = await rateLimit(request, "admin-login", 5, 15 * 60_000);
  if (!limit.allowed) return Response.json({ error: "로그인 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!hasValidMutationOrigin(request)) return Response.json({ error: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
  const payload = await request.json().catch(() => ({})) as { username?: string; password?: string };
  const identity = await authenticateAdminCredential(payload.username || "", payload.password || "");
  if (!identity) return Response.json({ error: "운영자 아이디 또는 비밀번호를 확인해주세요." }, { status: 401 });
  const session = await createAdminSession(identity);
  return Response.json({ authenticated: true, identity }, { headers: { "cache-control": "no-store", "set-cookie": session.cookie } });
}

export async function DELETE(request: Request) {
  if (!hasValidMutationOrigin(request)) return Response.json({ error: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
  await deleteAdminSession(request);
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store", "set-cookie": clearAdminSessionCookie() } });
}
