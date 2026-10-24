import assert from 'node:assert/strict';
import test from 'node:test';
import { guideComments20261024 as entries } from '../lib/guide-comments-20261024';
import { builtInComments, builtInPosts } from '../lib/built-in-content';
import { hasPii, reviewText } from '../lib/safety';

test('Guide comments are safe, unique and attached once to existing posts', () => {
  assert.ok(entries.length >= 2);
  assert.equal(new Set(entries.map(e => e.id)).size, entries.length);
  for (const entry of entries) {
    const post = builtInPosts.find(p => p.id === entry.postId);
    assert.ok(post, entry.postId);
    assert.ok(Date.parse(entry.createdAt) >= Date.parse(post.createdAt));
    assert.equal(entry.displayName.split(' ').length, 2);
    assert.doesNotMatch(entry.body, /운영팀|운영진|\.\.\.|…|AI/);
    assert.equal(hasPii(entry.body), false);
    assert.equal(reviewText(entry.body).riskLevel, 'low');
    const visible = builtInComments(entry.postId);
    assert.equal(visible.filter(c => c.id === entry.id).length, 1);
    assert.equal(visible.filter(c => c.displayName === entry.displayName).length, 1, 'nickname unique within the post');
    assert.equal(visible.filter(c => c.body === entry.body).length, 1);
  }
});
