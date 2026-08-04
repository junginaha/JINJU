import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  canonicalUrl,
  INDEXNOW_KEY,
  SITE_IDENTITY_DESCRIPTION,
  notifySearchIndexes,
  SITE_HOST,
  SITE_NAME,
  SITE_TITLE,
} from "../lib/search-indexing";
import robotsRoute from "../app/robots";

test("canonical search URLs always use the single production host", () => {
  assert.equal(canonicalUrl(), `https://${SITE_HOST}/`);
  assert.equal(canonicalUrl("post/example"), `https://${SITE_HOST}/post/example`);
});

test("the shared identity names the domain and distinguishes the independent service", () => {
  assert.match(SITE_TITLE, new RegExp(SITE_NAME.replace(".", "\\.")));
  assert.match(SITE_TITLE, /진실의 주둥이/);
  assert.match(SITE_IDENTITY_DESCRIPTION, /경상남도 진주시/);
  assert.match(SITE_IDENTITY_DESCRIPTION, /관련 없는 독립 서비스/);
});

test("search and AI answer crawlers can index public pages but not private routes", () => {
  const config = robotsRoute();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const expectedCrawlers = [
    "Yeti",
    "Googlebot",
    "Bingbot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
    "Perplexity-User",
  ];

  for (const crawler of expectedCrawlers) {
    const rule = rules.find((candidate) => candidate.userAgent === crawler);
    assert.ok(rule, `${crawler} should have an explicit rule`);
    assert.equal(rule.allow, "/");
    assert.deepEqual(rule.disallow, ["/api/", "/admin"]);
  }
});

test("the public IndexNow ownership file matches the submitted key", async () => {
  const publicKey = await readFile(`public/${INDEXNOW_KEY}.txt`, "utf8");
  assert.equal(publicKey.trim(), INDEXNOW_KEY);
});

test("IndexNow submissions deduplicate URLs and never block publishing", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  let submittedBody = "";
  globalThis.fetch = (async (_input, init) => {
    submittedBody = String(init?.body || "");
    return new Response(null, { status: 202 });
  }) as typeof fetch;

  try {
    await notifySearchIndexes(["/", "/", "/post/example"]);
    const submission = JSON.parse(submittedBody) as { host: string; urlList: string[] };
    assert.equal(submission.host, SITE_HOST);
    assert.deepEqual(submission.urlList, [
      `https://${SITE_HOST}/`,
      `https://${SITE_HOST}/post/example`,
    ]);

    globalThis.fetch = (async () => {
      throw new Error("temporary search-engine failure");
    }) as typeof fetch;
    console.warn = () => undefined;
    await assert.doesNotReject(() => notifySearchIndexes(["/post/example"]));
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});
