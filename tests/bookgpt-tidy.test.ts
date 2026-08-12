import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/bookgpt-tidy.css", import.meta.url), "utf8");

test("the visual pass loads after production stability rules", () => {
  const stabilityImport = layout.indexOf('import "./production-hotfix.css";');
  const tidyImport = layout.indexOf('import "./bookgpt-tidy.css";');

  assert.ok(stabilityImport >= 0);
  assert.ok(tidyImport > stabilityImport);
});

test("feed, detail, and writing views share one reading measure", () => {
  assert.match(css, /--jinju-reading-width:\s*760px/);
  assert.match(css, /\.feed-shell[\s\S]*var\(--jinju-reading-width\)/);
  assert.match(css, /\.detail-shell[\s\S]*var\(--jinju-reading-width\)/);
  assert.match(css, /\.composer-screen-shell[\s\S]*var\(--jinju-reading-width\)/);
});

test("mobile controls preserve readable and touchable sizing", () => {
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /\.chat-search[\s\S]*min-height:\s*58px/);
  assert.match(css, /\.post-actions > button[\s\S]*min-height:\s*46px/);
  assert.match(css, /padding-right:\s*max\(14px, env\(safe-area-inset-right\)\)/);
});
