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

type ManagedComment = { id: string; body: string; displayName: string; createdAt: string };
type ManagedPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  comments: ManagedComment[];
};

export default function AdminReview() {
  const [username, setUsername] = useState("junginaha");
  const [secret, setSecret] = useState("");
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [reactions, setReactions] = useState<ReactionPost[]>([]);
  const [managedContent, setManagedContent] = useState<ManagedPost[] | null>(null);
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
    const contentResponse = await fetch("/api/admin/content", { headers: adminHeaders(), cache: "no-store" });
    if (contentResponse.ok) {
      const contentData = await contentResponse.json() as { content?: ManagedPost[] };
      setManagedContent(contentData.content || []);
    } else setManagedContent(null);
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

  async function updateManaged(payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "content-type": "application/json", ...adminHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) throw new Error(data.error || "처리하지 못했습니다.");
  }

  async function savePost(post: ManagedPost) {
    setBusyId(`post:${post.id}`);
    setMessage("");
    try {
      await updateManaged({ entity: "post", action: "update", id: post.id, title: post.title, content: post.content, category: post.category });
      setMessage("게시글 수정을 저장했습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "게시글을 저장하지 못했습니다."); }
    setBusyId("");
  }

  async function deletePost(id: string) {
    if (!window.confirm("이 게시글과 공개된 댓글을 사이트에서 삭제할까요?")) return;
    setBusyId(`post:${id}`);
    setMessage("");
    try {
      await updateManaged({ entity: "post", action: "delete", id, postId: id });
      setManagedContent((current) => current?.filter((post) => post.id !== id) || null);
      setMessage("게시글을 삭제했습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "게시글을 삭제하지 못했습니다."); }
    setBusyId("");
  }

  async function saveComment(postId: string, comment: ManagedComment) {
    setBusyId(`comment:${comment.id}`);
    setMessage("");
    try {
      await updateManaged({ entity: "comment", action: "update", id: comment.id, postId, content: comment.body, displayName: comment.displayName });
      setMessage("댓글 수정을 저장했습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "댓글을 저장하지 못했습니다."); }
    setBusyId("");
  }

  async function deleteComment(postId: string, commentId: string) {
    if (!window.confirm("이 댓글을 사이트에서 삭제할까요?")) return;
    setBusyId(`comment:${commentId}`);
    setMessage("");
    try {
      await updateManaged({ entity: "comment", action: "delete", id: commentId, postId });
      setManagedContent((current) => current?.map((post) => post.id === postId ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) } : post) || null);
      setMessage("댓글을 삭제했습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "댓글을 삭제하지 못했습니다."); }
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
        {managedContent && <section className="admin-content-manager">
          <div><p>주관리자 전용</p><h2>게시글·댓글 수정 및 삭제</h2></div>
          {managedContent.map((post) => <details key={post.id}>
            <summary>{post.title}<span>댓글 {post.comments.length}</span></summary>
            <div className="admin-content-editor">
              <label>제목<input value={post.title} maxLength={80} onChange={(event) => setManagedContent((current) => current?.map((item) => item.id === post.id ? { ...item, title: event.target.value } : item) || null)} /></label>
              <label>분류<select value={post.category} onChange={(event) => setManagedContent((current) => current?.map((item) => item.id === post.id ? { ...item, category: event.target.value } : item) || null)}>{["일상", "관계", "직장", "돈", "사회", "제안", "질문"].map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>본문<textarea value={post.content} maxLength={2000} rows={6} onChange={(event) => setManagedContent((current) => current?.map((item) => item.id === post.id ? { ...item, content: event.target.value } : item) || null)} /></label>
              <div className="admin-content-actions"><button type="button" disabled={busyId === `post:${post.id}`} onClick={() => deletePost(post.id)}>게시글 삭제</button><button type="button" disabled={busyId === `post:${post.id}`} onClick={() => savePost(post)}>게시글 저장</button></div>
              <div className="admin-comment-manager">
                <h3>댓글 {post.comments.length}</h3>
                {post.comments.map((comment) => <article key={comment.id}>
                  <label>이름<input value={comment.displayName} maxLength={12} onChange={(event) => setManagedContent((current) => current?.map((item) => item.id === post.id ? { ...item, comments: item.comments.map((entry) => entry.id === comment.id ? { ...entry, displayName: event.target.value } : entry) } : item) || null)} /></label>
                  <label>내용<textarea value={comment.body} maxLength={2000} rows={3} onChange={(event) => setManagedContent((current) => current?.map((item) => item.id === post.id ? { ...item, comments: item.comments.map((entry) => entry.id === comment.id ? { ...entry, body: event.target.value } : entry) } : item) || null)} /></label>
                  <div className="admin-content-actions"><button type="button" disabled={busyId === `comment:${comment.id}`} onClick={() => deleteComment(post.id, comment.id)}>댓글 삭제</button><button type="button" disabled={busyId === `comment:${comment.id}`} onClick={() => saveComment(post.id, comment)}>댓글 저장</button></div>
                </article>)}
              </div>
            </div>
          </details>)}
        </section>}
      </>}
    </main>
  );
}
