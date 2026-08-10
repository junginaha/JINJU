import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../components/JinjuApp.tsx", import.meta.url), "utf8");
const globalCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const policySource = readFileSync(new URL("../components/PolicyPage.tsx", import.meta.url), "utf8");

test("main and sidebar brand links always target the site root", () => {
  assert.equal((appSource.match(/href="\/" aria-label="진주\.kr 메인으로"/g) ?? []).length, 1);
  assert.equal((appSource.match(/href="\/" className="sidebar-brand" aria-label="진주\.kr 메인으로"/g) ?? []).length, 1);
  assert.doesNotMatch(appSource, /href="#feed"[^>]*aria-label="진주 홈"/);
});

test("detail and policy navigation expose a direct home link", () => {
  assert.match(appSource, /className="detail-home" href="\/"/);
  assert.match(appSource, />← 진주\.kr<\/a>/);
  assert.match(policySource, /href="\/" aria-label="진주\.kr 메인으로">← 진주\.kr<\/a>/);
});

test("the privacy badge sits outside the search form without changing search controls", () => {
  assert.match(appSource, /<div className="chat-search-shell">\s*<span className="search-privacy-badge" id="search-privacy-note">개인정보 0%<\/span>\s*<form className="chat-search"/);
  assert.doesNotMatch(appSource, /<form className="chat-search"[^>]*>\s*<span className="search-privacy-badge"/);
  assert.match(appSource, /aria-describedby="search-privacy-note search-voice-status"/);
  assert.match(appSource, /search-voice-button/);
  assert.match(appSource, /className="search-send" type="submit" aria-label="검색"/);
  assert.match(globalCss, /\.chat-search-shell \{ position: sticky;[^}]*padding-top: 11px;/);
  assert.match(globalCss, /\.search-privacy-badge \{ position: absolute;[^}]*top: 0; left: 16px;[^}]*pointer-events: none;/);
});
