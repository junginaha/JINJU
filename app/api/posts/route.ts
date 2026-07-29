import { after } from "next/server";
import { enqueueAutoCommentJob, processAutoCommentJob } from "../../../lib/auto-comment-jobs";
import { newPostInitialLikes } from "../../../lib/community-settings";
import { reviewSubmission } from "../../../lib/ai-review";
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

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
  return Response.json({ posts: posts.slice(0, 100), total: posts.length, database: databaseEnabled() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const limit = await rateLimit(request, "post", 6, 10 * 60_000);
  if (!limit.allowed) return Response.json({ error: "짧은 시간에 등록 요청이 많았습니다. 잠시 후 다시 시도해주세요." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!databaseEnabled()) return Response.json({ error: "정식 저장소 연결이 필요합니다." }, { status: 503 });
  const payload = await request.json() as { title?: string; content?: string; category?: string; acceptReviewHold?: boolean; reviewToken?: string };
  const content = payload.content?.trim() ?? "";
  const title = (payload.title?.trim() || generateCoreTitle(content)).slice(0, 80);
  const category = normalizePublicCategory(payload.category?.trim() || "일상");
  if (!PUBLIC_CATEGORIES.includes(category) || title.length < 2 || content.length < 8 || content.length > 2000 || hasPii(`${title} ${content}`)) {
    return Response.json({ error: "개인정보를 제거하고 제목 2~80자, 본문 8~2,000자로 작성해주세요." }, { status: 400 });
  }
  const review = await verifyReviewToken(payload.reviewToken || "", title, content, category)
    || await reviewSubmission(title, content);
  if (review.containsPii) {
    return Response.json({
      error: "개인정보는 보류 상태로도 저장할 수 없습니다. 이름·연락처·주소·계정 정보를 지워주세요.",
      status: "revision_required",
      review,
    }, { status: 422 });
  }
  if (review.decision === "revise" && !payload.acceptReviewHold) {
    return Response.json({ status: "revision_required", review }, { status: 422 });
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
  const status = review.decision === "allow" ? "approved" : "pending";
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
