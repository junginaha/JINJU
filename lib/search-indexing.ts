export const SITE_HOST = "xn--o55b9n.kr";
export const SITE_URL = `https://${SITE_HOST}`;
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
