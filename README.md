# 진주 — Next.js 프로젝트

GPT Sites의 “진주 — 비공개 담론” 디자인을 바탕으로 만든 독립 실행형 Next.js 프로젝트입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 여세요.

## GitHub 업로드

```bash
git init
git add .
git commit -m "Initial Jinju site"
git branch -M main
git remote add origin https://github.com/USER/REPOSITORY.git
git push -u origin main
```

## Vercel 배포

1. Vercel에서 **Add New → Project**를 선택합니다.
2. GitHub 저장소를 연결합니다.
3. Framework Preset은 자동으로 **Next.js**가 선택됩니다.
4. 환경 변수 `NEXT_PUBLIC_SITE_URL`에 `https://진주.kr`을 입력합니다.
5. Deploy를 누릅니다.

## 진주.kr 연결

Vercel 프로젝트의 **Settings → Domains**에서 `진주.kr`과 `www.진주.kr`을 추가한 뒤, Vercel이 안내하는 DNS 레코드를 도메인 관리업체에 등록합니다. 한글 도메인의 ASCII(Punycode) 표현은 `xn--o55b9n.kr`입니다.

## 현재 동작

- 기존 인트로, 반응형 사이드바/모바일 헤더, 의견 카드, 온도 표시
- 카테고리 필터와 검색
- 좋아요 버튼, 링크 복사
- 새 익명 의견을 현재 화면에 추가

현재 글은 브라우저 메모리에서만 유지됩니다. 실제 다중 사용자 서비스로 전환할 때는 Supabase, Neon/Postgres 등 데이터베이스와 신고·관리 API를 연결하세요.
