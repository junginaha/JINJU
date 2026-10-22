"use client";
// Toss bundle replacement for components/TurnstileChallenge.
// The Cloudflare widget runs in an iframe and is bound to 진주.kr hostnames, which the
// Toss WebView does not allow. The site's own signed fallback (/api/security/post-fallback)
// is used instead: posts send it as fallbackProof, reports send it as a prefixed token.
import { useEffect, useRef, useState } from "react";

const FALLBACK_ENDPOINT = "/api/security/post-fallback";
export const FALLBACK_TOKEN_PREFIX = "jinju-fallback.";

export default function TossTurnstile({
  action,
  resetSignal = 0,
  onToken,
  onRequiredChange,
  onFallbackProof,
}: {
  action: "post" | "comment" | "feedback";
  resetSignal?: number;
  onToken: (token: string) => void;
  onRequiredChange: (required: boolean) => void;
  onFallbackProof?: (proof: string) => void;
}) {
  const tokenRef = useRef(onToken);
  const requiredRef = useRef(onRequiredChange);
  const proofRef = useRef(onFallbackProof);
  tokenRef.current = onToken;
  requiredRef.current = onRequiredChange;
  proofRef.current = onFallbackProof;
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    tokenRef.current("");
    proofRef.current?.("");
    if (action === "comment") { requiredRef.current(false); setMessage(""); return; }

    requiredRef.current(true);
    setMessage("");
    let cancelled = false;
    let timer: number | null = null;
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(FALLBACK_ENDPOINT, { method: "POST", cache: "no-store", signal: controller.signal });
        const data = (await response.json()) as { proof?: string; readyAfterMs?: number };
        if (cancelled || !response.ok || !data.proof) throw new Error("no_proof");
        const delay = Math.max(1_000, Math.min(30_000, Number(data.readyAfterMs) || 8_000));
        timer = window.setTimeout(() => {
          if (cancelled) return;
          if (action === "post") proofRef.current?.(data.proof!);
          else tokenRef.current(FALLBACK_TOKEN_PREFIX + data.proof);
          requiredRef.current(false);
        }, delay);
      } catch {
        if (!cancelled && !controller.signal.aborted) setMessage("보안 확인 연결이 늦어지고 있습니다. 다시 확인해주세요.");
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [action, resetSignal, retry]);

  if (!message) return null;
  return (
    <div className="turnstile-challenge" aria-live="polite">
      <p role="status">{message}</p>
      <button type="button" onClick={() => setRetry((v) => v + 1)}>다시 확인</button>
    </div>
  );
}
