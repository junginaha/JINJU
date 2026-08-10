import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../components/JinjuApp.tsx", import.meta.url), "utf8");
const bridgeSource = readFileSync(new URL("../components/JinjuAppBridge.tsx", import.meta.url), "utf8");
const introSource = readFileSync(new URL("../components/Intro.tsx", import.meta.url), "utf8");
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

test("the first screen exposes the requested three-line identity without hiding its heading", () => {
  for (const source of [appSource, introSource]) {
    assert.match(source, /진주\.kr/);
    assert.match(source, /전국 누구나 쓰는 독립 익명 의견 커뮤니티/);
    assert.match(source, /개인정보 없이, 할 말은 하세요/);
  }
  assert.doesNotMatch(bridgeSource, /title\.hidden\s*=\s*true/);
});

test("feed links expose crawlable archives and categories", () => {
  assert.match(appSource, /`\/page\/\$\{Math\.floor\(feedNextOffset \/ FEED_PAGE_SIZE\) \+ 1\}`/);
  assert.match(appSource, /`\/category\/\$\{encodeURIComponent\(item\)\}`/);
});
