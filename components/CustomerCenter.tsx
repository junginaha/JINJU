"use client";

// 고객센터 문의 버튼. 화면과 페이지 소스에 메일 주소를 그대로 두지 않고,
// 누르면 문의 유형이 제목에 담긴 메일 작성 창을 엽니다.
const MAIL = ["hello", "xn--o55b9n.kr"];

export default function CustomerCenter({ topic }: { topic: string }) {
  function open(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const url = `mailto:${MAIL.join("@")}?subject=${encodeURIComponent(`[진주 고객센터] ${topic}`)}`;
    const external = (window as unknown as { __jinjuOpenExternal?: (u: string) => void }).__jinjuOpenExternal;
    if (external) external(url);
    else window.location.href = url;
  }
  return (
    <a className="customer-center" href="#" onClick={open} aria-label={`고객센터에 ${topic} 보내기`}>
      고객센터 <span aria-hidden="true">↗</span>
    </a>
  );
}
