import assert from "node:assert/strict";
import test from "node:test";
import { dialogueExamples20261117, dialogueExamplesFor } from "../lib/dialogue-examples-20261117";
import { november17EditorialPosts } from "../lib/daily-editorial-20261117";
import { builtInComments, builtInPost } from "../lib/built-in-content";
import { visibleBuiltInComments } from "../lib/public-posts";
import { withLikeBoost } from "../lib/like-boost";
import { hasPii, reviewText } from "../lib/safety";

test("Each launch discussion has ten clearly identified examples, consistent in feed and detail", () => {
  assert.equal(dialogueExamples20261117.length, 30);
  assert.equal(new Set(dialogueExamples20261117.map(c=>c.id)).size,30);
  assert.equal(new Set(dialogueExamples20261117.map(c=>c.body)).size,30);
  for (const post of november17EditorialPosts) {
    const actual=builtInPost(post.id)!;
    assert.ok(actual);
    assert.equal(dialogueExamplesFor(post.id).length,10);
    assert.equal(builtInComments(post.id).length,10);
    assert.equal(visibleBuiltInComments(actual).length,10);
    assert.equal(withLikeBoost(actual).heard,0);
    for (const comment of dialogueExamplesFor(post.id)) {
      assert.ok(comment.body.startsWith("대화 예시 · "));
      assert.ok(Date.parse(comment.createdAt)>Date.parse(post.createdAt));
      assert.ok(Date.parse(comment.createdAt)<=Date.now());
      assert.equal(hasPii(comment.body),false);
      assert.equal(reviewText(comment.body).riskLevel,"low");
    }
  }
});
