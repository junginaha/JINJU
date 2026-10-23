// Builds the Apps in Toss web bundle (toss/dist) for 진주.kr.
// The Next.js site is not changed; its client screens are bundled as a static app
// and talk to the live 진주.kr API.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const OUT = path.join(here, "dist");
const PAGES = {
  index: "진주 | 할 말은 하세요",
  about: "진주.kr 소개 | 진주",
  beta: "정식 운영 안내 | 진주",
  principles: "운영원칙 | 진주",
  safety: "안전안내 | 진주",
  privacy: "개인정보처리방침 | 진주",
  terms: "이용약관 | 진주",
  "report-status": "문제제보 처리상태 | 진주",
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });

// Toss-only source patches, applied in memory. Each must match or the build stops.
const PATCHES = {
  "components/JinjuApp.tsx": [
    // Toss owns app branding and back navigation; retain only content actions.
    ["            <header className=\"mobile-chat-header\">\n              <button className=\"mobile-menu-button\" onClick={() => setMobileMenuOpen(true)} aria-label=\"게시판 메뉴 열기\">☰</button>\n              <a href=\"/\" aria-label=\"진주.kr 메인으로\"><Pearl size={36} /><span><strong>진주</strong><small>할 말은 하세요!</small></span></a>\n            </header>", ""],
    ["      <a href=\"/\" className=\"sidebar-brand\" aria-label=\"진주.kr 메인으로\"><Pearl size={44} /><span><strong>진주</strong><small>할 말은 하세요!</small></span></a>", ""],
    ["      <header className=\"detail-header\"><a className=\"detail-home\" href=\"/\" aria-label=\"진주.kr 메인으로 돌아가기\">← 진주.kr</a><a href=\"#comment\">댓글 쓰기</a></header>", "      <div className=\"toss-comment-entry\"><a href=\"#comment\">댓글 쓰기</a></div>"],
    ["<div><h1>새로운 의견</h1></div>", "<div className=\"toss-feed-title\"><button className=\"mobile-menu-button toss-board-menu\" type=\"button\" onClick={() => setMobileMenuOpen(true)} aria-label=\"게시판 메뉴 열기\">☰</button><h1>새로운 의견</h1></div>"],

    // Share with a Toss deep link.
    [
      "  async function share(post: Post) {\n",
      "  async function share(post: Post) {\n    { const w = window as unknown as { __jinjuTossShare?: (t: string, id: string) => Promise<string> }; if (w.__jinjuTossShare) { await w.__jinjuTossShare(post.title, post.id); return; } }\n",
    ],
    // Back from a post returns to the feed instead of stacking a new entry.
    [
      "window.history.pushState({}, \"\", `/post/${encodeURIComponent(postId)}`);",
      "window.history.pushState({ jinjuPost: postId }, \"\", `/index.html?post=${encodeURIComponent(postId)}`);",
    ],
    [
      "    window.history.pushState({}, \"\", \"/\");\n    setSelectedPostId(null);",
      "    if (window.history.state && window.history.state.jinjuPost) window.history.back(); else window.history.replaceState({}, \"\", \"/index.html\");\n    setSelectedPostId(null);",
    ],
  ],
  "components/PolicyPage.tsx": [
    ["<a href=\"/\" aria-label=\"진주.kr 메인으로\">← 진주.kr</a>", ""],
  ],
};

const tossPlugin = {
  name: "jinju-toss",
  setup(b) {
    b.onResolve({ filter: /^next\/image$/ }, () => ({ path: path.join(here, "src/next-image.tsx") }));
    b.onResolve({ filter: /(^|\/)TurnstileChallenge$/ }, () => ({ path: path.join(here, "src/TossTurnstile.tsx") }));
    b.onResolve({ filter: /(^|\/)components\/ShareBridge$|^\.\/ShareBridge$/ }, () => ({ path: path.join(here, "src/TossShareBridge.tsx") }));
    b.onLoad({ filter: /\.tsx?$/ }, (args) => {
      const rel = path.relative(ROOT, args.path).split(path.sep).join("/");
      const list = PATCHES[rel];
      if (!list) return undefined;
      let src = fs.readFileSync(args.path, "utf8");
      for (const [from, to] of list) {
        if (!src.includes(from)) throw new Error(`Toss patch not found in ${rel}: ${from.slice(0, 60)}`);
        src = src.replace(from, to);
      }
      return { contents: src, loader: "tsx" };
    });
  },
};

await build({
  entryPoints: [path.join(here, "src/main.tsx")],
  outfile: path.join(OUT, "assets/app.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2019", "safari14"],
  jsx: "automatic",
  minify: true,
  legalComments: "none",
  tsconfig: path.join(ROOT, "tsconfig.json"),
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_SITE_SAME_AS": '""',
    "process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY": '""',
  },
  banner: { js: "var process=globalThis.process||{env:{}};" },
  plugins: [tossPlugin],
  logLevel: "warning",
});

// Styles: the site's own CSS (Tailwind + globals + hotfix), unchanged.
execFileSync(path.join(ROOT, "node_modules/.bin/tailwindcss"), ["-c", "tailwind.config.ts", "-i", "app/globals.css", "-o", path.join(OUT, "assets/site.css"), "--minify"], { cwd: ROOT, stdio: "inherit" });
fs.appendFileSync(path.join(OUT, "assets/site.css"), "\n" + fs.readFileSync(path.join(ROOT, "app/production-hotfix.css"), "utf8"));
fs.copyFileSync(path.join(ROOT, "public/jinju-pearl-cutout.png"), path.join(OUT, "jinju-pearl-cutout.png"));

const css = fs.readFileSync(path.join(here, "src/toss.css"), "utf8");
fs.writeFileSync(path.join(OUT, "assets/toss.css"), css);

for (const [name, title] of Object.entries(PAGES)) {
  fs.writeFileSync(path.join(OUT, `${name}.html`), `<!doctype html>
<html lang="ko-KR" class="in-toss">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no">
<title>${title}</title>
<link rel="icon" href="/jinju-pearl-cutout.png">
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/toss.css">
</head>
<body>
<div id="root"></div>
<script src="/assets/app.js"></script>
</body>
</html>
`);
}

const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`toss bundle: ${Object.keys(PAGES).length} pages, ${(size(OUT) / 1048576).toFixed(2)} MB`);
