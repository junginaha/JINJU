import assert from "node:assert/strict";
import test from "node:test";
import { formatPublicPostDate } from "../lib/date-format";

test("public post dates use the Seoul calendar day", () => {
  const formatted = formatPublicPostDate("2026-08-09T15:30:00.000Z");
  assert.match(formatted, /2026/);
  assert.match(formatted, /8/);
  assert.match(formatted, /10/);
  assert.doesNotMatch(formatted, /8\.\s*9/);
});
