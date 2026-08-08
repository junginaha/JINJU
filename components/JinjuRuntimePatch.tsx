"use client";

import { useEffect } from "react";

const TITLE = "익명 의견 남기기";
const SUBTITLE = "안전하게 속마음을 들려주세요.";
const BODY_PLACEHOLDER = "무슨 일이 있었는지 천천히 들려주세요.\n편한 마음으로 적으셔도 괜찮아요.";
const WRITE_BUTTON_LABELS = ["새 의견 쓰기", "나의 의견", "의견 쓰기", "의견 남기기"];

export default function JinjuRuntimePatch() {
  useEffect(() => {
    const applyOperationCopy = () => {
      const eyebrow = document.querySelector<HTMLElement>(".feed-heading .eyebrow");
      if (eyebrow) eyebrow.textContent = "운영 중 · 개인정보 입력을 최소화합니다.";

      const notice = document.querySelector<HTMLElement>(".beta-notice");
      if (!notice) return;
      const title = notice.querySelector<HTMLElement>("strong");
      if (title) title.textContent = "운영 중";
      const detail = notice.querySelector<HTMLElement>(".beta-notice-detail");
      if (detail) detail.textContent = "실제 사용 환경을 계속 점검하며 글쓰기·검색·문제제보 흐름을 안정적으로 운영하고 있습니다.";
      const guideLink = notice.querySelector<HTMLAnchorElement>('nav a[href="/beta"]');
      if (guideLink) guideLink.textContent = "운영안내";
    };

    const applyComposerCopy = () => {
      const intro = document.querySelector<HTMLElement>(".composer-intro");
      if (!intro) return false;

      const eyebrow = intro.querySelector<HTMLElement>(".eyebrow");
      if (eyebrow) eyebrow.hidden = true;

      const title = intro.querySelector<HTMLElement>("#write-title");
      if (title && title.textContent !== TITLE) title.textContent = TITLE;

      const paragraphs = intro.querySelectorAll<HTMLElement>("p");
      const subtitle = paragraphs[paragraphs.length - 1];
      if (subtitle && subtitle.textContent !== SUBTITLE) subtitle.textContent = SUBTITLE;

      const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="의견 본문"]');
      if (textarea && textarea.placeholder !== BODY_PLACEHOLDER) textarea.placeholder = BODY_PLACEHOLDER;
      return true;
    };

    let observer: MutationObserver | null = null;
    let timeout: number | null = null;

    const stopWatching = () => {
      observer?.disconnect();
      observer = null;
      if (timeout !== null) window.clearTimeout(timeout);
      timeout = null;
    };

    const watchForComposerOnce = () => {
      stopWatching();
      if (applyComposerCopy()) return;
      observer = new MutationObserver(() => {
        if (applyComposerCopy()) stopWatching();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      timeout = window.setTimeout(stopWatching, 1500);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("button") : null;
      if (!target) return;
      const label = target.textContent?.replace(/\s+/g, " ").trim() || "";
      if (!WRITE_BUTTON_LABELS.some((item) => label.includes(item))) return;
      queueMicrotask(watchForComposerOnce);
    };

    applyOperationCopy();
    applyComposerCopy();
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      stopWatching();
    };
  }, []);

  return null;
}
