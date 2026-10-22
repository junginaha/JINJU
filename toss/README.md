# 진주.kr · 앱인토스 미니앱 (jinju)

진주.kr 사이트 화면을 그대로 정적 번들로 묶고, 데이터는 진주.kr API를 호출합니다.

```bash
npm ci            # 저장소 루트
cd toss && npm install
npm run build     # dist 생성 → jinju.ait
npx ait deploy --api-key <콘솔 API 키>
```

토스 번들에서만 달라지는 점
- `/api/*` 호출 → 진주.kr (서버 `proxy.ts`가 토스 도메인만 CORS 허용)
- 보안 확인: Turnstile 위젯(iframe) 대신 사이트의 서명 증명(`/api/security/post-fallback`) 사용
- 공유 링크: `intoss://jinju?post=<id>`, 그 링크로 들어오면 해당 글이 먼저 열림
- 글 상세에서 뒤로가기 → 피드로 복귀
- 운영 페이지(소개·약관·개인정보·운영원칙·안전·운영안내·처리상태)는 번들 안에서 열림
- 다른 사이트 링크와 메일은 외부 앱으로 열림
- 화면 확대·축소 끔
