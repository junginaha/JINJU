import { isAdminRequest } from "../../../../lib/admin-auth";
import { db, databaseEnabled, ensureSchema } from "../../../../lib/db";
import { rateLimit } from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

function unavailable() {
  return Response.json({ error: "운영자 승인 기능이 설정되지 않았습니다." }, { status: 503 });
}

export async function GET(request: Request) {
  const limit = rateLimit(request, "admin-review", 12, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "인증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled() || !process.env.ADMIN_REVIEW_SECRET) return unavailable();
  if (!isAdminRequest(request)) return Response.json({ error: "운영자 인증을 확인해주세요." }, { status: 401 });
  await ensureSchema();
  const rows = await db()`
    SELECT id, title, content, category, risk_level, review_issues,
           review_explanation, review_source, created_at
    FROM posts
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 200`;
  const posts = rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    category: String(row.category),
    riskLevel: String(row.risk_level),
    issues: String(row.review_issues || "").split(" · ").filter(Boolean),
    explanation: String(row.review_explanation || ""),
    reviewSource: String(row.review_source || "rules"),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
  return Response.json({ posts }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  const limit = rateLimit(request, "admin-review", 30, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "처리 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled() || !process.env.ADMIN_REVIEW_SECRET) return unavailable();
  if (!isAdminRequest(request)) return Response.json({ error: "운영자 인증을 확인해주세요." }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as { id?: string; action?: "approve" | "reject" };
  if (!payload.id || !["approve", "reject"].includes(payload.action || "")) {
    return Response.json({ error: "처리할 글과 승인 여부를 확인해주세요." }, { status: 400 });
  }
  await ensureSchema();
  const nextStatus = payload.action === "approve" ? "approved" : "rejected";
  const rows = await db()`
    UPDATE posts
    SET status = ${nextStatus}, reviewed_at = NOW(), updated_at = NOW()
    WHERE id = ${payload.id} AND status = 'pending'
    RETURNING id`;
  if (!rows[0]) return Response.json({ error: "이미 처리됐거나 찾을 수 없는 글입니다." }, { status: 404 });
  return Response.json({ id: String(rows[0].id), status: nextStatus }, { headers: { "cache-control": "no-store" } });
}
