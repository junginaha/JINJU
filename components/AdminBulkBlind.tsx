"use client";

import { useEffect, useMemo, useState } from "react";

type ManagedPost = {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
};

export default function AdminBulkBlind() {
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("운영 데이터를 불러오는 중입니다…");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/content", { credentials: "same-origin", cache: "no-store" });
    const data = await response.json().catch(() => ({})) as { content?: ManagedPost[]; error?: string };
    if (!response.ok) {
      setMessage(response.status === 401 ? "먼저 통합 관리자에서 로그인해주세요." : data.error || "운영 데이터를 불러오지 못했습니다.");
      return;
    }
    setPosts((data.content || []).filter((post) => post.status === "approved"));
    setMessage("");
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ko-KR");
    return posts.filter((post) => !needle || `${post.title} ${post.category} ${post.id}`.toLocaleLowerCase("ko-KR").includes(needle));
  }, [posts, query]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function blindSelected() {
    const ids = [...selected];
    if (!ids.length || busy) return;
    if (!window.confirm(`선택한 ${ids.length}개 게시글을 한꺼번에 숨길까요? 관리자에서 다시 복원할 수 있습니다.`)) return;
    setBusy(true);
    setMessage("선택한 글을 블라인드하고 있습니다…");
    let completed = 0;
    for (const id of ids) {
      const response = await fetch("/api/admin/content", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entity: "post", action: "hide", id }),
      });
      if (!response.ok) break;
      completed += 1;
    }
    setSelected(new Set());
    await load();
    setMessage(completed === ids.length ? `${completed}개 게시글을 블라인드했습니다.` : `${completed}개 처리 후 중단됐습니다. 나머지는 다시 확인해주세요.`);
    setBusy(false);
  }

  return <main className="admin-review-page">
    <header><p>JINJU · 운영</p><h1>일괄 블라인드</h1><a href="/admin">통합 관리자로 돌아가기</a></header>
    {message && <p className="admin-message" role="status">{message}</p>}
    <section className="admin-content-manager">
      <div><p>긴급 운영 도구</p><h2>공개 글 여러 개 숨기기</h2><span>삭제가 아니라 숨김 처리하며 통합 관리자에서 복원할 수 있습니다.</span></div>
      <div className="admin-content-toolbar">
        <label>검색<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목, 분류, ID 검색" /></label>
        <button type="button" onClick={() => setSelected(new Set(visible.map((post) => post.id)))} disabled={busy || visible.length === 0}>현재 목록 전체 선택</button>
        <button type="button" onClick={() => setSelected(new Set())} disabled={busy || selected.size === 0}>선택 해제</button>
        <button className="admin-danger" type="button" onClick={() => void blindSelected()} disabled={busy || selected.size === 0}>선택 {selected.size}개 블라인드</button>
      </div>
      <p className="admin-filter-result">공개 글 {visible.length}개</p>
      {visible.map((post) => <label key={post.id} className="admin-new-comment" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input type="checkbox" checked={selected.has(post.id)} onChange={() => toggle(post.id)} style={{ width: 20, height: 20 }} />
        <span><strong>{post.title}</strong><br /><small>{post.category} · {new Date(post.createdAt).toLocaleString("ko-KR")} · {post.id}</small></span>
      </label>)}
    </section>
  </main>;
}
