// 오늘의 진주 카드에서 들어온 글(?from=pearl)은 상세 화면의 게시일을 숨깁니다.
// 오늘의 진주는 지난 글에서도 고르기 때문에, 날짜가 보이면 '오늘의' 카드와 어긋나 보입니다.
// 같은 글이라도 목록·검색·공유 링크로 들어오면 게시일은 그대로 보입니다.
export const PEARL_ENTRY_PARAM = "from";
export const PEARL_ENTRY_VALUE = "pearl";

export function pearlEntryHref(postId: string) {
  return `/post/${encodeURIComponent(postId)}?${PEARL_ENTRY_PARAM}=${PEARL_ENTRY_VALUE}`;
}

export function pearlEntryStyle(postId: string) {
  const safeId = postId.replace(/[^A-Za-z0-9_-]/g, "");
  if (!safeId) return "";
  return `.detail-post[data-post-id="${safeId}"] .post-meta time{display:none}`;
}
