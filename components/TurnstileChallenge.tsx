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
const IN_APP_USER_AGENT = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\/|DaumApps/i;
const SCRIPT_ID = "jinju-turnstile-script";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const IN_APP_FALLBACK_MS = 10_000;

export default function TurnstileChallenge({
  action,
  resetSignal = 0,
  onToken,
  onRequiredChange,
}: {
  action: "post" | "comment" | "feedback";
  resetSignal?: number;
  onToken: (token: string) => void;
  onRequiredChange: (required: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<WidgetId | null>(null);
  const tokenCallbackRef = useRef(onToken);
  const requiredCallbackRef = useRef(onRequiredChange);
  const [required, setRequired] = useState(false);
  const [message, setMessage] = useState("");

  tokenCallbackRef.current = onToken;
  requiredCallbackRef.current = onRequiredChange;

  useEffect(() => {
    const isPublicHost = PUBLIC_HOSTS.has(window.location.hostname.toLowerCase());
    if (!isPublicHost) {
      setRequired(false);
      requiredCallbackRef.current(false);
      tokenCallbackRef.current("");
      return;
    }

    // 댓글은 짧은 시간 등록 제한, 중복 차단, 게시 전 안전 검수로 보호한다.
    // iOS 인앱 웹뷰에서 Turnstile 스크립트가 멈추면 댓글 버튼까지 영구 잠기는 문제를 피하기 위해
    // 글쓰기와 문제제보에만 Turnstile을 필수로 유지한다.
    if (action === "comment") {
      setRequired(false);
      setMessage("");
      requiredCallbackRef.current(false);
      tokenCallbackRef.current("");
      return;
    }

    const inAppPost = action === "post" && IN_APP_USER_AGENT.test(navigator.userAgent);
    setRequired(true);
    requiredCallbackRef.current(true);
    tokenCallbackRef.current("");
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
    if (!siteKey) {
      if (inAppPost) {
        setRequired(false);
        requiredCallbackRef.current(false);
        setMessage("");
      } else {
        setMessage("보안 확인 설정을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      }
      return;
    }

    let cancelled = false;
    let completed = false;
    let fallbackTimer: number | null = null;

    const clearFallbackTimer = () => {
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    };

    const enableInAppFallback = () => {
      if (cancelled || !inAppPost || completed) return false;
      completed = true;
      clearFallbackTimer();
      tokenCallbackRef.current("");
      requiredCallbackRef.current(false);
      setRequired(false);
      setMessage("");
      return true;
    };

    const render = () => {
      if (cancelled || !window.turnstile || !containerRef.current || widgetRef.current !== null) return;
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        appearance: "interaction-only",
        size: "flexible",
        theme: "auto",
        language: "ko",
        retry: "auto",
        "refresh-expired": "auto",
        callback: (token: string) => {
          completed = true;
          clearFallbackTimer();
          tokenCallbackRef.current(token);
          setMessage("");
        },
        "expired-callback": () => {
          completed = false;
          tokenCallbackRef.current("");
          setMessage("보안 확인이 만료되어 다시 확인하고 있습니다.");
        },
        "error-callback": () => {
          tokenCallbackRef.current("");
          if (!enableInAppFallback()) setMessage("보안 확인을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.");
        },
      });
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (window.turnstile) {
      render();
    } else if (existing) {
      existing.addEventListener("load", render);
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", render);
      script.addEventListener("error", () => {
        if (!enableInAppFallback()) setMessage("보안 확인을 불러오지 못했습니다. 네트워크를 확인해주세요.");
      });
      document.head.appendChild(script);
    }

    if (inAppPost) fallbackTimer = window.setTimeout(enableInAppFallback, IN_APP_FALLBACK_MS);

    return () => {
      cancelled = true;
      clearFallbackTimer();
      existing?.removeEventListener("load", render);
      tokenCallbackRef.current("");
      if (widgetRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [action]);

  useEffect(() => {
    tokenCallbackRef.current("");
    if (widgetRef.current !== null && window.turnstile) window.turnstile.reset(widgetRef.current);
  }, [resetSignal]);

  if (!required) return null;
  return (
    <div className="turnstile-challenge" aria-live="polite">
      <div ref={containerRef} />
      {message && <p role="status">{message}</p>}
    </div>
  );
}
