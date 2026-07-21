import { hasValidMutationOrigin, isAdminRequest } from "../../../../lib/admin-auth";
import { db, databaseEnabled, ensureSchema, hash } from "../../../../lib/db";
import { editorialPost, editorialPosts } from "../../../../lib/editorial";
import { rateLimit } from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

function unavailable() {
  return Response.json({ error: "운영자 승인 기능이 설정되지 않았습니다." }, { status: 503 });
}

export async function GET(request: Request) {
  const limit = await rateLimit(request, "admin-review", 12, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "인증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled()) return unavailable();
  if (!await isAdminRequest(request)) return Response.json({ error: "운영자 비밀번호를 확인해주세요." }, { status: 401 });
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
  const reactionRows = await db()`
    SELECT id, title, heard, same
    FROM posts
    WHERE status = 'approved'
    ORDER BY created_at DESC
    LIMIT 200`;
  const reactionMap = new Map(editorialPosts.map((post) => [post.id, { id: post.id, title: post.title, heard: post.heard, same: post.same }]));
  for (const row of reactionRows) reactionMap.set(String(row.id), { id: String(row.id), title: String(row.title), heard: Number(row.heard), same: Number(row.same) });
  const reactions = [...reactionMap.values()];
  return Response.json({ posts, reactions }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  const limit = await rateLimit(request, "admin-review", 30, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "처리 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!hasValidMutationOrigin(request)) return Response.json({ error: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
  if (!databaseEnabled()) return unavailable();
  if (!await isAdminRequest(request)) return Response.json({ error: "운영자 비밀번호를 확인해주세요." }, { status: 401 });
  const payload = await request.json().catch(() => ({})) as { id?: string; action?: "approve" | "reject" | "set-reactions"; heard?: number; same?: number };
  if (!payload.id || !["approve", "reject", "set-reactions"].includes(payload.action || "")) {
    return Response.json({ error: "처리할 글과 승인 여부를 확인해주세요." }, { status: 400 });
  }
  await ensureSchema();
  if (payload.action === "set-reactions") {
    const heard = Number(payload.heard);
    const same = Number(payload.same);
    if (!Number.isSafeInteger(heard) || !Number.isSafeInteger(same) || heard < 0 || same < 0) {
      return Response.json({ error: "반응 수는 0 이상의 정수로 입력해주세요." }, { status: 400 });
    }
    let rows = await db()`SELECT id FROM posts WHERE id = ${payload.id} LIMIT 1`;
    if (!rows[0]) {
      const fallback = editorialPost(payload.id);
      if (!fallback) return Response.json({ error: "공개된 글을 찾을 수 없습니다." }, { status: 404 });
      await db()`INSERT INTO posts (id, title, content, category, mode, visibility, risk_level, status, delete_key_hash, heard, same, support, comment_count, created_at, updated_at) VALUES (${fallback.id}, ${fallback.title}, ${fallback.content}, ${fallback.category}, ${fallback.mode || "털어놓기"}, 'public', 'low', 'approved', ${await hash(`editorial:${fallback.id}`)}, ${fallback.heard}, ${fallback.same}, ${fallback.support}, 0, ${fallback.createdAt}, ${fallback.updatedAt || fallback.createdAt}) ON CONFLICT (id) DO NOTHING`;
    }
    rows = await db()`
      UPDATE posts
      SET heard = ${heard}, same = ${same}, updated_at = NOW()
      WHERE id = ${payload.id} AND status = 'approved'
      RETURNING id, heard, same`;
    if (!rows[0]) return Response.json({ error: "공개된 글을 찾을 수 없습니다." }, { status: 404 });
    return Response.json({ id: String(rows[0].id), heard: Number(rows[0].heard), same: Number(rows[0].same) }, { headers: { "cache-control": "no-store" } });
  }
  const nextStatus = payload.action === "approve" ? "approved" : "rejected";
  const rows = await db()`
    UPDATE posts
    SET status = ${nextStatus}, reviewed_at = NOW(), updated_at = NOW()
    WHERE id = ${payload.id} AND status = 'pending'
    RETURNING id`;
  if (!rows[0]) return Response.json({ error: "이미 처리됐거나 찾을 수 없는 글입니다." }, { status: 404 });
  return Response.json({ id: String(rows[0].id), status: nextStatus }, { headers: { "cache-control": "no-store" } });
}
