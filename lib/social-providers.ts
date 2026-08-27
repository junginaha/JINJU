import type { SocialCopyBundle } from "./social-copy";

export type SocialPlatform = "instagram" | "threads" | "naver_cafe" | "youtube";
export type DirectSocialPlatform = Exclude<SocialPlatform, "youtube">;

export type ProviderPublication = {
  platform: SocialPlatform;
  remoteId: string;
  publicUrl: string;
};

export class SocialProviderError extends Error {
  readonly phase: "prepare" | "publish";

  constructor(message: string, phase: "prepare" | "publish") {
    super(message);
    this.name = "SocialProviderError";
    this.phase = phase;
  }
}

type FetchLike = typeof fetch;

function required(value: string | undefined, name: string) {
  const normalized = value?.trim() || "";
  if (!normalized) throw new SocialProviderError(`${name}_not_configured`, "prepare");
  return normalized;
}

async function requestJson(
  input: string,
  init: RequestInit,
  label: string,
  phase: "prepare" | "publish",
  fetchImpl: FetchLike,
) {
  let response: Response;
  try {
    response = await fetchImpl(input, { ...init, signal: init.signal || AbortSignal.timeout(25_000) });
  } catch (error) {
    const reason = error instanceof Error ? error.name : "network_error";
    throw new SocialProviderError(`${label}_${reason}`, phase);
  }
  const text = await response.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = text ? JSON.parse(text) as Record<string, unknown> : {};
  } catch {
    parsed = {};
  }
  if (!response.ok) {
    const error = parsed.error as Record<string, unknown> | undefined;
    const message = String(error?.code || error?.type || parsed.errorCode || response.status);
    throw new SocialProviderError(`${label}_${message}`.slice(0, 180), phase);
  }
  return parsed;
}

function form(values: Record<string, string>) {
  return new URLSearchParams(values);
}

export function configuredSocialPlatforms(env = process.env): DirectSocialPlatform[] {
  const configured: DirectSocialPlatform[] = [];
  if (env.INSTAGRAM_USER_ID?.trim() && env.INSTAGRAM_ACCESS_TOKEN?.trim()) configured.push("instagram");
  if (env.THREADS_ACCESS_TOKEN?.trim()) configured.push("threads");
  if (
    env.NAVER_CAFE_ID?.trim()
    && env.NAVER_CAFE_MENU_ID?.trim()
    && (env.NAVER_ACCESS_TOKEN?.trim() || (
      env.NAVER_CLIENT_ID?.trim()
      && env.NAVER_CLIENT_SECRET?.trim()
      && env.NAVER_REFRESH_TOKEN?.trim()
    ))
  ) configured.push("naver_cafe");
  return configured;
}

export async function publishInstagram(
  copy: SocialCopyBundle["instagram"],
  env = process.env,
  fetchImpl: FetchLike = fetch,
): Promise<ProviderPublication> {
  const userId = required(env.INSTAGRAM_USER_ID, "instagram_user_id");
  const accessToken = required(env.INSTAGRAM_ACCESS_TOKEN, "instagram_access_token");
  const version = env.META_GRAPH_VERSION?.trim() || "v26.0";
  const base = `https://graph.facebook.com/${version}`;
  const container = await requestJson(`${base}/${encodeURIComponent(userId)}/media`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: form({ image_url: copy.imageUrl, caption: copy.caption, access_token: accessToken }),
  }, "instagram_container", "prepare", fetchImpl);
  const creationId = String(container.id || "");
  if (!creationId) throw new SocialProviderError("instagram_container_id_missing", "prepare");

  const published = await requestJson(`${base}/${encodeURIComponent(userId)}/media_publish`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: form({ creation_id: creationId, access_token: accessToken }),
  }, "instagram_publish", "publish", fetchImpl);
  const remoteId = String(published.id || "");
  if (!remoteId) throw new SocialProviderError("instagram_media_id_missing", "publish");
  const verified = await requestJson(
    `${base}/${encodeURIComponent(remoteId)}?fields=id,permalink&access_token=${encodeURIComponent(accessToken)}`,
    { method: "GET" },
    "instagram_verify",
    "publish",
    fetchImpl,
  );
  const publicUrl = String(verified.permalink || "");
  if (!publicUrl) throw new SocialProviderError("instagram_permalink_missing", "publish");
  return { platform: "instagram", remoteId, publicUrl };
}

export async function publishThreads(
  copy: SocialCopyBundle["threads"],
  env = process.env,
  fetchImpl: FetchLike = fetch,
): Promise<ProviderPublication> {
  const accessToken = required(env.THREADS_ACCESS_TOKEN, "threads_access_token");
  const base = "https://graph.threads.net/v1.0";
  const container = await requestJson(`${base}/me/threads`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: form({ media_type: "TEXT", text: copy.text, access_token: accessToken }),
  }, "threads_container", "prepare", fetchImpl);
  const creationId = String(container.id || "");
  if (!creationId) throw new SocialProviderError("threads_container_id_missing", "prepare");

  const published = await requestJson(`${base}/me/threads_publish`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: form({ creation_id: creationId, access_token: accessToken }),
  }, "threads_publish", "publish", fetchImpl);
  const remoteId = String(published.id || "");
  if (!remoteId) throw new SocialProviderError("threads_media_id_missing", "publish");
  const verified = await requestJson(
    `${base}/${encodeURIComponent(remoteId)}?fields=id,permalink&access_token=${encodeURIComponent(accessToken)}`,
    { method: "GET" },
    "threads_verify",
    "publish",
    fetchImpl,
  );
  const publicUrl = String(verified.permalink || "");
  if (!publicUrl) throw new SocialProviderError("threads_permalink_missing", "publish");
  return { platform: "threads", remoteId, publicUrl };
}

async function naverAccessToken(env: NodeJS.ProcessEnv, fetchImpl: FetchLike) {
  if (env.NAVER_CLIENT_ID?.trim() && env.NAVER_CLIENT_SECRET?.trim() && env.NAVER_REFRESH_TOKEN?.trim()) {
    const query = form({
      grant_type: "refresh_token",
      client_id: env.NAVER_CLIENT_ID.trim(),
      client_secret: env.NAVER_CLIENT_SECRET.trim(),
      refresh_token: env.NAVER_REFRESH_TOKEN.trim(),
    });
    const refreshed = await requestJson(`https://nid.naver.com/oauth2.0/token?${query.toString()}`, {
      method: "GET",
    }, "naver_token_refresh", "prepare", fetchImpl);
    const token = String(refreshed.access_token || "");
    if (token) return token;
  }
  return required(env.NAVER_ACCESS_TOKEN, "naver_access_token");
}

export async function publishNaverCafe(
  copy: SocialCopyBundle["naverCafe"],
  env = process.env,
  fetchImpl: FetchLike = fetch,
): Promise<ProviderPublication> {
  const cafeId = required(env.NAVER_CAFE_ID, "naver_cafe_id");
  const menuId = required(env.NAVER_CAFE_MENU_ID, "naver_cafe_menu_id");
  const accessToken = await naverAccessToken(env, fetchImpl);
  const response = await requestJson(
    `https://openapi.naver.com/v1/cafe/${encodeURIComponent(cafeId)}/menu/${encodeURIComponent(menuId)}/articles`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: form({
        subject: copy.subject,
        content: copy.content,
        openyn: "true",
        searchopen: "true",
        replyyn: "true",
        scrapyn: "true",
        autosourcing: "true",
      }),
    },
    "naver_cafe_publish",
    "publish",
    fetchImpl,
  );
  const message = response.message as Record<string, unknown> | undefined;
  const result = message?.result as Record<string, unknown> | undefined;
  const publicUrl = String(result?.articleUrl || response.articleUrl || "");
  const remoteId = String(result?.articleId || response.articleId || "");
  if (!publicUrl || !remoteId) throw new SocialProviderError("naver_cafe_publication_missing", "publish");
  return { platform: "naver_cafe", remoteId, publicUrl };
}
