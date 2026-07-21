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
- 원본 인트로, 익명 의견 피드, 온도 표시, 검색과 게시판 필터
- 영구 저장되는 새 의견, 댓글, 좋아요·싫어요, 공유 링크
- 개인정보·위험 표현을 막는 서버 안전 점검
- AI 사전 검수, 수정 권고, 운영자 승인 대기와 `/admin` 승인 화면
- 320px부터 큰 화면까지 가로 잘림을 막는 반응형 레이아웃

## 영구 저장소 연결

Vercel 프로젝트에서 **Storage → Create Database → Neon**을 선택해 연결하면 `DATABASE_URL`이 자동으로 등록됩니다. 첫 요청에서 필요한 표와 색인이 안전하게 생성됩니다. 데이터베이스를 연결하기 전에도 기본 공개 글은 표시되지만 새 글·댓글·반응 저장은 비활성화됩니다.

## 게시 전 AI 검수와 운영자 승인

Vercel 환경 변수에 `OPENAI_API_KEY`, `OPENAI_REVIEW_MODEL`, `ADMIN_REVIEW_SECRET`, `REVIEW_TOKEN_SECRET`을 등록합니다. 검수에서 문제가 없는 글은 바로 공개되고, 수정 권고를 받은 글을 사용자가 그대로 제출하면 `pending` 상태로 저장됩니다. 운영자는 `/admin`에서 `ADMIN_REVIEW_SECRET`을 입력해 승인 또는 반려할 수 있습니다. 개인정보가 포함된 글은 승인 대기로도 저장하지 않습니다.
