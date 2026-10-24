import assert from 'node:assert/strict';
import test from 'node:test';
import { readerComments20261024 as entries } from '../lib/reader-comments-20261024';
import { builtInComments, builtInPosts } from '../lib/built-in-content';
import { hasPii, reviewText } from '../lib/safety';
import { likeBoost, withLikeBoost } from '../lib/like-boost';

test('Every built-in post gets exactly one safe, unique reader comment', () => {
  assert.equal(entries.length, builtInPosts.length);
  assert.equal(new Set(entries.map(e => e.postId)).size, builtInPosts.length);
  assert.equal(new Set(entries.map(e => e.id)).size, entries.length);
  assert.equal(new Set(entries.map(e => e.body)).size, entries.length);
  for (const entry of entries) {
    const post = builtInPosts.find(p => p.id === entry.postId);
    assert.ok(post, entry.postId);
    assert.ok(Date.parse(entry.createdAt) >= Date.parse(post.createdAt));
    assert.equal(entry.displayName.split(' ').length, 2);
    assert.doesNotMatch(entry.body, /운영팀|제가 겪|나도 해봤|저도 해봤|\.\.\.|…/);
    assert.equal(hasPii(entry.body), false);
    assert.equal(reviewText(entry.body).riskLevel, 'low');
    assert.equal(builtInComments(entry.postId).filter(c => c.id === entry.id).length, 1);
  }
});

test('Public like boost is stable and between 10 and 15', () => {
  for (const post of builtInPosts) {
    const boost = likeBoost(post.id);
    assert.ok(boost >= 10 && boost <= 15);
    assert.equal(boost, likeBoost(post.id));
    assert.equal(withLikeBoost(post).heard, post.heard + boost);
  }
});
