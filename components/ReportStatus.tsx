"use client";

import { FormEvent, useState } from "react";

type ReportResult = {
  receipt: string;
  status: string;
  resolution?: "hidden" | "kept" | "";
  createdAt: string;
};

const STATUS_TEXT: Record<string, string> = {
  received: "접수됨",
  reviewing: "운영자 확인 중",
  resolved: "처리 완료",
};

export default function ReportStatus() {
  const [receipt, setReceipt] = useState("");
  const [key, setKey] = useState("");
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const query = new URLSearchParams({ receipt: receipt.trim().toUpperCase(), key: key.trim().toUpperCase() });
      const response = await fetch(`/api/feedback?${query.toString()}`, { cache: "no-store" });
      const data = await response.json() as ReportResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "접수 내역을 확인하지 못했습니다.");
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "접수 내역을 확인하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="admin-login" onSubmit={submit}>
    <label htmlFor="report-receipt">접수번호</label>
    <input id="report-receipt" value={receipt} onChange={(event) => setReceipt(event.target.value)} placeholder="JINJU-..." autoCapitalize="characters" />
    <label htmlFor="report-key">확인키</label>
    <input id="report-key" value={key} onChange={(event) => setKey(event.target.value)} placeholder="확인키" autoCapitalize="characters" />
    <button type="submit" disabled={busy || !receipt.trim() || !key.trim()}>{busy ? "확인 중…" : "처리 상태 확인"}</button>
    {error && <p className="feedback-error" role="alert">{error}</p>}
    {result && <div className="admin-message" role="status">
      <strong>{STATUS_TEXT[result.status] || result.status}</strong>
      <p>접수일 {new Date(result.createdAt).toLocaleString("ko-KR")}</p>
      {result.status === "resolved" && <p>{result.resolution === "hidden" ? "대상 게시글의 공개를 제한하는 조치가 이루어졌습니다." : result.resolution === "kept" ? "검토 결과 대상 게시글은 공개 상태를 유지합니다." : "운영 검토가 완료됐습니다."}</p>}
      {result.status === "reviewing" && <p>권리침해 가능성과 필요한 조치를 우선 확인하고 있습니다.</p>}
    </div>}
  </form>;
}
