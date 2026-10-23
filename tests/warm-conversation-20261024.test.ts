import assert from 'node:assert/strict';
import test from 'node:test';
import { warmConversationEntries as entries } from '../lib/warm-conversation-20261024';
import { builtInComments, builtInPosts } from '../lib/built-in-content';
import { refinedJinjuDisplayName } from '../lib/display-name';
import { hasPii, reviewText } from '../lib/safety';
import { visibleCommentsAt } from '../lib/comment-time';

test('Conversation starters preserve existing content and have safe, contextual copy', () => {
  assert.equal(entries.length,44);
  assert.equal(new Set(entries.map(e=>e.id)).size,44);
  assert.equal(new Set(entries.map(e=>e.body)).size,44);
  assert.equal(new Set(entries.map(e=>e.displayName)).size,44);
  for(const entry of entries){
    const post=builtInPosts.find(p=>p.id===entry.postId);assert.ok(post);
    assert.ok(Date.parse(entry.createdAt)>=Date.parse(post.createdAt));
    assert.ok(entry.body.length>=140);
    assert.equal(entry.displayName.split(' ').length,2);
    assert.doesNotMatch(entry.body,/운영팀|제가 겪|나도 해봤|저도 해봤|\.\.\.|…/);
    assert.equal(hasPii(entry.body),false);assert.equal(reviewText(entry.body).riskLevel,'low');
    assert.equal(builtInComments(entry.postId).filter(c=>c.id===entry.id).length,1);
    assert.equal(visibleCommentsAt([entry],Date.parse(entry.createdAt)-1).length,0);
  }
});
test('Only the team byline is mapped to a stable anonymous display label',()=>{
  const name=refinedJinjuDisplayName('진주 운영팀','post-example');
  assert.notEqual(name,'진주 운영팀');assert.equal(name.split(' ').length,2);
  assert.equal(name,refinedJinjuDisplayName('진주 운영팀','post-example'));
  assert.equal(refinedJinjuDisplayName('여유로운 정원','reader-id'),'여유로운 정원');
  for(const post of builtInPosts)assert.notEqual(post.displayName,'진주 운영팀');
});
