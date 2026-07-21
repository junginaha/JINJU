"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ManagedComment = {
  id: string;
  body: string;
  displayName: string;
  createdAt: string;
  status: string;
  source: string;
  scheduled: boolean;
};

type ManagedPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  visibility: string;
  status: string;
  riskLevel: string;
  issues: string[];
  explanation: string;
  reviewSource: string;
  createdAt: string;
  updatedAt: string;
  heard: number;
  same: number;
  source: string;
  comments: ManagedComment[];
};

type Summary = { total: number; pending: number; approved: number; hidden: number; rejected: number; comments: number };
type Identity = { id: string; role: "admin" | "superadmin" };
type FeedbackReport = {
  receipt: string;
  postId: string;
  postTitle: string;
  reason: string;
  detail: string;
  status: string;
  autoBlinded: boolean;
  createdAt: string;
};

const CATEGORIES = ["일상", "관계", "직장", "돈", "사회", "제안", "질문"];
const STATUS_LABEL: Record<string, string> = {
  approved: "공개", pending: "승인 대기", rejected: "반려", hidden: "숨김", deleted: "삭제", private: "비공개",
};

export default function AdminReview() {
  const [username, setUsername] = useState("junginaha");
  const [secret, setSecret] = useState("");
  const [content, setContent] = useState<ManagedPost[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, pending: 0, approved: 0, hidden: 0, rejected: 0, comments: 0 });
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newComments, setNewComments] = useState<Record<string, { displayName: string; body: string }>>({});

  async function loadAdminData(silent = false) {
    if (!silent) setMessage("운영 데이터를 불러오는 중입니다…");
    const [contentResponse, feedbackResponse] = await Promise.all([
      fetch("/api/admin/content", { credentials: "same-origin", cache: "no-store" }),
      fetch("/api/admin/feedback", { credentials: "same-origin", cache: "no-store" }),
    ]);
    const contentData = await contentResponse.json().catch(() => ({})) as { content?: ManagedPost[]; summary?: Summary; identity?: Identity; error?: string };
    if (!contentResponse.ok) {
      setMessage(contentData.error || "관리 데이터를 불러오지 못했습니다.");
      if (contentResponse.status === 401) setReady(false);
      return false;
    }
    setContent(contentData.content || []);
    if (contentData.summary) setSummary(contentData.summary);
    setIdentity(contentData.identity || null);
    if (feedbackResponse.ok) {
      const feedbackData = await feedbackResponse.json() as { reports?: FeedbackReport[] };
      setReports(feedbackData.reports || []);
    }
    setReady(true);
    if (!silent) setMessage("");
    return true;
  }

  useEffect(() => {
    void fetch("/api/admin/session", { credentials: "same-origin", cache: "no-store" })
      .then((response) => { if (response.ok) return loadAdminData(); })
      .catch(() => undefined);
  }, []);

  async function login(event?: FormEvent) {
    event?.preventDefault();
    setMessage("로그인하는 중입니다…");
    const response = await fetch("/api/admin/session", {
      method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: username.trim().toLowerCase(), password: secret }),
    });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) { setMessage(data.error || "로그인하지 못했습니다."); setReady(false); return; }
    setSecret("");
    await loadAdminData();
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE", credentials: "same-origin" });
    setReady(false); setContent([]); setReports([]); setIdentity(null); setMessage("로그아웃했습니다.");
  }

  async function updateManaged(payload: Record<string, unknown>, busyKey: string, successMessage: string) {
    setBusyId(busyKey); setMessage("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "처리하지 못했습니다.");
      await loadAdminData(true);
      setMessage(successMessage);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처리하지 못했습니다.");
      return false;
    } finally { setBusyId(""); }
  }

  function updatePostLocal(id: string, patch: Partial<ManagedPost>) {
    setContent((current) => current.map((post) => post.id === id ? { ...post, ...patch } : post));
  }

  function updateCommentLocal(postId: string, commentId: string, patch: Partial<ManagedComment>) {
    setContent((current) => current.map((post) => post.id === postId
      ? { ...post, comments: post.comments.map((comment) => comment.id === commentId ? { ...comment, ...patch } : comment) }
      : post));
  }

  async function savePost(post: ManagedPost) {
    await updateManaged({ entity: "post", action: "update", id: post.id, title: post.title, content: post.content, category: post.category, visibility: post.visibility }, `post:${post.id}`, "게시글 수정을 저장했습니다.");
  }

  async function postAction(post: ManagedPost, action: "approve" | "reject" | "hide" | "delete" | "restore") {
    const labels = { approve: "승인하고 공개", reject: "반려", hide: "숨김", delete: "삭제", restore: "복원하고 공개" };
    if (!window.confirm(`이 게시글을 ${labels[action]} 처리할까요?\n삭제와 숨김은 관리자 화면에서 다시 복원할 수 있습니다.`)) return;
    await updateManaged({ entity: "post", action, id: post.id }, `post:${post.id}`, `게시글을 ${labels[action]} 처리했습니다.`);
  }

  async function saveReactions(post: ManagedPost, nextHeard = post.heard, nextSame = post.same) {
    await updateManaged({ entity: "post", action: "set-reactions", id: post.id, heard: nextHeard, same: nextSame }, `reaction:${post.id}`, "반응 수를 저장했습니다.");
  }

  async function saveComment(postId: string, comment: ManagedComment) {
    await updateManaged({ entity: "comment", action: "update", id: comment.id, postId, content: comment.body, displayName: comment.displayName }, `comment:${comment.id}`, "댓글 수정을 저장했습니다.");
  }

  async function commentAction(postId: string, comment: ManagedComment, action: "hide" | "delete" | "restore") {
    const label = action === "restore" ? "복원" : action === "hide" ? "숨김" : "삭제";
    if (!window.confirm(`이 댓글을 ${label} 처리할까요?`)) return;
    await updateManaged({ entity: "comment", action, id: comment.id, postId }, `comment:${comment.id}`, `댓글을 ${label} 처리했습니다.`);
  }

  async function createComment(postId: string) {
    const draft = newComments[postId] || { displayName: "", body: "" };
    const ok = await updateManaged({ entity: "comment", action: "create", postId, content: draft.body, displayName: draft.displayName }, `new-comment:${postId}`, "관리자 댓글을 등록했습니다.");
    if (ok) setNewComments((current) => ({ ...current, [postId]: { displayName: "", body: "" } }));
  }

  async function decideFeedback(report: FeedbackReport, action: "keep" | "hide") {
    if (!window.confirm(action === "hide" ? "이 글을 블라인드할까요?" : "이 글을 유지할까요?")) return;
    setBusyId(`feedback:${report.receipt}`); setMessage("");
    const response = await fetch("/api/admin/feedback", {
      method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ receipt: report.receipt, action }),
    });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) setMessage(data.error || "접수 건을 처리하지 못했습니다.");
    else { await loadAdminData(true); setMessage(action === "hide" ? "글을 블라인드했습니다." : "글을 유지했습니다."); }
    setBusyId("");
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ko-KR");
    return content.filter((post) => (statusFilter === "all" || post.status === statusFilter)
      && (!needle || `${post.title} ${post.content} ${post.category} ${post.id}`.toLocaleLowerCase("ko-KR").includes(needle)));
  }, [content, query, statusFilter]);
  const openReports = reports.filter((report) => report.status !== "resolved");

  return (
    <main className="admin-review-page">
      <header>
        <p>JINJU · 운영</p><h1>통합 관리자</h1><a href="/">사이트로 돌아가기</a>
        {ready && <button className="admin-logout" type="button" onClick={logout}>로그아웃</button>}
      </header>
      {!ready && <form onSubmit={login} className="admin-login">
        <label htmlFor="admin-username">운영자 아이디</label>
        <input id="admin-username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} />
        <label htmlFor="admin-secret">운영자 비밀번호</label>
        <input id="admin-secret" type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="current-password" />
        <button type="submit" disabled={!username.trim() || !secret}>관리자 열기</button>
      </form>}
      {message && <p className="admin-message" role="status">{message}</p>}
      {ready && <>
        <section className="admin-dashboard-summary" aria-label="운영 현황">
          <article><strong>{summary.pending}</strong><span>승인 대기</span></article>
          <article><strong>{summary.approved}</strong><span>공개 글</span></article>
          <article><strong>{summary.rejected}</strong><span>반려 글</span></article>
          <article><strong>{summary.hidden}</strong><span>숨김·삭제</span></article>
          <article><strong>{summary.comments}</strong><span>전체 댓글</span></article>
          <article><strong>{openReports.length}</strong><span>미처리 신고</span></article>
        </section>
        <p className="admin-session-note">{identity?.id} · {identity?.role === "superadmin" ? "주관리자" : "관리자"} · 데이터베이스와 기본 시드 글을 함께 표시합니다.</p>

        <section className="admin-feedback-manager">
          <div><p>신고·의견</p><h2>미처리 접수 {openReports.length}</h2></div>
          {openReports.length === 0 && <p className="admin-feedback-empty">확인할 접수 건이 없습니다.</p>}
          {openReports.map((report) => <article key={report.receipt}>
            <div className="admin-post-meta"><span>{report.reason}{report.autoBlinded ? " · 임시 블라인드" : ""}</span><time>{new Date(report.createdAt).toLocaleString("ko-KR")}</time></div>
            <h3>{report.postTitle}</h3><p>{report.detail || "추가 설명 없음"}</p><small>{report.receipt}</small>
            <div className="admin-decision-buttons"><button className="admin-reject" type="button" disabled={busyId === `feedback:${report.receipt}`} onClick={() => decideFeedback(report, "hide")}>블라인드</button><button className="admin-approve" type="button" disabled={busyId === `feedback:${report.receipt}`} onClick={() => decideFeedback(report, "keep")}>유지</button></div>
          </article>)}
        </section>

        <section className="admin-content-manager">
          <div><p>전체 운영</p><h2>게시글·댓글·반응 관리</h2><span>공개·대기·반려·숨김·삭제 상태를 모두 조회하고 복원할 수 있습니다.</span></div>
          <div className="admin-content-toolbar">
            <label>검색<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목, 본문, ID 검색" /></label>
            <label>상태<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">전체 {summary.total}</option><option value="pending">승인 대기</option><option value="approved">공개</option><option value="rejected">반려</option><option value="hidden">숨김</option><option value="deleted">삭제</option></select></label>
            <button type="button" onClick={() => void loadAdminData()} disabled={Boolean(busyId)}>새로고침</button>
          </div>
          <p className="admin-filter-result">현재 {filtered.length}개 표시</p>
          {filtered.length === 0 && <p className="admin-feedback-empty">이 조건에 맞는 게시글이 없습니다.</p>}
          {filtered.map((post) => <details key={post.id} open={post.status === "pending"}>
            <summary><span className={`admin-status admin-status-${post.status}`}>{STATUS_LABEL[post.status] || post.status}</span><b>{post.title}</b><em>댓글 {post.comments.length}</em></summary>
            <div className="admin-content-editor">
              <div className="admin-post-meta"><span>{post.source === "database" ? "저장된 게시글" : "기본 시드"} · {post.id}</span><time>{new Date(post.createdAt).toLocaleString("ko-KR")}</time></div>
              {post.status === "pending" && <div className="admin-review-reason"><strong>검수 결과 · {post.riskLevel}</strong>{post.issues.length > 0 && <ul>{post.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}<p>{post.explanation || "운영자 확인이 필요합니다."}</p></div>}
              <label>제목<input value={post.title} maxLength={80} onChange={(event) => updatePostLocal(post.id, { title: event.target.value })} /></label>
              <div className="admin-two-fields">
                <label>분류<select value={post.category} onChange={(event) => updatePostLocal(post.id, { category: event.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label>공개 범위<select value={post.visibility} onChange={(event) => updatePostLocal(post.id, { visibility: event.target.value })}><option value="public">공개</option><option value="private">비공개</option></select></label>
              </div>
              <label>본문<textarea value={post.content} maxLength={2000} rows={7} onChange={(event) => updatePostLocal(post.id, { content: event.target.value })} /></label>
              <div className="admin-reaction-fields admin-inline-reactions">
                <label>좋아요<input type="number" min="0" inputMode="numeric" value={post.heard} onChange={(event) => updatePostLocal(post.id, { heard: Math.max(0, Number(event.target.value)) })} /></label>
                <label>싫어요<input type="number" min="0" inputMode="numeric" value={post.same} onChange={(event) => updatePostLocal(post.id, { same: Math.max(0, Number(event.target.value)) })} /></label>
                <div className="admin-like-quick-actions"><button type="button" onClick={() => void saveReactions(post, post.heard + 1)}>좋아요 +1</button><button type="button" onClick={() => void saveReactions(post, post.heard + 5)}>+5</button><button type="button" onClick={() => void saveReactions(post, post.heard + 10)}>+10</button></div>
                <button type="button" disabled={busyId === `reaction:${post.id}`} onClick={() => void saveReactions(post)}>반응 저장</button>
              </div>
              <div className="admin-post-actions">
                <button type="button" disabled={busyId === `post:${post.id}`} onClick={() => void savePost(post)}>내용 저장</button>
                {post.status === "pending" && <><button className="admin-approve" type="button" onClick={() => void postAction(post, "approve")}>승인·공개</button><button className="admin-reject" type="button" onClick={() => void postAction(post, "reject")}>반려</button></>}
                {post.status === "approved" && <button className="admin-secondary" type="button" onClick={() => void postAction(post, "hide")}>숨김</button>}
                {["rejected", "hidden", "deleted"].includes(post.status) && <button className="admin-approve" type="button" onClick={() => void postAction(post, "restore")}>복원·공개</button>}
                {post.status !== "deleted" && <button className="admin-danger" type="button" onClick={() => void postAction(post, "delete")}>삭제</button>}
              </div>

              <div className="admin-comment-manager">
                <h3>댓글 {post.comments.length}</h3>
                <div className="admin-new-comment">
                  <label>새 댓글 작성자<input value={newComments[post.id]?.displayName || ""} maxLength={12} placeholder="익명" onChange={(event) => setNewComments((current) => ({ ...current, [post.id]: { displayName: event.target.value, body: current[post.id]?.body || "" } }))} /></label>
                  <label>새 댓글 내용<textarea value={newComments[post.id]?.body || ""} maxLength={2000} rows={3} placeholder="게시글 맥락에 맞는 댓글을 입력하세요" onChange={(event) => setNewComments((current) => ({ ...current, [post.id]: { displayName: current[post.id]?.displayName || "", body: event.target.value } }))} /></label>
                  <button type="button" disabled={busyId === `new-comment:${post.id}` || !(newComments[post.id]?.body || "").trim()} onClick={() => void createComment(post.id)}>댓글 등록</button>
                </div>
                {post.comments.map((comment) => <article key={comment.id} className={comment.status === "approved" ? "" : "admin-comment-muted"}>
                  <div className="admin-post-meta"><span>{STATUS_LABEL[comment.status] || comment.status}{comment.scheduled ? " · 예약 노출" : ""} · {comment.source}</span><time>{new Date(comment.createdAt).toLocaleString("ko-KR")}</time></div>
                  <label>이름<input value={comment.displayName} maxLength={12} onChange={(event) => updateCommentLocal(post.id, comment.id, { displayName: event.target.value })} /></label>
                  <label>내용<textarea value={comment.body} maxLength={2000} rows={3} onChange={(event) => updateCommentLocal(post.id, comment.id, { body: event.target.value })} /></label>
                  <div className="admin-comment-actions">
                    <button type="button" disabled={busyId === `comment:${comment.id}`} onClick={() => void saveComment(post.id, comment)}>댓글 저장</button>
                    {comment.status === "approved" ? <><button className="admin-secondary" type="button" onClick={() => void commentAction(post.id, comment, "hide")}>숨김</button><button className="admin-danger" type="button" onClick={() => void commentAction(post.id, comment, "delete")}>삭제</button></> : <button className="admin-approve" type="button" onClick={() => void commentAction(post.id, comment, "restore")}>복원</button>}
                  </div>
                </article>)}
              </div>
            </div>
          </details>)}
        </section>
      </>}
    </main>
  );
}
