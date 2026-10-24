import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { communityConversationEntries as entries, communityReaderPostIds } from '../lib/community-conversations-20261024';
import { builtInComments, builtInPost } from '../lib/built-in-content';
import { supplementalComments, keepsSupplementalCommentsWithAutoSet } from '../lib/supplemental-comments';
import { mergeBaseCommentsByBody } from '../lib/comment-visibility';
import { hasPii,reviewText } from '../lib/safety';

test('Commissioned comments are contextual, safe and have distinct names and copy',()=>{
 assert.equal(entries.length,69);
 assert.equal(new Set(entries.map(e=>e.id)).size,69);
 assert.equal(new Set(entries.map(e=>e.body)).size,69);
 assert.equal(new Set(entries.map(e=>e.displayName)).size,69);
 for(const e of entries){
  assert.equal(e.displayName.split(' ').length,2);assert.ok(e.body.length>=100);
  assert.equal(hasPii(e.body),false);assert.equal(reviewText(e.body).riskLevel,'low');
  assert.doesNotMatch(e.body,/운영팀|운영진|제가 겪|저도 해봤|나도 해봤|\.\.\./);
  assert.ok(Date.parse(e.createdAt)>=Date.parse('2026-10-24T00:00:00+09:00'));
 }
});
test('Reader posts receive authored supplements and built-in posts do not double-count them',()=>{
 for(const id of new Set(entries.map(e=>e.postId))){
  const post=builtInPost(id)??{id,title:'',content:'',category:'일상',createdAt:'2026-10-13T00:00:00+09:00'};
  const base=builtInPost(id)?builtInComments(id):[];
  const merged=mergeBaseCommentsByBody(base,supplementalComments(post));
  for(const e of entries.filter(e=>e.postId===id))assert.equal(merged.filter(c=>c.id===e.id).length,1);
  if(communityReaderPostIds.has(id))assert.equal(keepsSupplementalCommentsWithAutoSet(id),true);
 }
});
test('Toss HTML embeds generated component CSS after site CSS',()=>{
 const build=readFileSync('toss/build.mjs','utf8');
 assert.ok(build.indexOf('<style data-jinju-component-styles>')>build.indexOf('/assets/site.css'));
 assert.match(build,/Missing bundled component CSS/);
});
