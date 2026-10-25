/*
 * 진주.kr — Apps in Toss bridge (Toss bundle only).
 * The bundle runs on jinju.apps.tossmini.com, so:
 *  - /api/* calls go to 진주.kr
 *  - site pages (/about, /terms …) resolve to bundled .html files
 *  - links to 진주.kr stay inside the mini app, other sites open in the external browser
 *  - share links use the Toss deep link intoss://jinju
 */
import { Device, Share, getTossShareLink, openURL as legacyOpenURL } from "@apps-in-toss/web-framework";

export const SITE = "https://xn--o55b9n.kr";
export const APP = "jinju";
const SITE_HOSTS = new Set(["xn--o55b9n.kr", "www.xn--o55b9n.kr", "진주.kr", "www.진주.kr", "jinju-two.vercel.app"]);
const PAGES: Record<string, string> = {
  "/": "/index.html",
  "/about": "/about.html",
  "/beta": "/beta.html",
  "/principles": "/principles.html",
  "/safety": "/safety.html",
  "/privacy": "/privacy.html",
  "/terms": "/terms.html",
  "/report-status": "/report-status.html",
};

const isApi = (p: string) => p.startsWith("/api/");
const nativeFetch = window.fetch.bind(window);
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  try {
    if (typeof input === "string" && isApi(input)) input = SITE + input;
    else if (input instanceof URL && input.origin === location.origin && isApi(input.pathname)) input = SITE + input.pathname + input.search;
    else if (input instanceof Request) {
      const u = new URL(input.url);
      if (u.origin === location.origin && isApi(u.pathname)) input = new Request(SITE + u.pathname + u.search, input);
    }
  } catch {}
  return nativeFetch(input, init);
} as typeof window.fetch;

export function openExternal(url: string) {
  const fn = (Device && Device.openURL) || legacyOpenURL;
  Promise.resolve()
    .then(() => fn(url))
    .catch(() => { try { window.location.href = url; } catch {} });
}

// 고객센터 버튼(components/CustomerCenter)이 메일 앱을 토스 밖에서 열 때 씁니다.
(window as unknown as { __jinjuOpenExternal: typeof openExternal }).__jinjuOpenExternal = openExternal;

export function bundleUrl(u: URL): string | null {
  const path = u.pathname.replace(/\/+$/, "") || "/";
  if (PAGES[path]) return PAGES[path] + u.search + u.hash;
  const post = path.match(/^\/post\/([^/]+)$/);
  if (post) return "/index.html?post=" + post[1] + (u.searchParams.get("from") === "pearl" ? "&from=pearl" : "");
  if (/\.html$/.test(path)) return path + u.search + u.hash;
  return null;
}

// Bubble phase: React handlers that already called preventDefault (in-app post links) keep working.
window.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey) return;
  const a = (e.target as Element | null)?.closest?.("a");
  if (!a) return;
  const raw = a.getAttribute("href");
  if (!raw || raw.startsWith("#") || raw.startsWith("javascript:")) return;
  let u: URL;
  try { u = new URL(raw, location.href); } catch { return; }
  if (u.protocol === "mailto:" || u.protocol === "tel:") { e.preventDefault(); openExternal(u.href); return; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return;
  if (u.origin === location.origin || SITE_HOSTS.has(u.hostname)) {
    if (u.origin === location.origin && u.pathname === location.pathname && u.search === location.search && u.hash) return;
    const next = bundleUrl(u);
    e.preventDefault();
    if (next) location.href = next;
    return;
  }
  e.preventDefault();
  openExternal(u.href);
});

export async function tossShareLink(postId?: string | null) {
  const path = "intoss://" + APP + (postId ? "?post=" + encodeURIComponent(postId) : "");
  try {
    return Share && Share.createLink ? await Share.createLink({ path }) : await getTossShareLink(path);
  } catch {
    return "";
  }
}

export async function tossShare(message: string) {
  try {
    if (Share && Share.sendMessage) { await Share.sendMessage({ message }); return "shared" as const; }
  } catch {}
  return "failed" as const;
}

document.documentElement.classList.add("in-toss");
