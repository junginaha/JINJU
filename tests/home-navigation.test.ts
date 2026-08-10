import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../components/JinjuApp.tsx", import.meta.url), "utf8");
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
