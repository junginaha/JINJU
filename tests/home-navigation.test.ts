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

test("mobile header stays centered without a duplicate write button", () => {
  const mobileHeader = appSource.match(/<header className="mobile-chat-header">[\s\S]*?<\/header>/)?.[0] ?? "";

  assert.ok(mobileHeader);
  assert.match(mobileHeader, /className="mobile-menu-button"[\s\S]*?aria-label="게시판 메뉴 열기"/);
  assert.match(mobileHeader, /href="\/" aria-label="진주\.kr 메인으로"/);
  assert.doesNotMatch(mobileHeader, /mobile-write-link|>나의 의견<|openComposer/);
  assert.match(appSource, /<button className="floating-write-button" type="button" onClick=\{openComposer\}><span aria-hidden="true">＋<\/span> 의견 쓰기<\/button>/);
  assert.match(globalCss, /\.mobile-chat-header \{[^}]*grid-template-columns: 38px minmax\(0,1fr\) 38px;[^}]*min-height: 56px;/);
  assert.match(globalCss, /\.mobile-chat-header > a:nth-of-type\(1\) \{[^}]*justify-self: center;/);
  assert.match(globalCss, /\.floating-write-button \{[^}]*display: inline-flex;[^}]*min-height: 52px;/);
  assert.doesNotMatch(globalCss, /\.mobile-write-link/);
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

test("mobile content begins directly below the header without changing desktop spacing", () => {
  assert.match(globalCss, /\.feed-shell \{ width: min\(100%,820px\);[^}]*padding: 68px 24px 130px;/);
  assert.match(globalCss, /  \.feed-shell \{ width: 100%; max-width: 100%; padding: 10px max\(15px,env\(safe-area-inset-right\)\) 150px max\(15px,env\(safe-area-inset-left\)\); overflow-x: clip; \}/);
  assert.match(globalCss, /  \.feed-heading \{ position: absolute; width: 1px; height: 1px;[^}]*clip-path: inset\(50%\); \}/);
  assert.match(globalCss, /  \.chat-search-shell \{ top: 66px; padding-top: 10px; \}/);
});
