import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";
import {
  canonicalUrl,
  SITE_DEFINITION,
  SITE_IDENTITY_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_ORGANIZATION_ID,
  SITE_TAGLINE,
  SITE_WEBSITE_ID,
} from "@/lib/search-indexing";

const pageTitle = `${SITE_NAME} 소개 — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: SITE_IDENTITY_DESCRIPTION,
  alternates: {
    canonical: "/about",
    languages: { "ko-KR": "/about" },
  },
  openGraph: {
    title: pageTitle,
    description: SITE_IDENTITY_DESCRIPTION,
    type: "website",
    url: "/about",
    siteName: SITE_NAME,
    locale: "ko_KR",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: SITE_IDENTITY_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
};

export default function AboutPage() {
  const aboutUrl = canonicalUrl("/about");
  const aboutPage = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${aboutUrl}#about`,
    url: aboutUrl,
    name: pageTitle,
    description: SITE_DEFINITION,
    inLanguage: "ko-KR",
    isPartOf: { "@id": SITE_WEBSITE_ID },
    about: { "@id": SITE_ORGANIZATION_ID },
  };

  // The same questions and answers shown on this page, for answer engines.
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${aboutUrl}#faq`,
    inLanguage: "ko-KR",
    mainEntity: [
      ["진주.kr은 어떤 서비스인가", `${SITE_DEFINITION} ‘${SITE_TAGLINE}’라는 이름으로 운영되며, 경상남도 진주시 및 지방자치단체의 공식 서비스와 무관한 독립 서비스입니다.`],
      ["개인정보 없이 속마음을 나누는 이유", "이름·연락처 같은 개인 식별정보를 요구하지 않아, 신분을 드러내는 부담보다 경험과 의견 자체에 집중할 수 있도록 설계했습니다. 중복 참여와 악용 방지를 위한 최소한의 기술 정보 처리 방식은 개인정보 안내에서 확인할 수 있습니다."],
      ["어떤 이야기를 나눌 수 있나요?", "일상의 발견, 관계에서 느낀 마음, 함께 읽은 책에 관한 의견을 나눌 수 있어요. 전체 글 목록에서 공개된 이야기를 살펴보세요."],
      ["운영원칙과 안전장치", "경험과 의견은 자유롭게 나누되 개인정보 노출, 괴롭힘, 명예훼손, 불법·위험한 내용은 제한합니다. 자세한 기준은 이용약관, 운영원칙과 안전안내에 공개합니다."],
    ].map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPage).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq).replace(/</g, "\\u003c") }}
      />
      <PolicyPage eyebrow="JINJU.KR · ABOUT" title="진주.kr 소개">
        <section>
          <h2>진주.kr은 어떤 서비스인가</h2>
          <p>{SITE_DEFINITION}</p>
          <p>‘{SITE_TAGLINE}’라는 이름으로 운영되며, 경상남도 진주시 및 지방자치단체의 공식 서비스와 무관한 독립 서비스입니다.</p>
        </section>
        <section>
          <h2>개인정보 없이 속마음을 나누는 이유</h2>
          <p>이름·연락처 같은 개인 식별정보를 요구하지 않아, 신분을 드러내는 부담보다 경험과 의견 자체에 집중할 수 있도록 설계했습니다. 중복 참여와 악용 방지를 위한 최소한의 기술 정보 처리 방식은 <a href="/privacy">개인정보 안내</a>에서 확인할 수 있습니다.</p>
        </section>
        <section>
          <h2>어떤 이야기를 나눌 수 있나요?</h2>
          <p>일상의 발견, 관계에서 느낀 마음, 함께 읽은 책에 관한 의견을 나눌 수 있어요. <a href="/archive">전체 글 목록</a>에서 공개된 이야기를 살펴보세요.</p>
        </section>
        <section>
          <h2>운영원칙과 안전장치</h2>
          <p>경험과 의견은 자유롭게 나누되 개인정보 노출, 괴롭힘, 명예훼손, 불법·위험한 내용은 제한합니다. 자세한 기준은 <a href="/terms">이용약관</a>, <a href="/principles">운영원칙</a>과 <a href="/safety">안전안내</a>에 공개합니다.</p>
        </section>
      </PolicyPage>
    </>
  );
}
