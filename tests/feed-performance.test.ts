import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../components/JinjuApp.tsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const publicPostsSource = readFileSync(new URL("../lib/public-posts.ts", import.meta.url), "utf8");
const postsRouteSource = readFileSync(new URL("../app/api/posts/route.ts", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("../lib/db.ts", import.meta.url), "utf8");

test("server-rendered home posts are reconciled with the uncached public feed", () => {
  assert.match(pageSource, /publicPosts\.slice\(0, 30\)\.map\(toClientPost\)/);
  assert.match(pageSource, /initialTotal=\{publicPosts\.length\}/);
  assert.match(appSource, /initialPostId === null && initialTotal !== undefined \? "ready" : "loading"/);
  assert.doesNotMatch(appSource, /skipInitialFeedRequestRef/);
  assert.match(appSource, /if\(selectedPostId\)\{feedAbortRef\.current\?\.abort\(\);return\}\s*feedAbortRef\.current\?\.abort\(\);\s*const timer=window\.setTimeout\(\(\)=>void loadPosts\(0,false\),query\.trim\(\)\?220:0\)/);
});

test("superseded feed requests are aborted while normal feed controls stay intact", () => {
  assert.match(appSource, /feedAbortRef=useRef<AbortController\|null>\(null\)/);
  assert.match(appSource, /feedAbortRef\.current\?\.abort\(\);\s*const controller=new AbortController\(\)/);
  assert.match(appSource, /fetch\(`\/api\/posts\?\$\{params\.toString\(\)\}`,\{cache:"no-store",signal:controller\.signal\}\)/);
  assert.match(appSource, /if\(controller\.signal\.aborted\)return;/);
  assert.match(appSource, /useEffect\(\(\)=>\(\)=>feedAbortRef\.current\?\.abort\(\),\[\]\)/);
  assert.match(appSource, /feedAbortRef\.current\?\.abort\(\);\s*const timer=window\.setTimeout/);
  assert.match(appSource, /void loadPosts\(feedNextOffset,true\)/);
  assert.match(appSource, /query\.trim\(\)\?220:0/);
});

test("independent public-feed database reads start together without changing fallback handling", () => {
  assert.match(publicPostsSource, /const overridesPromise = safeContentOverrides\(\)/);
  assert.match(publicPostsSource, /await ensureSchema\(\);\s*const rowsPromise = db\(\)`/);
  assert.match(publicPostsSource, /Promise\.all\(\[overridesPromise, rowsPromise\]\)/);
  assert.match(postsRouteSource, /const publicPostsPromise = getPublicPosts\(\)/);
  assert.match(postsRouteSource, /await verifyPublicDatabase\(\)/);
  assert.match(postsRouteSource, /fallbackPosts = await publicPostsPromise\.catch\(\(\) => \[\]\)/);
  assert.match(postsRouteSource, /selectPage\(await publicPostsPromise\)/);
});

test("the public feed resumes missed automatic-comment work without blocking its response", () => {
  assert.match(postsRouteSource, /after\(async \(\) => \{/);
  assert.match(postsRouteSource, /await processDueAutoCommentJobs\(3\)/);
  assert.match(postsRouteSource, /continueDueAutoCommentWork\(\)/);
  assert.match(dbSource, /20260818-retry-recent-failed-auto-comments/);
  assert.match(dbSource, /post\.created_at >= NOW\(\) - INTERVAL '2 hours'/);
  assert.match(dbSource, /job\.post_id IS NULL OR job\.status = 'failed'/);
});
