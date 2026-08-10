import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

const temperatureSource = readFileSync(new URL("../components/PostTemperature.tsx", import.meta.url), "utf8");

test("optimized pearl assets stay small enough for repeated UI use", () => {
  assert.ok(statSync("public/jinju-pearl-ui.webp").size < 10_000);
  assert.ok(statSync("public/jinju-pearl-intro.webp").size < 20_000);
});

test("the reaction control exposes keyboard slider semantics", () => {
  assert.match(temperatureSource, /role=\{interactive \? "slider" : "img"\}/);
  assert.match(temperatureSource, /onKeyDown=\{moveWithKeyboard\}/);
  assert.match(temperatureSource, /aria-valuetext=/);
});
