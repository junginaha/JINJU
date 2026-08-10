import type { EditorialPost } from "@/lib/editorial";
import { PUBLIC_CATEGORIES } from "@/lib/categories";
import { formatPublicPostDate } from "@/lib/date-format";

function excerpt(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length > 160 ? `${normalized.slice(0, 160).trimEnd()}…` : normalized;
}

export default function PostArchive({
  posts,
  title,
  eyebrow,
  page = 1,
  totalPages = 1,
  totalPosts,
  currentCategory,
}: {
  posts: EditorialPost[];
  title: string;
  eyebrow: string;
  page?: number;
  totalPages?: number;
  totalPosts: number;
  currentCategory?: string;
}) {
  return (
    <main className="archive-page">
      <header className="archive-header">
        <a href="/" aria-label="진주.kr 메인으로">← 진주.kr</a>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{totalPosts}개의 공개 의견{totalPages > 1 ? ` · ${page}/${totalPages}쪽` : ""}</span>
      </header>

      <nav className="archive-categories" aria-label="카테고리별 의견">
        <a className={!currentCategory ? "active" : ""} href="/">전체</a>
        {PUBLIC_CATEGORIES.map((category) => (
          <a
            key={category}
            className={currentCategory === category ? "active" : ""}
            href={`/category/${encodeURIComponent(category)}`}
          >
            {category}
          </a>
        ))}
      </nav>

      <section className="archive-list" aria-label={title}>
        {posts.map((post) => (
          <article key={post.id}>
            <div><span>{post.category}{post.displayName ? ` · ${post.displayName}` : ""}</span><time dateTime={post.createdAt}>{formatPublicPostDate(post.createdAt)}</time></div>
            <h2><a href={`/post/${encodeURIComponent(post.id)}`}>{post.title}</a></h2>
            <p>{excerpt(post.content)}</p>
          </article>
        ))}
      </section>

      {totalPages > 1 && (
        <nav className="archive-pagination" aria-label="의견 목록 페이지">
          {page > 1 && <a rel="prev" href={page === 2 ? "/" : `/page/${page - 1}`}>← 이전</a>}
          <span>{page} / {totalPages}</span>
          {page < totalPages && <a rel="next" href={`/page/${page + 1}`}>다음 →</a>}
        </nav>
      )}
    </main>
  );
}
