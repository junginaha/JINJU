"use client";

import { useEffect } from "react";

const TITLE = "익명 의견 남기기";
const SUBTITLE = "안전하게 속마음을 들려주세요.";
const BODY_PLACEHOLDER = "무슨 일이 있었는지 천천히 들려주세요.\n편한 마음으로 적으셔도 괜찮아요.";

export default function JinjuRuntimePatch() {
  useEffect(() => {
    const applyCopy = () => {
      const intro = document.querySelector<HTMLElement>(".composer-intro");
      if (intro) {
        const eyebrow = intro.querySelector<HTMLElement>(".eyebrow");
        if (eyebrow) eyebrow.hidden = true;

        const title = intro.querySelector<HTMLElement>("#write-title");
        if (title && title.textContent !== TITLE) title.textContent = TITLE;

        const paragraphs = intro.querySelectorAll<HTMLElement>("p");
        const subtitle = paragraphs[paragraphs.length - 1];
        if (subtitle && subtitle.textContent !== SUBTITLE) subtitle.textContent = SUBTITLE;
      }

      const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="의견 본문"]');
      if (textarea && textarea.placeholder !== BODY_PLACEHOLDER) textarea.placeholder = BODY_PLACEHOLDER;
    };

    applyCopy();
    const observer = new MutationObserver(applyCopy);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
