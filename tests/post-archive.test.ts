import assert from "node:assert/strict";
import test from "node:test";
import { archivePosts, archivePageCount, archivePath, ARCHIVE_PAGE_SIZE } from "../lib/post-archive";

test("archive preserves the search delay and excludes future and invalid dates", () => {
  const now = Date.parse("2026-10-22T12:00:00Z");
  const posts = [
    { id: "old", createdAt: "2026-10-20T00:00:00Z" },
    { id: "fresh", createdAt: "2026-10-22T11:59:00Z" },
    { id: "future", createdAt: "2026-10-23T00:00:00Z" },
    { id: "invalid", createdAt: "invalid" },
    { id: "boundary", createdAt: "2026-10-22T00:00:00Z" },
  ];
  assert.deepEqual(archivePosts(posts, now).map(p => p.id), ["boundary", "old"]);
  assert.equal(posts[0].id, "old");
});
test("every eligible post is reachable in finite pages without overlap", () => {
  const posts = Array.from({ length: 654 }, (_, i) => ({ id: `post-${i}`, createdAt: "2026-01-01T00:00:00Z" }));
  const eligible = archivePosts(posts, Date.parse("2026-10-22T12:00:00Z"));
  const pages = Array.from({ length: archivePageCount(eligible.length) }, (_, i) => eligible.slice(i * ARCHIVE_PAGE_SIZE, (i + 1) * ARCHIVE_PAGE_SIZE));
  assert.equal(pages.length, 22);
  assert.equal(new Set(pages.flat().map(p => p.id)).size, 654);
  assert.equal(archivePath(1), "/archive");
  assert.equal(archivePath(2), "/archive/2");
  assert.equal(archivePageCount(0), 1);
});
