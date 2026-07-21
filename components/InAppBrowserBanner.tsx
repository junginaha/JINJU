"use client";

import { useEffect, useState } from "react";

export default function InAppBrowserBanner() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setVisible(/KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent));
  }, []);
  if (!visible) return null;
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("주소를 복사했습니다.");
    } catch {
      setMessage("브라우저 메뉴에서 주소를 복사해주세요.");
    }
  }
  return <aside className="inapp-banner" aria-label="앱 안 브라우저 안내"><div><strong>앱 안 브라우저로 열렸습니다.</strong><p>마이크와 공유 기능이 원활하지 않을 수 있어요. 주소를 복사해 기본 브라우저에서 열어주세요.</p>{message && <span role="status">{message}</span>}</div><button type="button" onClick={copyUrl}>주소 복사</button><button className="inapp-help" type="button" onClick={() => setMessage("앱 메뉴의 ‘다른 브라우저로 열기’를 선택해주세요.")}>여는 방법</button><button className="inapp-close" type="button" onClick={() => setVisible(false)} aria-label="안내 닫기">×</button></aside>;
}
