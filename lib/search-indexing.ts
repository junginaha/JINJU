export const SITE_HOST = "xn--o55b9n.kr";
export const SITE_URL = `https://${SITE_HOST}`;
export const SITE_NAME = "진주.kr";
export const SITE_TAGLINE = "진실의 주둥이";
export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE} | 익명 의견 커뮤니티`;
export const SITE_DESCRIPTION =
  `${SITE_NAME}은 개인정보를 요구하지 않고 속마음과 의견을 나누는 한국어 익명 의견 커뮤니티입니다.`;
export const SITE_IDENTITY_DESCRIPTION =
  `${SITE_DESCRIPTION} 경상남도 진주시의 공식 웹사이트와 관련 없는 독립 서비스입니다.`;
export const SITE_ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const SITE_WEBSITE_ID = `${SITE_URL}/#website`;
export const INDEXNOW_KEY = "e2df7f4f1f76295063b8c4894b9632b3";

export function canonicalUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export async function notifySearchIndexes(paths: string[]) {
  const urlList = [...new Set(paths.map(canonicalUrl))];
  if (!urlList.length) return;

  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: canonicalUrl(`/${INDEXNOW_KEY}.txt`),
        urlList,
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (![200, 202].includes(response.status)) {
      console.warn("IndexNow notification was not accepted", response.status);
    }
  } catch (error) {
    console.warn("IndexNow notification failed", error);
  }
}
