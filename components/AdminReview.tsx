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

type ReactionPost = {
  id: string;
  title: string;
  heard: number;
  same: number;
};

export default function AdminReview() {
  const [username, setUsername] = useState("junginaha");
  const [secret, setSecret] = useState("");
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [reactions, setReactions] = useState<ReactionPost[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setUsername(sessionStorage.getItem("jinju-admin-username") || "junginaha");
      setSecret(sessionStorage.getItem("jinju-admin-review-secret") || "");
    } catch { /* Private browsing. */ }
  }, []);

  function adminHeaders() {
    return { "x-admin-username": username.trim().toLowerCase(), "x-admin-secret": secret };
  }

  async function load(event?: FormEvent) {
    event?.preventDefault();
    setMessage("승인 대기 글을 불러오는 중입니다…");
    const response = await fetch("/api/admin/posts", { headers: adminHeaders(), cache: "no-store" });
    const data = await response.json() as { posts?: PendingPost[]; reactions?: ReactionPost[]; error?: string };
    if (!response.ok) { setMessage(data.error || "불러오지 못했습니다."); setReady(false); return; }
    try {
      sessionStorage.setItem("jinju-admin-username", username.trim().toLowerCase());
      sessionStorage.setItem("jinju-admin-review-secret", secret);
    } catch { /* Private browsing. */ }
    setPosts(data.posts || []);
    setReactions(data.reactions || []);
    setReady(true);
    setMessage(data.posts?.length ? "" : "현재 승인 대기 중인 글이 없습니다.");
  }

  async function decide(id: string, action: "approve" | "reject") {
    if (!window.confirm(action === "approve" ? "이 글을 공개할까요?" : "이 글을 반려할까요?")) return;
    setBusyId(id);
    setMessage("");
    const response = await fetch("/api/admin/posts", {
      method: "PATCH",
      headers: { "content-type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ id, action }),
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) setMessage(data.error || "처리하지 못했습니다.");
    else setPosts((current) => current.filter((post) => post.id !== id));
    setBusyId("");
  }

  async function saveReactions(post: ReactionPost) {
    setBusyId(`reaction:${post.id}`);
    setMessage("");
    const response = await fetch("/api/admin/posts", {
      method: "PATCH",
      headers: { "content-type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ id: post.id, action: "set-reactions", heard: post.heard, same: post.same }),
    });
    const data = await response.json() as { heard?: number; same?: number; error?: string };
    if (!response.ok) setMessage(data.error || "반응 수를 저장하지 못했습니다.");
    else {
      setReactions((current) => current.map((item) => item.id === post.id ? { ...item, heard: data.heard ?? item.heard, same: data.same ?? item.same } : item));
      setMessage("반응 수를 저장했습니다.");
    }
    setBusyId("");
  }

  return (
    <main className="admin-review-page">
      <header><p>JINJU · 운영</p><h1>승인 대기 글</h1><a href="/">사이트로 돌아가기</a></header>
      {!ready && <form onSubmit={load} className="admin-login">
        <label htmlFor="admin-username">운영자 아이디</label>
        <input id="admin-username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} />
        <label htmlFor="admin-secret">운영자 비밀번호</label>
        <input id="admin-secret" type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="current-password" />
        <button type="submit" disabled={!username.trim() || !secret}>대기 목록 열기</button>
      </form>}
      {message && <p className="admin-message" role="status">{message}</p>}
      {ready && <>
        <section className="admin-pending-list">
          {posts.map((post) => <article key={post.id}>
            <div className="admin-post-meta"><span>{post.category}</span><time>{new Date(post.createdAt).toLocaleString("ko-KR")}</time></div>
            <h2>{post.title}</h2>
            <p className="admin-post-content">{post.content}</p>
            <div className="admin-review-reason"><strong>검수 결과 · {post.riskLevel}</strong>{post.issues.length > 0 && <ul>{post.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}<p>{post.explanation}</p></div>
            <div className="admin-decision-buttons"><button className="admin-reject" type="button" disabled={busyId === post.id} onClick={() => decide(post.id, "reject")}>반려</button><button className="admin-approve" type="button" disabled={busyId === post.id} onClick={() => decide(post.id, "approve")}>{busyId === post.id ? "처리 중…" : "승인하고 공개"}</button></div>
          </article>)}
        </section>
        <section className="admin-reaction-manager">
          <div><p>공개 클릭 수</p><h2>좋아요·싫어요 관리</h2></div>
          {reactions.map((post) => <article key={post.id}>
            <h3>{post.title}</h3>
            <div className="admin-reaction-fields">
              <label>좋아요<input type="number" min="0" inputMode="numeric" value={post.heard} onChange={(event) => setReactions((current) => current.map((item) => item.id === post.id ? { ...item, heard: Math.max(0, Number(event.target.value)) } : item))} /></label>
              <label>싫어요<input type="number" min="0" inputMode="numeric" value={post.same} onChange={(event) => setReactions((current) => current.map((item) => item.id === post.id ? { ...item, same: Math.max(0, Number(event.target.value)) } : item))} /></label>
              <button type="button" disabled={busyId === `reaction:${post.id}`} onClick={() => saveReactions(post)}>{busyId === `reaction:${post.id}` ? "저장 중…" : "저장"}</button>
            </div>
          </article>)}
        </section>
      </>}
    </main>
  );
}
