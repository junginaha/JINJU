import * as Sentry from "@sentry/nextjs";
import { after } from "next/server";
import { enqueueAutoCommentJob, processAutoCommentJob } from "../../../lib/auto-comment-jobs";
import { newPostInitialLikes } from "../../../lib/community-settings";
import { canAutoPublish, reviewSubmission } from "../../../lib/ai-review";
import { builtInPosts } from "../../../lib/built-in-content";
import { normalizePublicCategory, PUBLIC_CATEGORIES } from "../../../lib/categories";
import { db, databaseEnabled, ensureSchema, token } from "../../../lib/db";
import { isDuplicatePost } from "../../../lib/dedup";
import { generateUniqueJinjuDisplayName } from "../../../lib/display-name";
import { getPublicPosts } from "../../../lib/public-posts";
import { rateLimit } from "../../../lib/rate-limit";
import { notifySearchIndexes } from "../../../lib/search-indexing";
import { verifyReviewToken } from "../../../lib/review-token";
import { hasPii } from "../../../lib/safety";
import { generateCoreTitle } from "../../../lib/title";
import { assessPostQuality, POST_MIN_CONTENT_LENGTH } from "../../../lib/post-quality";

export const dynamic = "force-dynamic";

async function verifyPublicDatabase() {
  if (!databaseEnabled()) throw new Error("DATABASE_URL is not configured");
  await ensureSchema();
  const sql = db();
  await sql`
    SELECT
      EXISTS(SELECT 1 FROM posts LIMIT 1) AS posts_readable,
      EXISTS(SELECT 1 FROM comments LIMIT 1) AS comments_readable,
      EXISTS(SELECT 1 FROM admin_content_overrides LIMIT 1) AS overrides_readable`;
}

export async function GET(request: Request) {
  try {
    await verifyPublicDatabase();
  } catch (error) {
    Sentry.captureException(error, { tags: { area: "public-feed", service: "database" } });
    console.error("[posts] public database unavailable", error);
    return Response.json({
      error: "일부 최신 의견을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      posts: [],
      total: 0,
      database: false,
      fallback: true,
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  const url = new URL(request.url);
  const requestedCategory = url.searchParams.get("category")?.trim() || "전체";
  const category = requestedCategory === "전체" ? "전체" : normalizePublicCategory(requestedCategory);
  const query = url.searchParams.get("q")?.trim().toLocaleLowerCase("ko-KR") || "";
  const sort = url.searchParams.get("sort") === "popular" ? "popular" : "latest";
  let posts = await getPublicPosts();
  if (category !== "전체") posts = posts.filter((post) => post.category === category);
  if (query) posts = posts.filter((post) => `${post.title} ${post.content} ${post.category}`.toLocaleLowerCase("ko-KR").includes(query));
  posts = [...posts].sort((a, b) => sort === "popular"
    ? (b.heard + b.same + b.commentCount * 3) - (a.heard + a.same + a.commentCount * 3)
    : Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return Response.json({ posts: posts.slice(0, 100), total: posts.length, database: true, fallback: false }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const limit = await rateLimit(request, "post", 6, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "짧은 시간에 등록 요청이 많았습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const payload = await request.json() as { title?: string; titleGenerated?: boolean; content?: string; category?: string; reviewToken?: string };
  const content = payload.content?.trim() ?? "";
  const submittedTitle = payload.title?.trim() ?? "";
  const qualityTitle = payload.titleGenerated ? "" : submittedTitle;
  const title = (submittedTitle || generateCoreTitle(content)).slice(0, 80);
  const category = normalizePublicCategory(payload.category?.trim() || "일상");
  if (!PUBLIC_CATEGORIES.includes(category) || title.length < 2 || content.length < POST_MIN_CONTENT_LENGTH || content.length > 2000) {
    return Response.json({ error: `제목을 확인하고 상황과 느낀 점을 ${POST_MIN_CONTENT_LENGTH}자 이상 적어주세요.` }, { status: 400 });
  }
  const quality = assessPostQuality(qualityTitle, content);
  const verifiedReview = await verifyReviewToken(payload.reviewToken || "", title, content, category);
  const review = !quality.passed || hasPii(`${title} ${content}`)
    ? await reviewSubmission(qualityTitle, content, "post")
    : verifiedReview || await reviewSubmission(qualityTitle, content, "post");
  if (review.containsPii || hasPii(`${title} ${content}`)) {
    return Response.json({
      error: "개인정보는 보류 상태로도 저장할 수 없습니다. 이름·연락처·주소·계정 정보를 지워주세요.",
      status: "revision_required",
      review,
    }, { status: 422 });
  }
  if (review.decision === "revise" || !quality.passed) {
    return Response.json({ error: "이 문장만 조금 바꾸면 올릴 수 있어요.", status: "revision_required", review }, { status: 422 });
  }
  await ensureSchema();
  const existingRows = await db()`SELECT title, content FROM posts WHERE status IN ('approved','pending','preparing') ORDER BY created_at DESC LIMIT 500`;
  const existingPosts = [
    ...builtInPosts,
    ...existingRows.map((row: Record<string, unknown>) => ({ title: String(row.title), content: String(row.content) })),
  ];
  if (existingPosts.some((post) => isDuplicatePost({ title, content }, post))) {
    return Response.json({ error: "이미 같은 제목이 있거나 본문이 90% 이상 비슷한 의견입니다. 기존 글에 댓글로 참여해주세요." }, { status: 409 });
  }
  const id = token(10);
  const displayName = await generateUniqueJinjuDisplayName(async (candidate) => {
    const rows = await db()`
      SELECT 1 FROM posts WHERE display_name = ${candidate}
      UNION ALL
      SELECT 1 FROM comments WHERE display_name = ${candidate}
      LIMIT 1`;
    return Boolean(rows[0]);
  });
  const status = canAutoPublish(review) ? "approved" : "pending";
  const initialLikes = newPostInitialLikes();
  await db()`
    INSERT INTO posts (
      id, title, content, category, display_name, status, risk_level,
      review_issues, review_explanation, review_source, heard
    ) VALUES (
      ${id}, ${title}, ${content}, ${category}, ${displayName}, ${status}, ${review.riskLevel},
      ${review.detectedIssues.join(" · ")}, ${review.explanation}, ${review.source}, ${initialLikes}
    )`;
  if (status === "approved") {
    const queued = await enqueueAutoCommentJob(id).then(() => true).catch(() => false);
    after(async () => {
      await Promise.allSettled([
        queued ? processAutoCommentJob(id) : Promise.resolve(),
        notifySearchIndexes(["/", `/post/${encodeURIComponent(id)}`]),
      ]);
    });
  }
  return Response.json({ id, displayName, status, review }, {
    status: status === "approved" ? 201 : 202,
    headers: { "cache-control": "no-store" },
  });
}
