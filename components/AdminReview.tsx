"use client";

import { FormEvent, useEffect, useState } from "react";

type PendingPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  riskLevel: string;
  issues: string[];
  explanation: string;
  reviewSource: string;
  createdAt: string;
};

export default function AdminReview() {
  const [secret, setSecret] = useState("");
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setSecret(sessionStorage.getItem("jinju-admin-review-secret") || ""); } catch { /* Private browsing. */ }
  }, []);

  async function load(event?: FormEvent) {
    event?.preventDefault();
    setMessage("승인 대기 글을 불러오는 중입니다…");
    const response = await fetch("/api/admin/posts", { headers: { "x-admin-secret": secret }, cache: "no-store" });
    const data = await response.json() as { posts?: PendingPost[]; error?: string };
    if (!response.ok) { setMessage(data.error || "불러오지 못했습니다."); setReady(false); return; }
    try { sessionStorage.setItem("jinju-admin-review-secret", secret); } catch { /* Private browsing. */ }
    setPosts(data.posts || []);
    setReady(true);
    setMessage(data.posts?.length ? "" : "현재 승인 대기 중인 글이 없습니다.");
  }

  async function decide(id: string, action: "approve" | "reject") {
    if (!window.confirm(action === "approve" ? "이 글을 공개할까요?" : "이 글을 반려할까요?")) return;
    setBusyId(id);
    setMessage("");
    const response = await fetch("/api/admin/posts", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ id, action }),
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) setMessage(data.error || "처리하지 못했습니다.");
    else setPosts((current) => current.filter((post) => post.id !== id));
    setBusyId("");
  }

  return (
    <main className="admin-review-page">
      <header><p>JINJU · 운영</p><h1>승인 대기 글</h1><a href="/">사이트로 돌아가기</a></header>
      {!ready && <form onSubmit={load} className="admin-login">
        <label htmlFor="admin-secret">운영자 승인 암호</label>
        <input id="admin-secret" type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="current-password" />
        <button type="submit" disabled={!secret}>대기 목록 열기</button>
      </form>}
      {message && <p className="admin-message" role="status">{message}</p>}
      {ready && <section className="admin-pending-list">
        {posts.map((post) => <article key={post.id}>
          <div className="admin-post-meta"><span>{post.category}</span><time>{new Date(post.createdAt).toLocaleString("ko-KR")}</time></div>
          <h2>{post.title}</h2>
          <p className="admin-post-content">{post.content}</p>
          <div className="admin-review-reason"><strong>검수 결과 · {post.riskLevel}</strong>{post.issues.length > 0 && <ul>{post.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}<p>{post.explanation}</p></div>
          <div className="admin-decision-buttons"><button className="admin-reject" type="button" disabled={busyId === post.id} onClick={() => decide(post.id, "reject")}>반려</button><button className="admin-approve" type="button" disabled={busyId === post.id} onClick={() => decide(post.id, "approve")}>{busyId === post.id ? "처리 중…" : "승인하고 공개"}</button></div>
        </article>)}
      </section>}
    </main>
  );
}
