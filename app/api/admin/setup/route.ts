import { createAdminCredential, timingSafeEqual } from "../../../../lib/admin-auth";
import { db, databaseEnabled, ensureSchema, hash } from "../../../../lib/db";
import { rateLimit } from "../../../../lib/rate-limit";

const ADMIN_SETUP_TOKEN_HASH = "ae83a2c2d0e0b1a8a61dd4a05f6f7e497f12ca6c8dc0d9c0a020e242f4397071";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(request, "admin-setup", 5, 30 * 60_000);
  if (!limit.allowed) return Response.json({ error: "등록 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  await ensureSchema();
  const existing = await db()`SELECT id FROM admin_credentials WHERE id = 'owner' LIMIT 1`;
  if (existing[0]) return Response.json({ error: "관리자 등록이 이미 완료됐습니다." }, { status: 409 });
  const payload = await request.json().catch(() => ({})) as { setupToken?: string; password?: string };
  const setupToken = payload.setupToken || "";
  const password = payload.password || "";
  const suppliedTokenHash = await hash(setupToken);
  if (!setupToken || !timingSafeEqual(ADMIN_SETUP_TOKEN_HASH, suppliedTokenHash)) {
    return Response.json({ error: "관리자 등록 권한을 확인해주세요." }, { status: 401 });
  }
  if (password.length < 16 || password.length > 128) {
    return Response.json({ error: "관리자 비밀번호는 16~128자로 설정해주세요." }, { status: 400 });
  }
  const credential = await createAdminCredential(password);
  const rows = await db()`
    INSERT INTO admin_credentials (id, password_salt, password_hash, password_iterations)
    VALUES ('owner', ${credential.salt}, ${credential.passwordHash}, ${credential.iterations})
    ON CONFLICT (id) DO NOTHING
    RETURNING id`;
  if (!rows[0]) return Response.json({ error: "관리자 등록이 이미 완료됐습니다." }, { status: 409 });
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
