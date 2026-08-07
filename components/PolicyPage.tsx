import type { ReactNode } from "react";

export default function PolicyPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <main className="policy-page"><header><a href="/" aria-label="진주.kr 메인으로">← 진주.kr</a><p>{eyebrow}</p><h1>{title}</h1></header><div className="policy-content">{children}</div></main>;
}
