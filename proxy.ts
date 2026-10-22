import { NextResponse, type NextRequest } from "next/server";

// 앱인토스 미니앱(jinju) 번들은 토스 도메인에서 실행되므로, 그 두 출처에만 API 호출을 허용한다.
const TOSS_ORIGINS = new Set([
  "https://jinju.apps.tossmini.com",
  "https://jinju.private-apps.tossmini.com",
]);

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  if (!TOSS_ORIGINS.has(origin)) return NextResponse.next();
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (request.method === "OPTIONS") return new NextResponse(null, { status: 204, headers });
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
  return response;
}

export const config = { matcher: "/api/:path*" };
