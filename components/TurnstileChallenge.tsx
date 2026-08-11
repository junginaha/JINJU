"use client";

import { useEffect, useRef, useState } from "react";

type WidgetId = string | number;
type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => WidgetId;
  reset: (widgetId: WidgetId) => void;
  remove: (widgetId: WidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const PUBLIC_HOSTS = new Set([
  "xn--o55b9n.kr",
  "www.xn--o55b9n.kr",
  "jinju-two.vercel.app",
]);
const SCRIPT_ID = "jinju-turnstile-script";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const FALLBACK_ENDPOINT = "/api/security/post-fallback";

export default function TurnstileChallenge({
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<WidgetId | null>(null);
  const tokenCallbackRef = useRef(onToken);
  const requiredCallbackRef = useRef(onRequiredChange);
  const fallbackCallbackRef = useRef(onFallbackProof);
  const [required, setRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [retrySignal, setRetrySignal] = useState(0);
  const [retryAvailable, setRetryAvailable] = useState(false);

  tokenCallbackRef.current = onToken;
  requiredCallbackRef.current = onRequiredChange;
  fallbackCallbackRef.current = onFallbackProof;

  useEffect(() => {
    const isPublicHost = PUBLIC_HOSTS.has(window.location.hostname.toLowerCase());
    if (!isPublicHost) {
      setRequired(false);
      requiredCallbackRef.current(false);
      tokenCallbackRef.current("");
      fallbackCallbackRef.current?.("");
      return;
    }

    // 댓글은 짧은 시간 등록 제한, 중복 차단, 게시 전 안전 검수로 보호한다.
    // 외부 보안 스크립트가 멈춰 댓글 버튼까지 잠기는 문제를 피하기 위해
    // 글쓰기와 문제제보에만 Turnstile을 필수로 유지한다.
    if (action === "comment") {
      setRequired(false);
      setMessage("");
      setRetryAvailable(false);
      requiredCallbackRef.current(false);
      tokenCallbackRef.current("");
      fallbackCallbackRef.current?.("");
      return;
    }

    setRequired(true);
    setMessage("");
    setRetryAvailable(false);
    requiredCallbackRef.current(true);
    tokenCallbackRef.current("");
    fallbackCallbackRef.current?.("");

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
    let cancelled = false;
    let completed = false;
    let fallbackProof = "";
    let fallbackTimer: number | null = null;
    let fallbackRequest: AbortController | null = null;

    const clearFallbackTimer = () => {
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    };

    const enableSignedFallback = () => {
      if (cancelled || completed || action !== "post" || !fallbackProof) return false;
      completed = true;
      clearFallbackTimer();
      tokenCallbackRef.current("");
      fallbackCallbackRef.current?.(fallbackProof);
      requiredCallbackRef.current(false);
      setRequired(false);
      setMessage("");
      setRetryAvailable(false);
      if (widgetRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
      return true;
    };

    const prepareSignedFallback = async () => {
      if (action !== "post") return;
      fallbackRequest = new AbortController();
      try {
        const response = await fetch(FALLBACK_ENDPOINT, {
          method: "POST",
          cache: "no-store",
          signal: fallbackRequest.signal,
        });
        const data = await response.json() as { proof?: string; readyAfterMs?: number };
        if (cancelled || !response.ok || !data.proof) return;
        fallbackProof = data.proof;
        const delay = Math.max(1_000, Math.min(30_000, Number(data.readyAfterMs) || 8_000));
        clearFallbackTimer();
        fallbackTimer = window.setTimeout(enableSignedFallback, delay);
      } catch {
        if (!cancelled && !fallbackRequest?.signal.aborted) {
          setMessage("보안 확인 연결이 늦어지고 있습니다. 다시 확인해주세요.");
          setRetryAvailable(true);
        }
      }
    };

    const challengeUnavailable = (text: string) => {
      if (cancelled || completed) return;
      setMessage(text);
      setRetryAvailable(true);
    };

    const render = () => {
      if (cancelled || completed || !window.turnstile || !containerRef.current || widgetRef.current !== null) return;
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        appearance: "interaction-only",
        size: "flexible",
        theme: "auto",
        language: "ko",
        retry: "auto",
        "retry-interval": 8_000,
        "refresh-expired": "auto",
        "refresh-timeout": "auto",
        callback: (token: string) => {
          completed = true;
          clearFallbackTimer();
          fallbackCallbackRef.current?.("");
          tokenCallbackRef.current(token);
          setMessage("");
          setRetryAvailable(false);
        },
        "expired-callback": () => {
          completed = false;
          tokenCallbackRef.current("");
          setRetrySignal((value) => value + 1);
        },
        "timeout-callback": () => {
          tokenCallbackRef.current("");
          if (!enableSignedFallback()) challengeUnavailable("보안 확인 시간이 길어지고 있습니다. 다시 확인해주세요.");
        },
        "unsupported-callback": () => {
          tokenCallbackRef.current("");
          if (!enableSignedFallback()) challengeUnavailable("이 브라우저의 보안 확인을 다시 준비하고 있습니다.");
        },
        "error-callback": () => {
          tokenCallbackRef.current("");
          if (!enableSignedFallback()) challengeUnavailable("보안 확인 연결이 늦어지고 있습니다. 다시 확인해주세요.");
          return true;
        },
      });
    };

    const addScript = () => {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.dataset.jinjuState = "loading";
      script.addEventListener("load", () => {
        script.dataset.jinjuState = "loaded";
        render();
      });
      script.addEventListener("error", () => {
        script.dataset.jinjuState = "error";
        challengeUnavailable("보안 확인 연결이 늦어지고 있습니다. 다시 확인해주세요.");
      });
      document.head.appendChild(script);
    };

    void prepareSignedFallback();

    if (!siteKey) {
      challengeUnavailable("보안 확인 설정을 다시 준비하고 있습니다.");
    } else if (window.turnstile) {
      render();
    } else {
      const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (existing?.dataset.jinjuState === "error" || retrySignal > 0) existing?.remove();
      const activeScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (activeScript) {
        activeScript.addEventListener("load", render);
        activeScript.addEventListener("error", () => challengeUnavailable("보안 확인 연결이 늦어지고 있습니다. 다시 확인해주세요."));
      } else {
        addScript();
      }
    }

    return () => {
      cancelled = true;
      clearFallbackTimer();
      fallbackRequest?.abort();
      tokenCallbackRef.current("");
      fallbackCallbackRef.current?.("");
      if (widgetRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [action, resetSignal, retrySignal]);

  if (!required) return null;
  return (
    <div className="turnstile-challenge" aria-live="polite">
      <div ref={containerRef} />
      {message && <p role="status">{message}</p>}
      {retryAvailable && <button type="button" onClick={() => setRetrySignal((value) => value + 1)}>다시 확인</button>}
    </div>
  );
}
