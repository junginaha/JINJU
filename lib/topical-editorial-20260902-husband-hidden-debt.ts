import type { EditorialPost } from "./editorial";

// 운영 내부 사실 확인용입니다. 공개 화면에는 출처 표식을 노출하지 않습니다.
export const husbandHiddenDebtResearchSources = [
  "사용자 제공 사연 이미지 10장, 2026-09-02 (개인 식별정보 없음)",
] as const;

export const husbandHiddenDebtPost: EditorialPost = {
  id: "jinju-topical-20260902-husband-hidden-debt",
  title: "남편이 숨긴 빚을 갚고, 제 가방을 하나 샀습니다",
  content: "결혼한 지 1년 반, 월요일 저녁 집에 들어오니 남편이 울면서 이혼하자고 했습니다. 월급 200만 원 남짓에서 매달 생활비 100만 원을 내고 남은 돈으로 제게 말하지 않은 빚을 갚아왔지만, 아직 2,400만 원가량 남아 제 짐이 되기 싫었다고 했어요. 저는 왜 혼자 숨겼느냐고 묻고 그날 남은 빚을 정리한 뒤, 결혼하고 옷 한 벌 제대로 사지 않은 저를 위해 192만 원짜리 가방도 하나 샀습니다. 밤새 미안하다고 우는 남편에게 이제 미안하다는 말보다 고맙다는 말을 하라고 했는데, 사랑으로 함께 갚은 건지 거짓말까지 대신 책임진 건지 마음이 복잡합니다.",
  category: "관계",
  displayName: "가방든 동반자",
  mode: "털어놓기",
  createdAt: "2026-09-02T14:48:00+09:00",
  updatedAt: "2026-09-02T14:48:00+09:00",
  heard: 0,
  same: 0,
  support: 0,
  commentCount: 0,
};
