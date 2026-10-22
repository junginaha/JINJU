"use client";
import { useEffect, useState } from "react";

type Post = { id: string; title: string; content: string; category?: string; commentCount?: number; createdAt?: string };
export default function TossJinjuPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/posts?limit=10&sort=latest", { signal: controller.signal, cache: "no-store" })
      .then(async r => { if (!r.ok) throw new Error("게시글을 불러오지 못했습니다."); return r.json(); })
      .then(data => setPosts(Array.isArray(data.posts) ? data.posts : []))
      .catch(e => { if (e.name !== "AbortError") setError("잠시 후 다시 이용해 주세요."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  return <main style={{maxWidth:600,margin:"0 auto",padding:"24px 18px",minHeight:"100vh",background:"#fffaf5",color:"#292724",fontFamily:"system-ui,sans-serif"}}>
    <header style={{paddingBottom:20,borderBottom:"1px solid #e9e0d7"}}><p style={{fontSize:13,color:"#786a5e"}}>진주 · 오늘의 이야기</p><h1 style={{fontSize:28,fontWeight:750,marginTop:8}}>마음에 남는 한 문장</h1><p style={{marginTop:8,color:"#756d66",fontSize:14}}>서로 다른 생각을 편안하게 읽는 시간</p></header>
    {loading && <p role="status" style={{paddingTop:24}}>이야기를 불러오는 중입니다.</p>}
    {error && <p role="alert" style={{paddingTop:24}}>{error}</p>}
    {!loading && !error && posts.length === 0 && <p style={{paddingTop:24}}>아직 표시할 이야기가 없습니다.</p>}
    <section aria-label="공개 이야기">{posts.map(post => <article key={post.id} style={{padding:"22px 0",borderBottom:"1px solid #e9e0d7"}}>
      <p style={{fontSize:12,color:"#846d59"}}>{post.category || "이야기"}</p>
      <h2 style={{fontSize:19,fontWeight:700,margin:"8px 0"}}>{post.title}</h2>
      <p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",lineHeight:1.75,fontSize:15}}>{post.content.length > 280 ? post.content.slice(0,280)+"…" : post.content}</p>
      <p style={{fontSize:12,color:"#84796e",marginTop:10}}>댓글 {post.commentCount ?? 0}개</p>
    </article>)}</section>
    <footer style={{padding:"24px 0",fontSize:12,color:"#7c746d"}}>공개 게시글을 읽기 전용으로 제공합니다. 댓글 작성과 로그인은 지원하지 않습니다.</footer>
  </main>;
}
