import type { EditorialComment } from "./editorial";

const comment = (
  postId: string,
  index: number,
  displayName: string,
  body: string,
  createdAt: string,
): EditorialComment => ({
  id: `popular-0816-${postId}-${index}`,
  displayName,
  body,
  createdAt,
});

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-daily-20260815-phone-only-restaurant-order": [
    comment("jinju-daily-20260815-phone-only-restaurant-order", 1, "배터리 경보", "폰 2퍼센트 남았는데 주문하려고 인증까지 하라면 밥보다 충전기가 먼저 나와야 합니다 ㅋㅋ", "2026-08-16T15:40:00+09:00"),
    comment("jinju-daily-20260815-phone-only-restaurant-order", 2, "부모님 메뉴", "부모님 모시고 가면 결국 제가 네 사람 메뉴를 한 화면에서 대신 고르게 됩니다. 디지털 주문이 편하려면 ‘직원에게 주문하기’도 같은 크기로 보여야 해요.", "2026-08-16T15:44:00+09:00"),
    comment("jinju-daily-20260815-phone-only-restaurant-order", 3, "QR 초보", "QR 자체는 괜찮아요. 가입만 시키지 마세요.", "2026-08-16T15:49:00+09:00"),
    comment("jinju-daily-20260815-phone-only-restaurant-order", 4, "식당 사장", "작은 가게 입장에선 주문 누락이 줄고 메뉴판 수정비도 아끼는 장점이 큽니다. 대신 손님이 막히는 순간 바로 사람이 받아줄 수 있어야 기술 때문에 서비스가 느려지는 역전은 피할 수 있겠죠.", "2026-08-16T15:55:00+09:00"),
    comment("jinju-daily-20260815-phone-only-restaurant-order", 5, "메뉴 유목민", "밥 먹으러 와서 회원가입 약관부터 읽는 순간 입맛이 로그아웃됩니다.", "2026-08-16T16:01:00+09:00"),
    comment("jinju-daily-20260815-phone-only-restaurant-order", 6, "접근성 눈", "화면 확대가 필요한 분, 손이 떨리는 분, 데이터가 없는 여행객까지 생각하면 한 방식만 남기는 건 효율이 아니라 출입문을 하나 줄이는 일입니다.", "2026-08-16T16:08:00+09:00"),
    comment("jinju-daily-20260815-phone-only-restaurant-order", 7, "주문 평화", "QR도 좋고 사람도 좋습니다. 둘이 싸우지 말고 같이 일했으면 좋겠어요.", "2026-08-16T16:14:00+09:00"),
  ],
  "jinju-morning-20260815-deepfake-ai-surveillance": [
    comment("jinju-morning-20260815-deepfake-ai-surveillance", 1, "오판 체크", "탐지율 99퍼센트보다 남은 1퍼센트가 누구에게 떨어지는지가 중요합니다. 진짜 영상을 가짜로 막았을 때 빠르게 풀어줄 사람과 절차가 꼭 있어야 해요.", "2026-08-16T15:42:00+09:00"),
    comment("jinju-morning-20260815-deepfake-ai-surveillance", 2, "영상 엄마", "피해 영상은 한 번 퍼지면 삭제 속도가 늘 늦습니다. 자동 탐지는 필요하다고 봐요.", "2026-08-16T15:48:00+09:00"),
    comment("jinju-morning-20260815-deepfake-ai-surveillance", 3, "풍자 친구", "AI가 제 농담을 범죄 현장으로 오해하지 않게 풍자·패러디 표시도 같이 발전했으면 합니다 ㅋㅋ", "2026-08-16T15:54:00+09:00"),
    comment("jinju-morning-20260815-deepfake-ai-surveillance", 4, "삭제 이후", "탐지만 잘한다고 끝이 아니죠. 피해자가 여러 플랫폼에 같은 설명을 열 번 하지 않도록 신고·증거보존·삭제 요청을 한 번에 이어주는 쪽이 실제 도움은 더 클 겁니다.", "2026-08-16T16:02:00+09:00"),
    comment("jinju-morning-20260815-deepfake-ai-surveillance", 5, "얼굴 주권", "잡겠다고 모은 얼굴 데이터가 또 다른 감시 데이터가 되지만 않았으면 합니다.", "2026-08-16T16:10:00+09:00"),
    comment("jinju-morning-20260815-deepfake-ai-surveillance", 6, "출처 도장", "가짜를 잡는 기술만큼 진짜가 어디서 만들어졌는지 증명하는 기술도 중요해 보여요. 의심만 늘리는 인터넷보다 확인할 길이 있는 인터넷이 낫습니다.", "2026-08-16T16:17:00+09:00"),
  ],
  "jinju-daily-20260815-club-dues-refund": [
    comment("jinju-daily-20260815-club-dues-refund", 1, "회비 탈출", "사람은 모임에서 탈퇴했는데 돈은 계속 정회원이면 좀 이상하긴 합니다 ㅋㅋ", "2026-08-16T15:46:00+09:00"),
    comment("jinju-daily-20260815-club-dues-refund", 2, "정산 엑셀", "잔액에서 이미 확정된 공동지출을 빼고, 남은 돈을 어떤 기준으로 나눌지 전원이 보는 자리에서 계산하면 감정싸움이 많이 줄어듭니다. 이번 일을 계기로 탈퇴·해산 규칙을 한 줄이라도 적어두세요.", "2026-08-16T15:53:00+09:00"),
    comment("jinju-daily-20260815-club-dues-refund", 3, "소액 친구", "만원이면 그냥 두고 나오겠지만 백만원이면 갑자기 우정에도 회계팀이 필요합니다.", "2026-08-16T16:00:00+09:00"),
    comment("jinju-daily-20260815-club-dues-refund", 4, "전직 총무", "총무 해보면 ‘다 같이 쓴 돈’과 ‘그냥 통장에 남은 돈’이 전혀 다르다는 걸 알게 됩니다. 영수증과 예정 지출만 공개해도 절반은 해결돼요.", "2026-08-16T16:07:00+09:00"),
    comment("jinju-daily-20260815-club-dues-refund", 5, "우정 규칙", "돈 때문에 친구를 잃는 게 아니라 돈 이야기를 금기시해서 잃는 경우도 많더라고요.", "2026-08-16T16:15:00+09:00"),
  ],
  "jinju-daily-20260815-neighbor-delivery-moved": [
    comment("jinju-daily-20260815-neighbor-delivery-moved", 1, "복도 주민", "저라면 고맙다고 하고 다음엔 메시지만 달라고 했을 것 같아요. 선의와 경계는 동시에 말할 수 있습니다.", "2026-08-16T15:50:00+09:00"),
    comment("jinju-daily-20260815-neighbor-delivery-moved", 2, "배송 사진", "택배 사진과 실제 위치가 다르면 순간 심장이 철렁합니다. 옮겼다면 문 앞에 메모 한 장이 거의 모든 오해를 막아줘요.", "2026-08-16T15:58:00+09:00"),
    comment("jinju-daily-20260815-neighbor-delivery-moved", 3, "비구름 친구", "비는 막았고 오해는 젖었습니다 ㅋㅋ 다음엔 상자보다 메모를 먼저 움직이세요.", "2026-08-16T16:06:00+09:00"),
    comment("jinju-daily-20260815-neighbor-delivery-moved", 4, "경계 연습", "한 번 경계를 들었으면 다음부터는 그대로 두는 게 맞습니다. 좋은 사람이라는 걸 증명하려고 두 번째 친절까지 밀어붙일 필요는 없어요.", "2026-08-16T16:13:00+09:00"),
  ],
  "jinju-morning-20260815-fast-housing-strong-review": [
    comment("jinju-morning-20260815-fast-housing-strong-review", 1, "입주 시계", "빨리 짓는 것보다 어디서 시간이 낭비되는지 공개했으면 합니다. 안전검토 3개월을 줄이는 것과 같은 서류를 세 부처가 돌려보는 3개월을 줄이는 건 전혀 다른 이야기니까요.", "2026-08-16T15:52:00+09:00"),
    comment("jinju-morning-20260815-fast-housing-strong-review", 2, "통근 계산", "집만 먼저 생기고 학교랑 지하철이 몇 년 뒤에 오면 입주자는 매일 공사 중인 삶을 삽니다.", "2026-08-16T16:04:00+09:00"),
    comment("jinju-morning-20260815-fast-housing-strong-review", 3, "서류 다이어트", "검증은 남기고 서류만 살 빼주세요. 행정도 건강검진은 받고 군살만 빼면 됩니다 ㅋㅋ", "2026-08-16T16:12:00+09:00"),
  ],
};

export function august16PopularComments(id: string) {
  return COMMENTS[id] ?? [];
}
