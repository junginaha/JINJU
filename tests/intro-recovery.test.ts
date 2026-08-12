import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../components/JinjuApp.tsx", import.meta.url), "utf8");
const bridgeSource = readFileSync(new URL("../components/JinjuAppBridge.tsx", import.meta.url), "utf8");
const globalCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const hotfixCss = readFileSync(new URL("../app/production-hotfix.css", import.meta.url), "utf8");

test("the server-rendered feed is never covered by a hydration bootstrap screen", () => {
  assert.match(appSource, /useState\(false\);/);
  assert.match(appSource, /introReady && showIntro \? <Intro/);
  assert.doesNotMatch(appSource, /intro-bootstrap/);
  assert.doesNotMatch(bridgeSource, /intro-bootstrap/);
  assert.doesNotMatch(globalCss, /intro-bootstrap/);
  assert.doesNotMatch(hotfixCss, /intro-bootstrap/);
});

test("the hydrated intro has a CSS escape hatch if its timer stops", () => {
  assert.match(hotfixCss, /\.jinju-intro[\s\S]*animation: intro-overlay-safety 4s step-end forwards/);
  assert.match(hotfixCss, /\.jinju-intro\.is-closing \{ animation: none; \}/);
  assert.match(hotfixCss, /@keyframes intro-overlay-safety[\s\S]*pointer-events: none/);
});
