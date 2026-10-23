import assert from 'node:assert/strict';
import test from 'node:test';
import { koreaDay,nextKoreaDay,selectTodaysPearl } from '../lib/todays-pearl';
import type { EditorialPost } from '../lib/editorial';
const at=Date.parse('2026-10-24T09:00:00+09:00');
const make=(id:string,createdAt='2026-10-22T08:00:00+09:00'):EditorialPost=>({id,title:'같이 이야기해볼 선택은?',content:'매일 마주치는 관계와 선택에 관해 구체적인 상황을 놓고 여러 관점을 나누는 이야기예요. 서로의 다른 생각을 존중하며 의견을 나눠봐요.',category:'관계',createdAt,heard:0,same:0,support:0,commentCount:0});
test('Daily choice uses KST and rolls over at local midnight',()=>{
 assert.equal(koreaDay(Date.parse('2026-10-23T14:59:59Z')),'2026-10-23');
 assert.equal(koreaDay(Date.parse('2026-10-23T15:00:00Z')),'2026-10-24');
 assert.equal(nextKoreaDay(at),Date.parse('2026-10-25T00:00:00+09:00'));
});
test('Choice is one per day, independent of order, reactions and incoming daytime articles',()=>{
 const posts=Array.from({length:20},(_,i)=>make('p'+i));const before=JSON.stringify(posts);
 const pick=selectTodaysPearl(posts,at);assert.ok(pick);
 assert.equal(selectTodaysPearl([...posts].reverse(),at)?.id,pick.id);
 assert.equal(selectTodaysPearl(posts.map(p=>({...p,heard:999,commentCount:999})),at)?.id,pick.id);
 assert.equal(selectTodaysPearl([...posts,make('breaking','2026-10-24T10:00:00+09:00')],at+8*3600000)?.id,pick.id);
 assert.notEqual(selectTodaysPearl(posts,at+86400000)?.id,pick.id);
 assert.equal(JSON.stringify(posts),before);
});
test('Editorial override is public-only; removed and future posts cannot be featured',()=>{
 const curated=make('jinju-editorial-20261023-starry-night-sky','2026-10-23T06:21:08+09:00');
 assert.equal(selectTodaysPearl([curated],Date.parse('2026-10-23T07:00:00+09:00'))?.id,curated.id);
 assert.equal(selectTodaysPearl([curated],Date.parse('2026-10-23T05:00:00+09:00')),null);
 assert.equal(selectTodaysPearl([],at),null);
});
