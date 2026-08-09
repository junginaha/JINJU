"use client";

import { useEffect, useRef } from "react";
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
const WRITE_BUTTON_LABELS = ["새 의견 쓰기", "나의 의견", "의견 쓰기", "의견 남기기"];

/**
 * Thin compatibility boundary around the legacy JinjuApp monolith.
 * Keep only presentation synchronization that cannot yet be expressed through props.
 * Business rules and feature logic must stay out of this file.
 */
export default function JinjuAppBridge({ initialPosts, initialPostId = null, initialTotal }: JinjuAppBridgeProps) {
  const totalRef = useRef(Math.max(0, initialTotal ?? initialPosts?.length ?? 0));

  useEffect(() => {
    let active = true;
    let refreshing = false;
    let countTarget: HTMLElement | null = null;
    let countObserver: MutationObserver | null = null;
    const frames = new Set<number>();

    totalRef.current = Math.max(0, initialTotal ?? initialPosts?.length ?? 0);

    function expectedCountText() {
      return `${totalRef.current}개의 공개 의견`;
    }

    async function refreshTotal() {
      if (refreshing) return;
      refreshing = true;
      try {
        const response = await fetch("/api/posts", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { total?: number };
        if (!active || !Number.isFinite(data.total)) return;
        totalRef.current = Math.max(0, Number(data.total));
        applyTotal();
      } finally {
        refreshing = false;
      }
    }

    function bindCountTarget() {
      const nextTarget = document.querySelector<HTMLElement>(".feed-heading > span");
      if (nextTarget === countTarget) return countTarget;

      countObserver?.disconnect();
      countObserver = null;
      countTarget = nextTarget;

      if (countTarget) {
        const observedTarget = countTarget;
        countObserver = new MutationObserver(() => {
          if (observedTarget.textContent !== expectedCountText()) void refreshTotal();
        });
        countObserver.observe(observedTarget, { childList: true, characterData: true, subtree: true });
      }
      return countTarget;
    }

    function applyTotal() {
      const target = bindCountTarget();
      if (target && target.textContent !== expectedCountText()) target.textContent = expectedCountText();
    }

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
      if (!heading) return false;

      const main = document.querySelector<HTMLElement>(".chat-main#feed");
      main?.setAttribute("aria-label", FEED_ACCESSIBLE_NAME);

      const title = heading.querySelector<HTMLElement>("h1");
      if (title) {
        title.textContent = FEED_ACCESSIBLE_NAME;
        title.hidden = true;
        title.removeAttribute("style");
      }

      const footer = document.querySelector<HTMLElement>(".sidebar-footer");
      if (footer) {
        const footerCopy = footer.querySelector<HTMLElement>("p");
        if (footerCopy && footerCopy.textContent !== SITE_DEFINITION) footerCopy.textContent = SITE_DEFINITION;
        ensureTermsLink(footer);
      }

      applyTotal();
      return true;
    }

    function applyComposerPresentation() {
      const intro = document.querySelector<HTMLElement>(".composer-intro");
      if (!intro) return false;

      const eyebrow = intro.querySelector<HTMLElement>(".eyebrow");
      if (eyebrow) eyebrow.hidden = true;

      const title = intro.querySelector<HTMLElement>("#write-title");
      if (title && title.textContent !== COMPOSER_TITLE) title.textContent = COMPOSER_TITLE;

      const paragraphs = intro.querySelectorAll<HTMLElement>("p");
      const subtitle = paragraphs[paragraphs.length - 1];
      if (subtitle && subtitle.textContent !== COMPOSER_SUBTITLE) subtitle.textContent = COMPOSER_SUBTITLE;

      const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="의견 본문"]');
      if (textarea && textarea.placeholder !== BODY_PLACEHOLDER) textarea.placeholder = BODY_PLACEHOLDER;
      return true;
    }

    function schedule(action: () => boolean | void, retryOnce = false) {
      const first = requestAnimationFrame(() => {
        frames.delete(first);
        if (!active) return;
        const applied = action();
        if (!retryOnce || applied !== false) return;
        const second = requestAnimationFrame(() => {
          frames.delete(second);
          if (active) action();
        });
        frames.add(second);
      });
      frames.add(first);
    }

    function syncFeed() {
      const ready = applyFeedPresentation();
      if (ready) void refreshTotal();
      return ready;
    }

    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      if (target.closest(".detail-home")) schedule(syncFeed, true);

      const button = target.closest("button");
      if (!button) return;
      const label = button.textContent?.replace(/\s+/g, " ").trim() || "";
      if (WRITE_BUTTON_LABELS.some((item) => label.includes(item))) schedule(applyComposerPresentation, true);
    }

    function handlePopState() {
      schedule(syncFeed, true);
    }

    syncFeed();
    applyComposerPresentation();
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      active = false;
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      countObserver?.disconnect();
      frames.forEach((frame) => cancelAnimationFrame(frame));
      frames.clear();
    };
  }, [initialPostId, initialPosts?.length, initialTotal]);

  return <JinjuApp initialPosts={initialPosts ?? []} initialPostId={initialPostId} />;
}
