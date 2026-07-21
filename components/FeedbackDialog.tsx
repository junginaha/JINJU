"use client";

import { FormEvent, useState } from "react";

const reasons = ["개인정보 노출", "실명 거론·명예훼손", "혐오·괴롭힘", "불법·위험한 내용", "광고·도배", "기타"];

export default function FeedbackDialog({ postId, postTitle, onClose }: { postId: string; postTitle: string; onClose: () => void }) {
  const [reason, setReason] = useState(reasons[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [checkKey, setCheckKey] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ postId, reason, detail }) });
      const data = await response.json() as { receipt?: string; checkKey?: string; error?: string };
      if (!response.ok || !data.receipt || !data.checkKey) throw new Error(data.error || "의견을 접수하지 못했습니다.");
      setReceipt(data.receipt);
      setCheckKey(data.checkKey);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "의견을 접수하지 못했습니다.");
    } finally { setBusy(false); }
  }

  async function copyReceipt() {
    try {
      await navigator.clipboard.writeText(`접수번호: ${receipt}\n확인키: ${checkKey}`);
      setCopyMessage("접수번호와 확인키를 복사했습니다.");
    } catch { setCopyMessage("접수번호와 확인키를 따로 보관해주세요."); }
  }

  return <div className="feedback-overlay" role="dialog" aria-modal="true" aria-labelledby="feedback-title"><div className="feedback-dialog">
    <button className="feedback-close" type="button" onClick={onClose} aria-label="닫기">×</button>
    {receipt ? <><p className="feedback-eyebrow">익명 접수 완료</p><h2 id="feedback-title">의견을 받았습니다.</h2><p>이름이나 연락처 없이 접수됐습니다. 아래 두 항목은 다시 표시되지 않으니 보관해주세요.</p><dl><div><dt>접수번호</dt><dd>{receipt}</dd></div><div><dt>확인키</dt><dd>{checkKey}</dd></div></dl><button className="feedback-primary" type="button" onClick={copyReceipt}>접수정보 복사</button>{copyMessage && <p className="feedback-status" role="status">{copyMessage}</p>}<button className="feedback-secondary" type="button" onClick={onClose}>확인</button></> : <form onSubmit={submit}><p className="feedback-eyebrow">의견 보내기</p><h2 id="feedback-title">이 글에 대한 의견</h2><p className="feedback-target">{postTitle}</p><label>이유<select value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((item) => <option key={item}>{item}</option>)}</select></label><label>설명 <span>선택</span><textarea value={detail} onChange={(event) => setDetail(event.target.value.slice(0, 300))} maxLength={300} rows={4} placeholder="운영자가 확인할 내용을 적어주세요." /></label><small>{detail.length}/300 · 이름·연락처는 적지 마세요.</small>{error && <p className="feedback-error" role="alert">{error}</p>}<button className="feedback-primary" type="submit" disabled={busy}>{busy ? "접수 중…" : "익명으로 보내기"}</button></form>}
  </div></div>;
}
