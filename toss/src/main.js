const root=document.getElementById('posts');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url='https://jinju.kr/api/posts?limit=10&sort=latest';
fetch(url,{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('fetch failed');return r.json()}).then(data=>{
 const posts=Array.isArray(data.posts)?data.posts:[];
 root.innerHTML=posts.length?posts.map(p=>'<article><p class="muted">'+escape(p.category||'이야기')+'</p><h2>'+escape(p.title)+'</h2><p>'+escape(String(p.content||'').slice(0,280))+'</p><p class="muted">댓글 '+Number(p.commentCount||0)+'개</p></article>').join(''):'<p>아직 표시할 이야기가 없습니다.</p>';
}).catch(()=>{root.textContent='이야기를 불러오지 못했습니다. 잠시 후 다시 이용해 주세요.';});
