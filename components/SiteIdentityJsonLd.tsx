import {
  SITE_DESCRIPTION,
  SITE_HOST,
  SITE_IDENTITY_DESCRIPTION,
  SITE_NAME,
  SITE_ORGANIZATION_ID,
  SITE_SAME_AS,
  SITE_URL,
  SITE_WEBSITE_ID,
} from "@/lib/search-indexing";

export default function SiteIdentityJsonLd() {
  const identityGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": SITE_ORGANIZATION_ID,
        name: SITE_NAME,
        alternateName: ["JINJU.KR", "진주닷케이알"],
        url: `${SITE_URL}/`,
        description: SITE_IDENTITY_DESCRIPTION,
        ...(SITE_SAME_AS.length ? { sameAs: SITE_SAME_AS } : {}),
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/jinju-pearl-cutout.png`,
        },
      },
      {
        "@type": "WebSite",
        "@id": SITE_WEBSITE_ID,
        name: SITE_NAME,
        alternateName: ["JINJU.KR", "진주닷케이알", SITE_HOST],
        url: `${SITE_URL}/`,
        description: SITE_DESCRIPTION,
        keywords: ["익명 의견", "익명 커뮤니티", "속마음", "개인정보 없는 커뮤니티"],
        ...(SITE_SAME_AS.length ? { sameAs: SITE_SAME_AS } : {}),
        inLanguage: "ko-KR",
        publisher: { "@id": SITE_ORGANIZATION_ID },
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(identityGraph).replace(/</g, "\\u003c") }} />;
}
