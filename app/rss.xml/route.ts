import { getPublicPosts } from "@/lib/public-posts";
import { canonicalUrl } from "@/lib/search-indexing";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = (await getPublicPosts()).slice(0, 50);
  const items = posts.map((post) => {
    const url = canonicalUrl(`/post/${encodeURIComponent(post.id)}`);
    return `<item><title>${escapeXml(post.title)}</title><link>${url}</link><guid>${url}</guid><description>${escapeXml(post.content)}</description><pubDate>${new Date(post.createdAt).toUTCString()}</pubDate></item>`;
  }).join("");
  const latestBuildDate = posts[0] ? new Date(posts[0].updatedAt || posts[0].createdAt).toUTCString() : new Date(0).toUTCString();
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>진주.kr — 전국 독립 익명 의견 커뮤니티</title><link>${canonicalUrl("/")}</link><atom:link href="${canonicalUrl("/rss.xml")}" rel="self" type="application/rss+xml"/><description>전국 누구나 쓰는 독립 익명 의견 커뮤니티. 개인정보 없이, 할 말은 하세요.</description><language>ko-KR</language><lastBuildDate>${latestBuildDate}</lastBuildDate>${items}</channel></rss>`;
  return new Response(body, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=300" } });
}
