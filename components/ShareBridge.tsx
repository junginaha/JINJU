"use client";

import { useEffect } from "react";

const SHARE_DESCRIPTION = "개인정보 없이 할 말은 하는 익명 커뮤니티";

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

async function runShare(title: string, url: string) {
  const shareData: ShareData = {
    title,
    text: SHARE_DESCRIPTION,
    url,
  };

  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (isAbortError(error)) return;
    }
  }

  const message = `${title}\n${SHARE_DESCRIPTION}\n\n${url}`;
  if (await copyText(message)) {
    window.alert("공유 링크를 복사했습니다. 카카오톡 대화방에 붙여넣어 주세요.");
    return;
  }

  window.prompt("공유할 링크입니다. 길게 눌러 복사해 주세요.", url);
}

export default function ShareBridge() {
  useEffect(() => {
    const handleShareClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button");
      if (!button?.querySelector(".share-label-motion")) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const shareTarget = findShareTarget(button);
      void runShare(shareTarget.title, shareTarget.url);
    };

    document.addEventListener("click", handleShareClick, true);
    return () => document.removeEventListener("click", handleShareClick, true);
  }, []);

  return null;
}
