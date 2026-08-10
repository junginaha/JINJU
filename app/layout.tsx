import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./production-hotfix.css";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/search-indexing";
import ShareBridge from "@/components/ShareBridge";

const baseUrl = SITE_URL;
const siteName = SITE_NAME;
const siteTitle = SITE_TITLE;
const siteDescription = SITE_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  authors: [{ name: siteName, url: baseUrl }],
  creator: siteName,
  publisher: siteName,
  category: "community",
  alternates: {
    canonical: "/",
    languages: { "ko-KR": "/" },
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  keywords: [
    "진주.kr",
    "JINJU.KR",
    "진주닷케이알",
    "진주.kr 익명 커뮤니티",
    "익명 커뮤니티",
    "익명 게시판",
    "익명 의견",
    "익명 글쓰기",
    "속마음",
    "고민 나눔",
    "직장 고민",
    "관계 고민",
    "사회 이슈",
    "개인정보 없는 커뮤니티",
  ],
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    other: {
      "naver-site-verification": "2d617f45396cbe01f3ec2d642cbec552fb64b827",
    },
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName,
    url: "/",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/jinju-pearl-cutout.png", apple: "/jinju-pearl-cutout.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko-KR">
      <body>
        <ShareBridge />
        {children}
      </body>
    </html>
  );
}
