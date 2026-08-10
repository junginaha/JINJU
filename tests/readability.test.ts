import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const globalCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const hotfixCss = readFileSync(new URL("../app/production-hotfix.css", import.meta.url), "utf8");

test("feed and detail copy use the targeted readability scale", () => {
  assert.match(globalCss, /\.feed-post \.post-main-link > p \{[^}]*font-size: 14px; line-height: 1\.75;[^}]*word-break: keep-all;/);
  assert.match(globalCss, /\.detail-post > p \{[^}]*font-size: 16px; line-height: 1\.82;/);
  assert.match(globalCss, /\.post-meta \{[^}]*font-size: 12px;/);
  assert.match(globalCss, /\.comment-list article > div \{[^}]*font-size: 12px;/);
  assert.match(globalCss, /\.temperature-copy \{[^}]*font-size: 10px;/);
});

test("mobile text grows without changing the compact five-column action layout", () => {
  assert.match(globalCss, /\.post-actions, \.detail-stats \{[^}]*grid-template-columns: repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(globalCss, /  \.feed-post h2 \{ font-size: clamp\(18px,4\.8vw,20px\); line-height: 1\.45;/);
  assert.match(globalCss, /  \.feed-post \.post-main-link > p \{[^}]*font-size: clamp\(14px,3\.8vw,15px\); line-height: 1\.78;/);
  assert.match(globalCss, /  \.post-actions button,[^}]*min-height: 44px;[^}]*font-size: 9\.5px;/);
  assert.match(globalCss, /  \.mobile-channel-strip button \{[^}]*padding: 9px 12px;[^}]*font-size: 11px;/);
});

test("the title field remains larger while other mobile inputs avoid iOS zoom", () => {
  assert.match(hotfixCss, /\.chat-search input,[\s\S]*?\.composer-selects select \{\s*font-size: 16px;\s*\}/);
  assert.doesNotMatch(hotfixCss, /\.chat-search input,\s*\.chat-title,/);
  assert.match(hotfixCss, /\.chat-title \{\s*font-size: 18px;\s*\}/);
});
