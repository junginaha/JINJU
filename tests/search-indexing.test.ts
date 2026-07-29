import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  canonicalUrl,
  INDEXNOW_KEY,
  notifySearchIndexes,
  SITE_HOST,
} from "../lib/search-indexing";

test("canonical search URLs always use the single production host", () => {
  assert.equal(canonicalUrl(), `https://${SITE_HOST}/`);
  assert.equal(canonicalUrl("post/example"), `https://${SITE_HOST}/post/example`);
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
