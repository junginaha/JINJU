import { verifyGithubSocialRequest } from "@/lib/github-oidc";
import { claimYoutubePublishing } from "@/lib/social-automation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const headers = { "cache-control": "no-store" };

export async function POST(request: Request) {
  let authorized = false;
  try {
    authorized = await verifyGithubSocialRequest(request);
  } catch (error) {
    console.error("[youtube-claim] OIDC verification failed", error);
  }
  if (!authorized) return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers });

  let preferredPostId = "";
  try {
    const body = await request.json() as { postId?: unknown };
    if (typeof body.postId === "string" && /^[A-Za-z0-9_-]{1,180}$/u.test(body.postId)) {
      preferredPostId = body.postId;
    }
  } catch {
    // An empty body is valid; the highest scoring safe post will be selected.
  }

  try {
    const result = await claimYoutubePublishing(preferredPostId);
    return Response.json(result, {
      status: result.status === "not_configured" ? 503 : 200,
      headers,
    });
  } catch (error) {
    console.error("[youtube-claim] claim failed", error);
    return Response.json({ ok: false, error: "youtube_claim_failed" }, { status: 500, headers });
  }
}
