"use client";

import { useEffect, useRef, useState } from "react";

const SHARE_DESCRIPTION = "개인정보 없이 할 말은 하는 익명 커뮤니티";
const NOTICE_DURATION_MS = 3200;

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function findShareTarget(button: HTMLButtonElement) {
  const article = button.closest("article");
  const title = article?.querySelector("h1, h2")?.textContent?.trim() || document.title;
  const postLink = article?.querySelector<HTMLAnchorElement>('a.post-main-link[href^="/post/"]');
  const path = postLink?.getAttribute("href") || window.location.pathname;
  const url = new URL(path, window.location.origin);
  url.hash = "";
  url.searchParams.set("share", "jinju");
  return { title, url: url.toString() };
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // KakaoTalk and some in-app browsers block the modern clipboard API.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    textarea.remove();
  }
  return copied;
}

type ShareResult = "shared" | "copied" | "cancelled" | "manual";

async function runShare(title: string, url: string): Promise<ShareResult> {
  const shareData: ShareData = {
    title,
    text: SHARE_DESCRIPTION,
    url,
  };

  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
    }
  }

  const message = `${title}\n${SHARE_DESCRIPTION}\n\n${url}`;
  if (await copyText(message)) return "copied";

  window.prompt("공유할 링크입니다. 길게 눌러 복사해 주세요.", url);
  return "manual";
}

export default function ShareBridge() {
  const [notice, setNotice] = useState("");
  const busyRef = useRef(false);
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const showNotice = (message: string) => {
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
      setNotice(message);
      noticeTimerRef.current = window.setTimeout(() => {
        setNotice("");
        noticeTimerRef.current = null;
      }, NOTICE_DURATION_MS);
    };

    const handleShareClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button");
      if (!button?.querySelector(".share-label-motion")) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (busyRef.current) return;

      busyRef.current = true;
      button.setAttribute("aria-busy", "true");
      const shareTarget = findShareTarget(button);

      void runShare(shareTarget.title, shareTarget.url)
        .then((result) => {
          if (result === "shared") showNotice("공유 화면에 게시글을 전달했어요.");
          if (result === "copied") showNotice("링크를 복사했어요. 카카오톡 대화방에 붙여넣어 주세요.");
          if (result === "manual") showNotice("자동 공유가 어려워 직접 복사할 링크를 열었어요.");
        })
        .finally(() => {
          busyRef.current = false;
          button.removeAttribute("aria-busy");
        });
    };

    document.addEventListener("click", handleShareClick, true);
    return () => {
      document.removeEventListener("click", handleShareClick, true);
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  return notice ? <div className="share-feedback-toast" role="status" aria-live="polite">{notice}</div> : null;
}
