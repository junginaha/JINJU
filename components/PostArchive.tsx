import { notFound } from "next/navigation";
import PolicyPage from "./PolicyPage";
import { getPublicPosts } from "@/lib/public-posts";
import { ARCHIVE_PAGE_SIZE, archivePageCount, archivePath, archivePosts } from "@/lib/post-archive";
import { canonicalUrl, SITE_WEBSITE_ID } from "@/lib/search-indexing";

export default async function PostArchive({ page }: { page: number }) {
  const posts = archivePosts(await getPublicPosts());
  const pages = archivePageCount(posts.length);
  if (!Number.isSafeInteger(page) || page < 1 || page > pages) notFound();
  const offset = (page - 1) * ARCHIVE_PAGE_SIZE;
  const visible = posts.slice(offset, offset + ARCHIVE_PAGE_SIZE);
  const structured = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonicalUrl(archivePath(page)),
    url: canonicalUrl(archivePath(page)),
    name: `진주.kr 전체 글 · ${page}페이지`,
    inLanguage: "ko-KR",
    isPartOf: { "@id": SITE_WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: visible.map((post, index) => ({
        "@type": "ListItem", position: offset + index + 1,
        name: post.title, url: canonicalUrl(`/post/${encodeURIComponent(post.id)}`),
      })),
    },
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }} />
    <PolicyPage eyebrow="JINJU.KR · ARCHIVE" title="진주.kr 전체 글">
      <p>일상, 관계, 마음, 책에 관한 공개 의견을 최신순으로 모았어요. 새 글은 검색 공개 유예 시간이 지난 뒤 이 목록에 표시됩니다.</p>
      <p>{page} / {pages}페이지</p>
      {visible.map((post) => <section key={post.id}>
        <h2><a href={`/post/${encodeURIComponent(post.id)}`}>{post.title}</a></h2>
        <p>{post.content}</p>
        <p>{post.category} · <time dateTime={post.createdAt}>{new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long" }).format(new Date(post.createdAt))}</time></p>
      </section>)}
      <nav aria-label="전체 글 페이지">
        {page > 1 && <a href={archivePath(page - 1)} rel="prev">← 이전 페이지</a>}
        {page > 1 && page < pages && " · "}
        {page < pages && <a href={archivePath(page + 1)} rel="next">다음 페이지 →</a>}
      </nav>
    </PolicyPage>
  </>;
}
