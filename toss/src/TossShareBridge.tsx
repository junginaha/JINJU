"use client";
// Toss bundle replacement for components/ShareBridge: same buttons and notices,
// but the shared link is a Toss deep link (intoss://jinju?post=…).
import { useEffect, useRef, useState } from "react";
import { tossShare, tossShareLink } from "./bridge";

const SHARE_DESCRIPTION = "개인정보 없이 할 말은 하는 익명 커뮤니티";
const NOTICE_DURATION_MS = 3200;

function findShareTarget(button: HTMLButtonElement) {
  const article = button.closest("article");
  const title = article?.querySelector("h1, h2")?.textContent?.trim() || document.title;
  const postLink = article?.querySelector<HTMLAnchorElement>('a.post-main-link[href^="/post/"]');
  const href = postLink?.getAttribute("href") || "";
  const fromLink = href.match(/^\/post\/([^/?#]+)/);
  const fromUrl = new URLSearchParams(location.search).get("post") || location.pathname.match(/^\/post\/([^/]+)/)?.[1] || null;
  const id = fromLink ? decodeURIComponent(fromLink[1]) : fromUrl ? decodeURIComponent(fromUrl) : null;
  return { title, id };
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
  }
  const t = document.createElement("textarea");
  t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.left = "-9999px"; t.style.opacity = "0";
  document.body.appendChild(t); t.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; } finally { t.remove(); }
  return ok;
}

export async function shareJinjuPost(title: string, id: string | null) {
  const link = await tossShareLink(id);
  const message = `${title}\n${SHARE_DESCRIPTION}${link ? `\n\n${link}` : ""}`;
  if ((await tossShare(message)) === "shared") return "shared" as const;
  return (await copyText(message)) ? ("copied" as const) : ("failed" as const);
}

export default function TossShareBridge() {
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const show = (m: string) => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      setNotice(m);
      timer.current = window.setTimeout(() => { setNotice(""); timer.current = null; }, NOTICE_DURATION_MS);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button");
      if (!button?.querySelector(".share-label-motion")) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      if (busy.current) return;
      busy.current = true;
      button.setAttribute("aria-busy", "true");
      const { title, id } = findShareTarget(button);
      void shareJinjuPost(title, id)
        .then((r) => { if (r === "copied") show("링크를 복사했어요. 대화방에 붙여넣어 주세요."); })
        .finally(() => { busy.current = false; button.removeAttribute("aria-busy"); });
    };
    document.addEventListener("click", onClick, true);
    return () => { document.removeEventListener("click", onClick, true); if (timer.current !== null) window.clearTimeout(timer.current); };
  }, []);

  return notice ? <div className="share-feedback-toast" role="status" aria-live="polite">{notice}</div> : null;
}
