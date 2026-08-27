import { db, databaseEnabled, ensureSchema } from "./db";
import { hasPii, reviewText } from "./safety";
import { buildSocialCopy } from "./social-copy";
import {
  configuredSocialPlatforms,
  publishInstagram,
  publishNaverCafe,
  publishThreads,
  SocialProviderError,
  type DirectSocialPlatform,
  type ProviderPublication,
  type SocialPlatform,
} from "./social-providers";
import { getPublicPosts } from "./public-posts";
import type { EditorialPost } from "./editorial";

const MIN_POST_AGE_MS = 30 * 60_000;
const MAX_POST_AGE_MS = 48 * 60 * 60_000;
const RETRY_DELAY_MS = 20 * 60_000;
const SAFE_CATEGORIES = new Set(["일상", "관계", "직장", "돈", "질문", "제안"]);

type PublicationRow = {
  postId: string;
  platform: SocialPlatform;
  status: string;
  attempts: number;
  updatedAt: number;
};

export type YoutubeClaimResult = {
  ok: boolean;
  status: "disabled" | "not_configured" | "no_candidate" | "claimed";
  job?: {
    postId: string;
    title: string;
    description: string;
    script: string;
    imageUrl: string;
  };
};

export type SocialRunResult = {
  ok: boolean;
  status: "disabled" | "not_configured" | "no_candidate" | "completed";
  postId?: string;
  title?: string;
  publications?: Array<{
    platform: SocialPlatform;
    status: "published" | "failed" | "unknown" | "skipped";
    publicUrl?: string;
    error?: string;
  }>;
};

function isSafeCandidate(post: EditorialPost, now: number) {
  const createdAt = Date.parse(post.createdAt);
  if (!Number.isFinite(createdAt)) return false;
  const age = now - createdAt;
  if (age < MIN_POST_AGE_MS || age > MAX_POST_AGE_MS) return false;
  if (!SAFE_CATEGORIES.has(post.category)) return false;
  const text = `${post.title}\n${post.content}`;
  const review = reviewText(text);
  return review.riskLevel === "low" && !hasPii(text);
}

function engagementScore(post: EditorialPost, now: number) {
  const ageHours = Math.max(0, (now - Date.parse(post.createdAt)) / 3_600_000);
  const freshness = Math.max(0, 36 - ageHours) * 2;
  return post.commentCount * 5 + post.heard + post.same + freshness;
}

function retryable(row: PublicationRow | undefined, now: number) {
  if (!row) return true;
  if (["published", "unknown", "running"].includes(row.status)) return false;
  return row.status === "failed" && row.attempts < 3 && now - row.updatedAt >= RETRY_DELAY_MS;
}

async function recentPublicationRows(): Promise<PublicationRow[]> {
  const rows = await db()`
    SELECT post_id, platform, status, attempt_count, updated_at
    FROM social_publications
    WHERE updated_at >= NOW() - INTERVAL '7 days'`;
  return rows.map((row: Record<string, unknown>) => ({
    postId: String(row.post_id),
    platform: String(row.platform) as SocialPlatform,
    status: String(row.status),
    attempts: Number(row.attempt_count || 0),
    updatedAt: Date.parse(String(row.updated_at)),
  }));
}

async function claim(postId: string, platform: SocialPlatform) {
  const rows = await db()`
    INSERT INTO social_publications (
      post_id, platform, status, attempt_count, last_error, created_at, updated_at
    ) VALUES (${postId}, ${platform}, 'running', 1, '', NOW(), NOW())
    ON CONFLICT (post_id, platform) DO UPDATE
    SET status = 'running', attempt_count = social_publications.attempt_count + 1,
        last_error = '', updated_at = NOW()
    WHERE social_publications.status = 'failed'
      AND social_publications.attempt_count < 3
      AND social_publications.updated_at <= NOW() - INTERVAL '20 minutes'
    RETURNING post_id`;
  return rows.length > 0;
}

export async function claimYoutubePublishing(
  preferredPostId = "",
  now = new Date(),
): Promise<YoutubeClaimResult> {
  if (process.env.SOCIAL_PUBLISH_ENABLED !== "true" || process.env.YOUTUBE_PUBLISH_ENABLED !== "true") {
    return { ok: true, status: "disabled" };
  }
  if (!(process.env.OPENAI_API_KEY?.trim() || process.env.AI_API_KEY?.trim()) || !databaseEnabled()) {
    return { ok: false, status: "not_configured" };
  }

  await ensureSchema();
  const nowMs = now.getTime();
  const [posts, existing] = await Promise.all([getPublicPosts(), recentPublicationRows()]);
  const youtubeRows = new Map(
    existing.filter((row) => row.platform === "youtube").map((row) => [row.postId, row]),
  );
  const candidates = posts
    .filter((post) => isSafeCandidate(post, nowMs))
    .filter((post) => retryable(youtubeRows.get(post.id), nowMs))
    .sort((left, right) => {
      if (preferredPostId) {
        if (left.id === preferredPostId) return -1;
        if (right.id === preferredPostId) return 1;
      }
      return engagementScore(right, nowMs) - engagementScore(left, nowMs);
    });
  const post = candidates[0];
  if (!post || !await claim(post.id, "youtube")) return { ok: true, status: "no_candidate" };
  const copy = buildSocialCopy(post, now).youtube;
  return {
    ok: true,
    status: "claimed",
    job: {
      postId: post.id,
      title: copy.title,
      description: copy.description,
      script: copy.script,
      imageUrl: copy.imageUrl,
    },
  };
}

export async function claimedYoutubeJob(postId: string) {
  if (process.env.SOCIAL_PUBLISH_ENABLED !== "true" || process.env.YOUTUBE_PUBLISH_ENABLED !== "true") return null;
  if (!databaseEnabled()) return null;
  await ensureSchema();
  const rows = await db()`
    SELECT post_id FROM social_publications
    WHERE post_id = ${postId} AND platform = 'youtube' AND status = 'running'
    LIMIT 1`;
  if (!rows.length) return null;
  const post = (await getPublicPosts()).find((candidate) => candidate.id === postId);
  if (!post || !isSafeCandidate(post, Date.now())) return null;
  const copy = buildSocialCopy(post).youtube;
  return { postId, ...copy };
}

export async function completeYoutubePublishing(input: {
  postId: string;
  status: "published" | "failed" | "unknown";
  remoteId?: string;
  error?: string;
}) {
  if (!databaseEnabled()) return false;
  await ensureSchema();
  const remoteId = input.remoteId?.trim() || "";
  if (input.status === "published" && !/^[A-Za-z0-9_-]{6,32}$/u.test(remoteId)) return false;
  const publicUrl = input.status === "published" ? `https://www.youtube.com/shorts/${remoteId}` : "";
  const error = (input.error || "").replace(/\s+/gu, " ").trim().slice(0, 240);
  const rows = await db()`
    UPDATE social_publications
    SET status = ${input.status}, remote_id = ${remoteId}, public_url = ${publicUrl},
        last_error = ${error}, published_at = CASE WHEN ${input.status} = 'published' THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE post_id = ${input.postId} AND platform = 'youtube' AND status = 'running'
    RETURNING post_id`;
  return rows.length > 0;
}

async function recordSuccess(postId: string, publication: ProviderPublication) {
  await db()`
    UPDATE social_publications
    SET status = 'published', remote_id = ${publication.remoteId},
        public_url = ${publication.publicUrl}, last_error = '',
        published_at = NOW(), updated_at = NOW()
    WHERE post_id = ${postId} AND platform = ${publication.platform}`;
}

async function recordFailure(postId: string, platform: SocialPlatform, error: unknown) {
  const indeterminate = error instanceof SocialProviderError && error.phase === "publish";
  const status = indeterminate ? "unknown" : "failed";
  const message = error instanceof Error ? error.message : "provider_error";
  await db()`
    UPDATE social_publications
    SET status = ${status}, last_error = ${message.slice(0, 240)}, updated_at = NOW()
    WHERE post_id = ${postId} AND platform = ${platform}`;
  return { status: indeterminate ? "unknown" as const : "failed" as const, error: message.slice(0, 180) };
}

export async function runSocialPublishing(now = new Date()): Promise<SocialRunResult> {
  if (process.env.SOCIAL_PUBLISH_ENABLED !== "true") return { ok: true, status: "disabled" };
  const platforms = configuredSocialPlatforms();
  if (!platforms.length) return { ok: false, status: "not_configured" };
  if (!databaseEnabled()) return { ok: false, status: "not_configured" };

  await ensureSchema();
  const nowMs = now.getTime();
  const [posts, existing] = await Promise.all([getPublicPosts(), recentPublicationRows()]);
  const byKey = new Map(existing.map((row) => [`${row.postId}:${row.platform}`, row]));
  const candidates = posts
    .filter((post) => isSafeCandidate(post, nowMs))
    .map((post) => ({
      post,
      platforms: platforms.filter((platform: DirectSocialPlatform) => retryable(byKey.get(`${post.id}:${platform}`), nowMs)),
    }))
    .filter((candidate) => candidate.platforms.length > 0)
    .sort((left, right) => engagementScore(right.post, nowMs) - engagementScore(left.post, nowMs));
  const candidate = candidates[0];
  if (!candidate) return { ok: true, status: "no_candidate" };

  const copy = buildSocialCopy(candidate.post, now);
  const publications: NonNullable<SocialRunResult["publications"]> = [];
  for (const platform of candidate.platforms) {
    if (!await claim(candidate.post.id, platform)) {
      publications.push({ platform, status: "skipped" });
      continue;
    }
    try {
      const publication = platform === "instagram"
        ? await publishInstagram(copy.instagram)
        : platform === "threads"
          ? await publishThreads(copy.threads)
          : await publishNaverCafe(copy.naverCafe);
      await recordSuccess(candidate.post.id, publication);
      publications.push({ platform, status: "published", publicUrl: publication.publicUrl });
    } catch (error) {
      const failure = await recordFailure(candidate.post.id, platform, error);
      publications.push({ platform, ...failure });
    }
  }

  return {
    ok: publications.every((publication) => ["published", "skipped"].includes(publication.status)),
    status: "completed",
    postId: candidate.post.id,
    title: candidate.post.title,
    publications,
  };
}
