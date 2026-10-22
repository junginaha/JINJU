import { isSearchIndexable } from "./search-indexing";

export const ARCHIVE_PAGE_SIZE = 30;
export function archivePath(page: number) {
  return page === 1 ? "/archive" : `/archive/${page}`;
}
export function archivePosts<T extends { createdAt: string; id: string }>(posts: T[], now = Date.now()) {
  return posts.filter((post) => isSearchIndexable(post.createdAt, now))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
}
export function archivePageCount(total: number) {
  return Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
}
