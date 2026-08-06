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

const PUBLIC_HOSTS = new Set(["xn--o55b9n.kr", "www.xn--o55b9n.kr"]);
const SCRIPT_ID = "jinju-turnstile-script";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

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

    setRequired(true);
    requiredCallbackRef.current(true);
    tokenCallbackRef.current("");
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
    if (!siteKey) {
      setMessage("보안 확인 설정을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    let cancelled = false;
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
          tokenCallbackRef.current(token);
          setMessage("");
        },
        "expired-callback": () => {
          tokenCallbackRef.current("");
          setMessage("보안 확인이 만료되어 다시 확인하고 있습니다.");
        },
        "error-callback": () => {
          tokenCallbackRef.current("");
          setMessage("보안 확인을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.");
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
      script.addEventListener("error", () => setMessage("보안 확인을 불러오지 못했습니다. 네트워크를 확인해주세요."));
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
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
