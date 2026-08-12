import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bridgeSource = readFileSync(new URL("../components/JinjuAppBridge.tsx", import.meta.url), "utf8");
const globalCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("the presentation observer does not retrigger itself by rewriting unchanged feed text", () => {
  assert.match(bridgeSource, /title\.textContent !== FEED_ACCESSIBLE_NAME/);
  assert.doesNotMatch(bridgeSource, /if \(title\) \{\s*title\.textContent = FEED_ACCESSIBLE_NAME;/);
  assert.match(bridgeSource, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
});

test("the mobile document canvas remains dark for a short or temporarily empty feed", () => {
  assert.match(globalCss, /html \{[^}]*min-height: 100%;[^}]*background: var\(--paper\);/);
  assert.match(globalCss, /body \{[^}]*min-height: 100vh;\s*min-height: 100dvh;/);
  assert.match(globalCss, /\.chat-app, \.chat-main, \.detail-page \{[^}]*min-height: 100vh; min-height: 100dvh;/);
});
