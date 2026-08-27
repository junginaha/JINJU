import { verifyGithubSocialRequest } from "@/lib/github-oidc";
import { completeYoutubePublishing } from "@/lib/social-automation";

export const dynamic = "force-dynamic";

const headers = { "cache-control": "no-store" };
const statuses = new Set(["published", "failed", "unknown"]);

export async function POST(request: Request) {
  let authorized = false;
  try {
    authorized = await verifyGithubSocialRequest(request);
  } catch (error) {
    console.error("[youtube-complete] OIDC verification failed", error);
  }
  if (!authorized) return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers });

  let body: { postId?: unknown; status?: unknown; remoteId?: unknown; error?: unknown } = {};
  try {
    body = await request.json() as typeof body;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400, headers });
  }
  if (
    typeof body.postId !== "string"
    || !/^[A-Za-z0-9_-]{1,180}$/u.test(body.postId)
    || typeof body.status !== "string"
    || !statuses.has(body.status)
  ) {
    return Response.json({ ok: false, error: "invalid_completion" }, { status: 400, headers });
  }

  try {
    const completed = await completeYoutubePublishing({
      postId: body.postId,
      status: body.status as "published" | "failed" | "unknown",
      remoteId: typeof body.remoteId === "string" ? body.remoteId : "",
      error: typeof body.error === "string" ? body.error : "",
    });
    return Response.json({ ok: completed }, { status: completed ? 200 : 409, headers });
  } catch (error) {
    console.error("[youtube-complete] update failed", error);
    return Response.json({ ok: false, error: "youtube_completion_failed" }, { status: 500, headers });
  }
}
