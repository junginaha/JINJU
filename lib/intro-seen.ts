// 인트로를 이미 본 방문자는 첫 화면이 그려지기 전에 인트로를 숨깁니다.
// 처음 방문한 사람은 글 목록보다 인트로가 먼저 보이고, 다시 온 사람에게는 인트로가 깜빡이지 않습니다.
export const INTRO_SEEN_KEY = "jinju-intro-seen-v1";
export const INTRO_SEEN_CLASS = "jinju-intro-seen";
export const INTRO_SEEN_SCRIPT = `try{if(sessionStorage.getItem("${INTRO_SEEN_KEY}")&&!/[?&]intro=1(&|$)/.test(location.search))document.documentElement.classList.add("${INTRO_SEEN_CLASS}")}catch(e){}`;

export function markIntroSeenBeforePaint() {
  try {
    if (sessionStorage.getItem(INTRO_SEEN_KEY) && !/[?&]intro=1(&|$)/.test(location.search)) document.documentElement.classList.add(INTRO_SEEN_CLASS);
  } catch {}
}
