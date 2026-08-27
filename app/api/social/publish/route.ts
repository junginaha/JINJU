import { verifyGithubSocialRequest } from "@/lib/github-oidc";
import { runSocialPublishing } from "@/lib/social-automation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const headers = { "cache-control": "no-store" };

export async function POST(request: Request) {
  let authorized = false;
  try {
    authorized = await verifyGithubSocialRequest(request);
  } catch (error) {
    console.error("[social-publish] OIDC verification failed", error);
  }
  if (!authorized) return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers });

  try {
    const result = await runSocialPublishing();
    const failed = result.status === "not_configured" || (result.status === "completed" && !result.ok);
    return Response.json(result, { status: failed ? 503 : 200, headers });
  } catch (error) {
    console.error("[social-publish] run failed", error);
    return Response.json({ ok: false, error: "social_publish_run_failed" }, { status: 500, headers });
  }
}
