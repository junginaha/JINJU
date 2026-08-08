import { db, databaseEnabled, ensureSchema, hash, token } from "../../../lib/db";
import { getPublicPost } from "../../../lib/public-posts";
import { anonymousActorHash, rateLimit } from "../../../lib/rate-limit";
import { turnstileFailure, verifyTurnstile } from "../../../lib/turnstile";

const RIGHTS_REQUEST = "권리침해·삭제·임시조치 요청";
const REASONS = [RIGHTS_REQUEST, "개인정보 노출", "실명 거론·명예훼손", "혐오·괴롭힘", "불법·위험한 내용", "광고·도배", "기타"];

export const dynamic = "force-dynamic";

function receiptNumber() {
  const date = new Date(Date.now() + 9 * 60 * 60_000).toISOString().slice(2, 10).replaceAll("-", "");
  return `JINJU-${date}-${token(3).slice(0, 6).toUpperCase()}`;
}

export async function POST(request: Request) {
  const limit = await rateLimit(request, "feedback", 6, 60 * 60_000);
  if (!limit.allowed) return Response.json({ error: "짧은 시간에 의견이 많이 접수됐습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled()) return Response.json({ error: "의견 접수 저장소가 연결되지 않았습니다." }, { status: 503 });
  const payload = await request.json().catch(() => ({})) as { postId?: string; reason?: string; detail?: string; turnstileToken?: string };
  const postId = payload.postId?.trim() || "";
  const reason = payload.reason?.trim() || "";
  const detail = payload.detail?.trim() || "";
  if (!postId || !REASONS.includes(reason) || detail.length > 300) return Response.json({ error: "대상과 의견 내용을 확인해주세요." }, { status: 400 });
  if (reason === RIGHTS_REQUEST && detail.length < 10) return Response.json({ error: "침해된 권리와 원하는 조치를 10자 이상 적어주세요." }, { status: 400 });
  if (!await getPublicPost(postId)) return Response.json({ error: "의견을 보낼 글을 찾을 수 없습니다." }, { status: 404 });
  const turnstile = await verifyTurnstile(request, payload.turnstileToken, "feedback");
  if (!turnstile.ok) return turnstileFailure(turnstile);
  await ensureSchema();
  await db()`DELETE FROM feedback_reports WHERE expires_at <= NOW()`;
  const reporterHash = await anonymousActorHash(request, "feedback-reporter");
  const duplicate = await db()`
    SELECT receipt FROM feedback_reports
    WHERE post_id = ${postId} AND reporter_hash = ${reporterHash} AND created_at > NOW() - INTERVAL '24 hours'
    LIMIT 1`;
  if (duplicate[0]) return Response.json({ error: "같은 글에 보낸 의견이 이미 접수됐습니다." }, { status: 409 });

  const receipt = receiptNumber();
  const checkKey = token(5).slice(0, 10).toUpperCase();
  const initialStatus = reason === RIGHTS_REQUEST ? "reviewing" : "received";
  await db()`
    INSERT INTO feedback_reports (receipt, post_id, reason, detail, check_key_hash, reporter_hash, status, expires_at)
    VALUES (${receipt}, ${postId}, ${reason}, ${detail}, ${await hash(checkKey)}, ${reporterHash}, ${initialStatus}, NOW() + INTERVAL '30 days')`;
  const recent = await db()`
    SELECT COUNT(DISTINCT reporter_hash)::INTEGER AS count
    FROM feedback_reports
    WHERE post_id = ${postId} AND created_at > NOW() - INTERVAL '30 minutes'`;
  const shouldBlind = Number(recent[0]?.count || 0) >= 5;
  if (shouldBlind) {
    await db()`
      INSERT INTO admin_content_overrides (kind, id, post_id, hidden)
      VALUES ('post', ${postId}, ${postId}, TRUE)
      ON CONFLICT (kind, id) DO UPDATE SET hidden = TRUE, updated_at = NOW()`;
    await db()`UPDATE feedback_reports SET auto_blinded = TRUE, status = 'reviewing', updated_at = NOW() WHERE post_id = ${postId} AND status IN ('received', 'reviewing')`;
  }
  return Response.json({ receipt, checkKey, status: shouldBlind || initialStatus === "reviewing" ? "reviewing" : "received" }, { status: 201, headers: { "cache-control": "no-store" } });
}

export async function GET(request: Request) {
  const limit = await rateLimit(request, "feedback-status", 30, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "확인 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled()) return Response.json({ error: "의견 접수 저장소가 연결되지 않았습니다." }, { status: 503 });
  const url = new URL(request.url);
  const receipt = url.searchParams.get("receipt")?.trim().toUpperCase() || "";
  const checkKey = url.searchParams.get("key")?.trim().toUpperCase() || "";
  if (!receipt || !checkKey) return Response.json({ error: "접수번호와 확인키를 입력해주세요." }, { status: 400 });
  await ensureSchema();
  const rows = await db()`SELECT post_id, status, created_at FROM feedback_reports WHERE receipt = ${receipt} AND check_key_hash = ${await hash(checkKey)} AND expires_at > NOW() LIMIT 1`;
  if (!rows[0]) return Response.json({ error: "접수 내역을 찾을 수 없습니다." }, { status: 404 });
  const status = String(rows[0].status);
  let resolution: "hidden" | "kept" | "" = "";
  if (status === "resolved") {
    const postId = String(rows[0].post_id);
    const overrides = await db()`SELECT hidden FROM admin_content_overrides WHERE kind = 'post' AND id = ${postId} LIMIT 1`;
    resolution = Boolean(overrides[0]?.hidden) ? "hidden" : "kept";
  }
  return Response.json({ receipt, status, resolution, createdAt: new Date(String(rows[0].created_at)).toISOString() }, { headers: { "cache-control": "no-store" } });
}
