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
- 신원을 공개하지 않고 좋아요·싫어요 중복을 막는 Semaphore 영지식 증명
- 개인정보·위험 표현을 막는 서버 안전 점검
- AI 사전 검수, 수정 권고, 운영자 승인 대기와 `/admin` 승인 화면
- 320px부터 큰 화면까지 가로 잘림을 막는 반응형 레이아웃

## 영구 저장소 연결

Vercel 프로젝트에서 **Storage → Create Database → Neon**을 선택해 연결하면 `DATABASE_URL`이 자동으로 등록됩니다. 첫 요청에서 필요한 표와 색인이 안전하게 생성됩니다. 데이터베이스를 연결하기 전에도 기본 공개 글은 표시되지만 새 글·댓글·반응 저장은 비활성화됩니다.

## 게시 전 AI 검수와 운영자 승인

Vercel 환경 변수에 `OPENAI_API_KEY`, `OPENAI_REVIEW_MODEL`, `ADMIN_REVIEW_SECRET`, `REVIEW_TOKEN_SECRET`을 등록합니다. 검수에서 문제가 없는 글은 바로 공개되고, 수정 권고를 받은 글을 사용자가 그대로 제출하면 `pending` 상태로 저장됩니다. 운영자는 `/admin`에서 `ADMIN_REVIEW_SECRET`을 입력해 승인 또는 반려할 수 있습니다. 개인정보가 포함된 글은 승인 대기로도 저장하지 않습니다.

## 실제 홍보 자동 게시

GitHub Actions가 한국시간 매일 09:30, 14:30, 20:30에 `/api/social/publish`를 호출합니다. 호출은 GitHub OIDC 서명을 검증하므로 별도 호출 비밀번호를 저장하지 않습니다.

- 최근 48시간 글 중 개인정보와 고위험 표현이 없고 반응이 좋은 글 한 편만 고릅니다.
- Instagram, Threads, 네이버 카페 가운데 공식 게시 토큰이 등록된 채널에만 게시합니다.
- YouTube는 9:16 카드와 한국어 AI 음성을 생성해 Shorts MP4를 만든 뒤 공식 업로드 API로 공개 게시합니다. 설명문에는 AI 음성 사용 사실을 표시합니다.
- `social_publications` 표에서 채널별 결과와 공개 주소를 기록해 같은 글이 중복 게시되지 않게 합니다.
- 게시 응답이 끊겨 성공 여부가 불확실하면 `unknown`으로 기록하고 자동 재시도를 멈춥니다.
- Instagram 공유 이미지는 `/api/social/card/[id]`에서 게시글별 4:5 이미지로 생성합니다.
- YouTube 세로 카드는 `/api/social/youtube/card/[id]`에서 1080×1920으로 생성합니다.

운영 환경의 비공개 Vercel 변수에 `.env.example`의 채널별 값을 등록한 뒤 `SOCIAL_PUBLISH_ENABLED=true`로 켭니다. 토큰은 저장소나 `NEXT_PUBLIC_` 변수에 넣지 않습니다.

YouTube를 켤 때는 Vercel에 `YOUTUBE_PUBLISH_ENABLED=true`, `OPENAI_TTS_MODEL`, `OPENAI_TTS_VOICE`를 등록하고 GitHub Actions 비밀값에 `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`을 등록합니다. YouTube OAuth 동의 범위는 영상 업로드 권한으로 제한합니다.
