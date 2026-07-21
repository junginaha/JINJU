import { hasValidMutationOrigin, isAdminRequest } from "../../../../lib/admin-auth";
import { db, databaseEnabled, ensureSchema } from "../../../../lib/db";
import { editorialPost } from "../../../../lib/editorial";
import { rateLimit } from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = await rateLimit(request, "admin-feedback", 30, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "관리 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  if (!await isAdminRequest(request)) return Response.json({ error: "운영자 로그인이 필요합니다." }, { status: 401 });
  await ensureSchema();
  const rows = await db()`
    SELECT report.receipt, report.post_id, report.reason, report.detail, report.status,
           report.auto_blinded, report.created_at, post.title
    FROM feedback_reports AS report
    LEFT JOIN posts AS post ON post.id = report.post_id
    WHERE report.expires_at > NOW()
    ORDER BY report.created_at DESC
    LIMIT 200`;
  const reports = rows.map((row) => ({
    receipt: String(row.receipt),
    postId: String(row.post_id),
    postTitle: row.title ? String(row.title) : editorialPost(String(row.post_id))?.title || "공개 의견",
    reason: String(row.reason),
    detail: String(row.detail || ""),
    status: String(row.status),
    autoBlinded: Boolean(row.auto_blinded),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
  return Response.json({ reports }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  const limit = await rateLimit(request, "admin-feedback-write", 40, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "처리 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!hasValidMutationOrigin(request)) return Response.json({ error: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  if (!await isAdminRequest(request)) return Response.json({ error: "운영자 로그인이 필요합니다." }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as { receipt?: string; action?: "keep" | "hide" };
  if (!payload.receipt || !["keep", "hide"].includes(payload.action || "")) return Response.json({ error: "처리할 접수 건을 확인해주세요." }, { status: 400 });
  await ensureSchema();
  const reports = await db()`SELECT post_id FROM feedback_reports WHERE receipt = ${payload.receipt} AND expires_at > NOW() LIMIT 1`;
  if (!reports[0]) return Response.json({ error: "접수 내역을 찾을 수 없습니다." }, { status: 404 });
  const postId = String(reports[0].post_id);
  const hidden = payload.action === "hide";
  await db()`
    INSERT INTO admin_content_overrides (kind, id, post_id, hidden)
    VALUES ('post', ${postId}, ${postId}, ${hidden})
    ON CONFLICT (kind, id) DO UPDATE SET hidden = EXCLUDED.hidden, updated_at = NOW()`;
  await db()`UPDATE feedback_reports SET status = 'resolved', updated_at = NOW() WHERE post_id = ${postId} AND status IN ('received', 'reviewing')`;
  return Response.json({ ok: true, postId, hidden }, { headers: { "cache-control": "no-store" } });
}
