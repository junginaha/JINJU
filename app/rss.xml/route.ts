import { getPublicPosts } from "@/lib/public-posts";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = (await getPublicPosts()).slice(0, 50);
  const items = posts.map((post) => {
    const url = `https://xn--o55b9n.kr/post/${encodeURIComponent(post.id)}`;
    return `<item><title>${escapeXml(post.title)}</title><link>${url}</link><guid>${url}</guid><description>${escapeXml(post.content)}</description><pubDate>${new Date(post.createdAt).toUTCString()}</pubDate></item>`;
  }).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>진주.kr — 익명 의견 커뮤니티</title><link>https://xn--o55b9n.kr/</link><description>개인정보 없이 인간적으로 할 말을 하는 익명 의견 커뮤니티입니다.</description><language>ko-KR</language>${items}</channel></rss>`;
  return new Response(body, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=300" } });
}
