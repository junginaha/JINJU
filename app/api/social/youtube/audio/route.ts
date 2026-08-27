import { verifyGithubSocialRequest } from "@/lib/github-oidc";
import { claimedYoutubeJob } from "@/lib/social-automation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const headers = { "cache-control": "no-store" };

export async function POST(request: Request) {
  let authorized = false;
  try {
    authorized = await verifyGithubSocialRequest(request);
  } catch (error) {
    console.error("[youtube-audio] OIDC verification failed", error);
  }
  if (!authorized) return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers });

  let postId = "";
  try {
    const body = await request.json() as { postId?: unknown };
    if (typeof body.postId === "string" && /^[A-Za-z0-9_-]{1,180}$/u.test(body.postId)) postId = body.postId;
  } catch {
    // Invalid input is handled below without exposing job state.
  }
  if (!postId) return Response.json({ ok: false, error: "invalid_post_id" }, { status: 400, headers });

  const job = await claimedYoutubeJob(postId);
  if (!job) return Response.json({ ok: false, error: "youtube_job_not_found" }, { status: 404, headers });
  const key = process.env.OPENAI_API_KEY?.trim() || process.env.AI_API_KEY?.trim() || "";
  if (!key) return Response.json({ ok: false, error: "speech_not_configured" }, { status: 503, headers });

  try {
    const base = (process.env.OPENAI_API_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/u, "");
    const response = await fetch(`${base}/audio/speech`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts",
        voice: process.env.OPENAI_TTS_VOICE?.trim() || "marin",
        input: job.script,
        instructions: "차분하고 따뜻한 한국어 내레이션. 문장 사이를 자연스럽게 쉬고, 과장하지 말 것.",
        response_format: "mp3",
        speed: 1.02,
      }),
      signal: AbortSignal.timeout(50_000),
    });
    if (!response.ok) {
      console.error("[youtube-audio] speech generation failed", response.status);
      return Response.json({ ok: false, error: "speech_generation_failed" }, { status: 502, headers });
    }
    return new Response(response.body, {
      status: 200,
      headers: { ...headers, "content-type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("[youtube-audio] speech request failed", error);
    return Response.json({ ok: false, error: "speech_request_failed" }, { status: 502, headers });
  }
}
