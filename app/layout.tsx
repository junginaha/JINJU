import type { Metadata, Viewport } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://xn--o55b9n.kr";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: "진주.kr",
  title: "진주.kr — 익명 의견 커뮤니티",
  description: "개인정보 없이 솔직한 의견과 경험을 나누는 익명 커뮤니티, 진주.kr",
  alternates: { canonical: "/" },
  keywords: ["진주.kr", "익명 커뮤니티", "익명 의견", "익명 게시판", "진실의 주둥이"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "진주.kr — 익명 의견 커뮤니티",
    description: "할 말은 하세요! 개인정보 없이 솔직한 의견을 나누는 공간",
    siteName: "진주.kr",
    url: "/",
    locale: "ko_KR",
    type: "website",
    images: ["/jinju-pearl-cutout.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "진주.kr — 익명 의견 커뮤니티",
    description: "할 말은 하세요! 개인정보 없이 솔직한 의견을 나누는 공간",
    images: ["/jinju-pearl-cutout.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/jinju-pearl-cutout.png", apple: "/jinju-pearl-cutout.png" }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "진주.kr",
    alternateName: ["진주 익명 커뮤니티", "진실의 주둥이", "xn--o55b9n.kr"],
    url: "https://xn--o55b9n.kr/",
    description: "개인정보 없이 솔직한 의견과 경험을 나누는 익명 커뮤니티",
    inLanguage: "ko-KR",
  };
  return (
    <html lang="ko">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, "\\u003c") }} />
        {children}
      </body>
    </html>
  );
}
