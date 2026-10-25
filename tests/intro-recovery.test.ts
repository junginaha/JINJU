import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../components/JinjuApp.tsx", import.meta.url), "utf8");
const introSource = readFileSync(new URL("../components/Intro.tsx", import.meta.url), "utf8");
const bridgeSource = readFileSync(new URL("../components/JinjuAppBridge.tsx", import.meta.url), "utf8");
const globalCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const hotfixCss = readFileSync(new URL("../app/production-hotfix.css", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("first visit paints the intro before the feed; returning visitors never see it flash", () => {
  // 2026-10-26: the feed used to paint first and the intro appeared on top of it a moment later.
  assert.match(appSource, /const \[showIntro, setShowIntro\] = useState\(true\);/);
  assert.match(appSource, /\{showIntro \? <Intro/);
  assert.match(layoutSource, /INTRO_SEEN_SCRIPT/);
  assert.match(hotfixCss, /\.jinju-intro-seen \.jinju-intro \{ display: none; \}/);
});

test("no separate hydration bootstrap screen covers the server-rendered feed", () => {
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


test("the approved minimal intro keeps the Jin and Ju motion without extra copy", () => {
  assert.match(introSource, /className="intro-key intro-key-truth">진/);
  assert.match(introSource, /className="intro-key intro-key-mouth">주/);
  assert.doesNotMatch(introSource, /intro-key[^>]*animation:\s*"none"/);
  assert.doesNotMatch(introSource, /ANONYMOUS COMMUNITY/);
  assert.doesNotMatch(introSource, /안전하고 개운하게/);
  assert.match(introSource, /intro-skip-arrow/);
  assert.match(introSource, /onClick=\{finish\}/);
});
