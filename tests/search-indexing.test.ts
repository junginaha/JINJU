import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  canonicalUrl,
  INDEXNOW_KEY,
  SITE_DEFINITION,
  SITE_DISCLAIMER,
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

test("the shared identity uses the fixed definition and distinguishes the independent service", () => {
  assert.equal(SITE_DEFINITION, "진주(JINJU)는 개인정보 없이 할 말을 하는 익명 커뮤니티입니다.");
  assert.match(SITE_TITLE, new RegExp(SITE_NAME.replace(".", "\\.")));
  assert.match(SITE_TITLE, /진실의 주둥이/);
  assert.equal(SITE_DISCLAIMER, "본 서비스는 경상남도 진주시 및 지방자치단체의 공식 서비스와 무관한 독립 서비스입니다.");
  assert.equal(SITE_IDENTITY_DESCRIPTION, `${SITE_DEFINITION} ${SITE_DISCLAIMER}`);
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

test("llms.txt repeats the official identity and canonical origin", async () => {
  const llms = await readFile("public/llms.txt", "utf8");
  assert.match(llms, new RegExp(SITE_DEFINITION.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(llms, new RegExp(`https://${SITE_HOST}/`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
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
