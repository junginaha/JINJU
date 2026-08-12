"use client";

import { useEffect } from "react";
import { SITE_DEFINITION } from "@/lib/search-indexing";
import JinjuApp, { type Post } from "./JinjuApp";

type JinjuAppBridgeProps = {
  initialPosts?: Post[];
  initialPostId?: string | null;
  initialTotal?: number;
};

const FEED_ACCESSIBLE_NAME = "진주 익명 의견 게시판";
const COMPOSER_TITLE = "익명 의견 남기기";
const COMPOSER_SUBTITLE = "안전하게 속마음을 들려주세요.";
const BODY_PLACEHOLDER = "무슨 일이 있었는지 천천히 들려주세요.\n편한 마음으로 적으셔도 괜찮아요.";

const feedPagerCss = `
.feed-pager-slot {
  display: flex;
  width: 100%;
  justify-content: center;
  margin: 20px 0 34px;
  padding: 0;
}
.feed-more-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 4px;
  color: #b7b7b7;
  text-align: center;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: 0;
  box-shadow: none;
  transition: color .2s ease, opacity .2s ease, transform .2s ease;
}
.feed-more-button:hover { color: #f2f2f2; transform: translateY(-1px); }
.feed-more-button:active { opacity: .72; transform: translateY(1px); }
.feed-more-button:disabled { cursor: default; opacity: .62; transform: none; }
.feed-more-button:focus-visible { outline: 1px solid #777; outline-offset: 7px; border-radius: 6px; }
.feed-more-label {
  color: transparent;
  font-size: 14px;
  font-weight: 720;
  line-height: 1;
  letter-spacing: -.025em;
  white-space: nowrap;
  background: linear-gradient(105deg, #8f8f8f 15%, #f3f3f3 48%, #aaa 72%, #8f8f8f 100%) 0 0 / 220% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: feed-more-shimmer 3.8s ease-in-out infinite;
}
.feed-more-arrow {
  display: inline-block;
  color: #c8c8c8;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  transform: translateY(-1px);
  animation: feed-more-bob 1.8s ease-in-out infinite;
}
.feed-more-button:hover .feed-more-arrow { color: #f1f1f1; }
@keyframes feed-more-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes feed-more-bob {
  0%, 100% { opacity: .62; transform: translateY(-2px); }
  50% { opacity: 1; transform: translateY(3px); }
}
@media (max-width: 640px) {
  .feed-pager-slot { margin: 16px 0 28px; }
  .feed-more-button { min-height: 42px; gap: 7px; }
  .feed-more-label { font-size: 13.5px; }
  .feed-more-arrow { font-size: 17px; }
}
@media (prefers-reduced-motion: reduce) {
  .feed-more-label {
    color: #d8d8d8;
    background: none;
    -webkit-text-fill-color: currentColor;
    animation: none;
  }
  .feed-more-arrow { animation: none; opacity: 1; transform: none; }
  .feed-more-button { transition: none; }
}
`;

/** Thin presentation compatibility boundary around the legacy JinjuApp monolith. */
export default function JinjuAppBridge({ initialPosts, initialPostId = null, initialTotal }: JinjuAppBridgeProps) {
  useEffect(() => {
    let applying = false;

    function ensureTermsLink(footer: HTMLElement) {
      if (footer.querySelector('a[href="/terms"]')) return;
      const termsLink = document.createElement("a");
      termsLink.href = "/terms";
      termsLink.textContent = "이용약관";
      const contact = footer.querySelector('a[href^="mailto:"]');
      const footerCopy = footer.querySelector("p");
      footer.insertBefore(termsLink, contact || footerCopy || null);
    }

    function applyFeedPresentation() {
      const heading = document.querySelector<HTMLElement>(".feed-heading");
      if (heading) {
        document.querySelector<HTMLElement>(".chat-main#feed")?.setAttribute("aria-label", FEED_ACCESSIBLE_NAME);
        const title = heading.querySelector<HTMLElement>("h1");
        if (title) {
          if (title.textContent !== FEED_ACCESSIBLE_NAME) title.textContent = FEED_ACCESSIBLE_NAME;
          title.hidden = true;
          title.removeAttribute("style");
        }
      }

      const privacy = document.querySelector<HTMLElement>("#search-privacy-note");
      if (privacy) {
        privacy.setAttribute("title", "이름·전화번호·주민번호·상세주소를 필수로 받지 않습니다. 자세히 보기");
        privacy.setAttribute("aria-label", "개인정보 0% 안내. 이름·전화번호·주민번호·상세주소를 필수로 받지 않습니다. 자세히 보기");
      }

      const footer = document.querySelector<HTMLElement>(".sidebar-footer");
      if (footer) {
        const footerCopy = footer.querySelector<HTMLElement>("p");
        if (footerCopy && footerCopy.textContent !== SITE_DEFINITION) footerCopy.textContent = SITE_DEFINITION;
        ensureTermsLink(footer);
      }
    }

    function applyComposerPresentation() {
      const intro = document.querySelector<HTMLElement>(".composer-intro");
      if (!intro) return;
      const eyebrow = intro.querySelector<HTMLElement>(".eyebrow");
      if (eyebrow) eyebrow.hidden = true;
      const title = intro.querySelector<HTMLElement>("#write-title");
      if (title && title.textContent !== COMPOSER_TITLE) title.textContent = COMPOSER_TITLE;
      const paragraphs = intro.querySelectorAll<HTMLElement>("p");
      const subtitle = paragraphs[paragraphs.length - 1];
      if (subtitle && subtitle.textContent !== COMPOSER_SUBTITLE) subtitle.textContent = COMPOSER_SUBTITLE;
      const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="의견 본문"]');
      if (textarea && textarea.placeholder !== BODY_PLACEHOLDER) textarea.placeholder = BODY_PLACEHOLDER;
    }

    function applyPresentation() {
      if (applying) return;
      applying = true;
      try {
        applyFeedPresentation();
        applyComposerPresentation();
      } finally {
        applying = false;
      }
    }

    applyPresentation();

    const observer = new MutationObserver(() => applyPresentation());
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", applyPresentation);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", applyPresentation);
    };
  }, [initialPostId, initialPosts?.length]);

  return (
    <>
      <style>{feedPagerCss}</style>
      <JinjuApp initialPosts={initialPosts ?? []} initialPostId={initialPostId} initialTotal={initialTotal} />
    </>
  );
}
