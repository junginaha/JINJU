import type { EditorialComment } from "./editorial";

export const AUGUST10_TOP_COMMENT_POST_IDS = [
  "jinju-morning-20260810-used-clothing-market",
  "jinju-morning-20260810-ai-sea-rescue",
  "jinju-morning-20260810-vote-log-transparency",
  "jinju-seed-20260809-bookclub-unfinished",
  "1m4m5c2q5x121a066u5v",
  "jinju-morning-20260809-football-association-investigation",
  "jinju-seed-20260809-free-trial-cancel",
  "jinju-morning-20260809-national-ai-public-evaluation",
  "jinju-morning-20260809-trees-over-parking",
  "jinju-seed-20260809-meeting-opposition-alternative",
] as const;

const comment = (
  postId: string,
  index: number,
  displayName: string,
  body: string,
  createdAt: string,
): EditorialComment => ({
  id: `fresh-0810-top-${postId}-${index}`,
  displayName,
  body,
  createdAt,
});

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-morning-20260810-used-clothing-market": [
    comment("jinju-morning-20260810-used-clothing-market", 1, "상태 기록", "판매 전 오염 위치와 실측 치수를 같은 양식으로 기록하면 거래 뒤 다툼을 줄일 수 있어요. 플랫폼 규모보다 상태 기준이 누구에게나 똑같이 적용되는지가 더 중요합니다.", "2026-08-10T18:00:00+09:00"),
    comment("jinju-morning-20260810-used-clothing-market", 2, "순환 소비", "중고 옷까지 유행 주기를 빠르게 돌리면 친환경이라는 이름으로 소비량만 늘 수도 있습니다. 얼마나 많이 파느냐보다 한 벌을 얼마나 오래 입게 하느냐도 평가해야 해요.", "2026-08-10T18:03:00+09:00"),
    comment("jinju-morning-20260810-used-clothing-market", 3, "알고리즘 옷장", "셔츠 한 벌만 보러 갔는데 추천 목록이 제 옷장보다 풍성해졌습니다. 중고 소비를 시작했더니 택배기사님만 새 식구가 됐네요.", "2026-08-10T18:06:00+09:00"),
    comment("jinju-morning-20260810-used-clothing-market", 4, "골목 단골", "작은 가게가 기억해주는 취향과 체형은 대형 플랫폼이 쉽게 대신하기 어려워요. 두 방식이 경쟁하면서도 수선점과 지역 가게까지 함께 살아남았으면 합니다.", "2026-08-10T18:09:00+09:00"),
  ],
  "jinju-morning-20260810-ai-sea-rescue": [
    comment("jinju-morning-20260810-ai-sea-rescue", 1, "구조 동선", "위험 구역을 빨리 찾아도 경고를 누가 확인하고 몇 분 안에 움직일지가 정해져 있지 않으면 소용이 없습니다. 장비 도입과 함께 현장 대응 절차를 반복해서 훈련해야 해요.", "2026-08-10T18:12:00+09:00"),
    comment("jinju-morning-20260810-ai-sea-rescue", 2, "예산 체온", "새 시스템의 성과는 화면의 정확도보다 실제 사고와 구조시간이 얼마나 줄었는지로 평가해야 합니다. 설치비는 눈에 잘 보이지만 유지비와 인력의 피로는 예산표에서 쉽게 작아지거든요.", "2026-08-10T18:15:00+09:00"),
    comment("jinju-morning-20260810-ai-sea-rescue", 3, "통신 표류", "인공지능이 표류 경로는 찾았는데 통신이 먼저 표류하면 곤란합니다. 연결이 끊겨도 현장 장비가 작동하는지 여름마다 실제 바다에서 시험했으면 해요.", "2026-08-10T18:18:00+09:00"),
    comment("jinju-morning-20260810-ai-sea-rescue", 4, "그늘 교대", "안전요원도 폭염 속에서 집중력을 오래 유지하기 어려운 사람입니다. 인원을 늘리는 것과 함께 충분한 교대와 휴식까지 마련해야 모두가 안전해져요.", "2026-08-10T18:21:00+09:00"),
  ],
  "jinju-morning-20260810-vote-log-transparency": [
    comment("jinju-morning-20260810-vote-log-transparency", 1, "감사 설계", "기록을 공개한다면 수정 전후 값과 시각뿐 아니라 수정 사유를 표준 항목으로 함께 남기는 방식이 도움이 됩니다. 개인정보나 보안 정보는 가리고 선거가 끝난 뒤 검증 가능한 형태로 제공할 수 있어요.", "2026-08-10T18:24:00+09:00"),
    comment("jinju-morning-20260810-vote-log-transparency", 2, "맥락 우선", "숫자가 바뀐 흔적만 보여주면 정상적인 오타 수정도 의혹의 재료가 될 수 있습니다. 투명성은 자료의 양보다 변화의 이유를 이해할 수 있게 만드는 데서 시작합니다.", "2026-08-10T18:27:00+09:00"),
    comment("jinju-morning-20260810-vote-log-transparency", 3, "숫자 야근", "엑셀 한 칸을 고쳤을 뿐인데 전국적인 추리극의 용의자가 될 수도 있겠네요. 로그에는 수정 사유와 함께 당시 담당자의 식사 여부도 적어야 할 분위기입니다.", "2026-08-10T18:30:00+09:00"),
    comment("jinju-morning-20260810-vote-log-transparency", 4, "현장 보호", "검증 가능한 기록은 유권자의 불안을 줄이는 동시에 성실하게 일한 현장 담당자를 지켜줍니다. 무조건 의심하거나 무조건 믿기보다 확인할 수 있는 절차를 만드는 편이 서로에게 다정해요.", "2026-08-10T18:33:00+09:00"),
  ],
  "jinju-seed-20260809-bookclub-unfinished": [
    comment("jinju-seed-20260809-bookclub-unfinished", 1, "참여 표시", "신청할 때 완독 중심 회차와 중간 참여 가능 회차를 구분하면 서로의 기대가 어긋나는 일을 줄일 수 있어요. 읽은 범위도 미리 알려주면 내용 누설 없이 대화 수준을 맞추기 쉽습니다.", "2026-08-10T18:36:00+09:00"),
    comment("jinju-seed-20260809-bookclub-unfinished", 2, "발언 균형", "마지막 장까지 읽었는지가 좋은 참여자를 결정하지는 않습니다. 다만 적게 읽은 사람이 대화를 오래 독점한다면 완독 여부보다 발언 태도가 문제예요.", "2026-08-10T18:39:00+09:00"),
    comment("jinju-seed-20260809-bookclub-unfinished", 3, "가방 독서", "일주일 동안 책을 가방에 넣고 다녀서 표지는 저보다 출근을 많이 했습니다. 내용은 아직 낯설지만 어깨는 작품의 무게를 깊이 이해했어요.", "2026-08-10T18:42:00+09:00"),
    comment("jinju-seed-20260809-bookclub-unfinished", 4, "늦은 독자", "다 읽지 못했다면 그날은 질문을 모으거나 대화를 기록하는 역할로 참여해도 좋겠습니다. 준비가 덜 된 미안함을 말의 양으로 갚지 않으면 모임에도 충분히 보탬이 돼요.", "2026-08-10T18:45:00+09:00"),
  ],
  "1m4m5c2q5x121a066u5v": [
    comment("1m4m5c2q5x121a066u5v", 1, "문장 독자", "익명이라도 말의 책임은 사라지지 않으니, 주장과 경험을 구분해 쓰고 틀린 정보는 고칠 수 있어야 합니다. 독자도 작성자의 정체보다 문장이 누구를 배제하거나 환대하는지 살피면 좋겠어요.", "2026-08-10T18:48:00+09:00"),
    comment("1m4m5c2q5x121a066u5v", 2, "편견 거울", "여성적인 문장과 남성적인 문장보다 다정한 문장과 무례한 문장을 구분하는 편이 훨씬 쓸모 있어 보입니다. 익명 게시판의 성별은 모르겠지만 댓글창의 온도는 읽는 순간 바로 알겠더라고요.", "2026-08-10T18:51:00+09:00"),
    comment("1m4m5c2q5x121a066u5v", 3, "장바구니 탐정", "댓글 몇 줄로 성별을 맞힐 수 있다면 제 장바구니는 이미 저를 중년 남성, 여고생, 캠핑광으로 번갈아 판정했을 겁니다. 사람의 말은 생각보다 옷장이 넓어요.", "2026-08-10T18:54:00+09:00"),
    comment("1m4m5c2q5x121a066u5v", 4, "익명 이웃", "익명이라면 배경 설명 없이 짧게 말하는 사람도 있고 오래 망설여 길게 쓰는 사람도 있습니다. 서로의 정체를 모르니 단정 대신 확인 질문 하나를 남기는 습관이 더 중요해 보여요.", "2026-08-10T18:57:00+09:00"),
  ],
  "jinju-morning-20260809-football-association-investigation": [
    comment("jinju-morning-20260809-football-association-investigation", 1, "절차 메모", "독립조사를 한다면 조사위원 선정 기준, 조사 범위, 이해충돌 여부와 결과 공개 시점을 먼저 정해야 합니다. 사과 뒤에 이 네 가지가 보이면 쇄신이 절차로 넘어갔는지 판단하기 쉬워져요.", "2026-08-10T19:00:00+09:00"),
    comment("jinju-morning-20260809-football-association-investigation", 2, "약속 검증", "재발 방지는 앞으로의 약속이고 독립조사는 과거 사실을 확인하는 절차라 서로 대신할 수 없습니다. 무엇이 있었는지 모른 채 규정만 새로 쓰면 책임의 빈칸까지 새 문서로 덮을 수 있어요.", "2026-08-10T19:03:00+09:00"),
    comment("jinju-morning-20260809-football-association-investigation", 3, "느린 화면", "그라운드에서는 발끝 하나도 비디오로 돌려보는데 행정은 사과문 한 장으로 경기 종료가 되면 곤란하죠. 쇄신에도 느린 화면과 제3의 심판이 필요해 보입니다.", "2026-08-10T19:06:00+09:00"),
    comment("jinju-morning-20260809-football-association-investigation", 4, "오래된 팬", "오랫동안 응원한 팬일수록 의혹 자체보다 또 흐지부지될까 봐 더 지치는 것 같습니다. 사실이 확인되면 책임지고 아니라면 근거를 공개해 모두가 의심에서 내려올 수 있게 해주세요.", "2026-08-10T19:09:00+09:00"),
  ],
  "jinju-seed-20260809-free-trial-cancel": [
    comment("jinju-seed-20260809-free-trial-cancel", 1, "결제 지도", "앱스토어의 구독 관리 화면이나 처음 받은 결제 메일부터 살피면 취소 경로를 조금 빨리 찾을 수 있습니다. 회사도 첫 결제 전에 금액과 주기, 취소 위치를 한 화면에 보여줘야 공정해요.", "2026-08-10T19:12:00+09:00"),
    comment("jinju-seed-20260809-free-trial-cancel", 2, "신뢰 잔액", "해지를 어렵게 만든 매출은 만족해서 남은 고객의 매출과 성격이 다릅니다. 포기할 때까지 붙잡는 설계는 전환율을 높일지 몰라도 신뢰의 해지율도 함께 높여요.", "2026-08-10T19:15:00+09:00"),
    comment("jinju-seed-20260809-free-trial-cancel", 3, "해지 탈출", "무료 체험에 들어갈 때는 손가락 한 번인데 나오려니 비밀번호, 지도, 체력까지 요구하더군요. 해지하고 나면 서비스를 쓴 성취감보다 방탈출에 성공한 뿌듯함이 더 큽니다.", "2026-08-10T19:18:00+09:00"),
    comment("jinju-seed-20260809-free-trial-cancel", 4, "놓친 하루", "결제일을 놓쳤다고 너무 자책하지 마세요. 사람이 잊는 순간을 노린 화면이라면 개인의 부주의만이 아니라 설계의 책임도 함께 물어야 합니다.", "2026-08-10T19:21:00+09:00"),
  ],
  "jinju-morning-20260809-national-ai-public-evaluation": [
    comment("jinju-morning-20260809-national-ai-public-evaluation", 1, "체험 설계", "일반인 평가는 브랜드를 가리고 같은 과제와 제한시간을 줘야 비교가 됩니다. 사용 편의는 시민이, 보안과 오류율은 전문가가 따로 채점한 뒤 합치면 더 납득하기 쉬워요.", "2026-08-10T19:24:00+09:00"),
    comment("jinju-morning-20260809-national-ai-public-evaluation", 2, "성능 너머", "인기투표는 친숙함을 잘 재지만 공공 시스템의 책임까지 대신 판단하지는 못합니다. 누가 뽑느냐보다 평가표와 탈락 사유를 공개하는지가 신뢰를 더 크게 좌우할 것 같아요.", "2026-08-10T19:27:00+09:00"),
    comment("jinju-morning-20260809-national-ai-public-evaluation", 3, "국민 면접관", "AI도 면접관이 200명이면 말투부터 갑자기 공손해질 것 같습니다. 재치 있는 답보다 모르는 것을 모른다고 말하는 후보에게 점수를 더 주고 싶네요.", "2026-08-10T19:30:00+09:00"),
    comment("jinju-morning-20260809-national-ai-public-evaluation", 4, "느린 사용자", "기술에 익숙하지 않은 사람의 막힘도 성능의 일부로 봐야 합니다. 연령과 장애, 지역을 고르게 반영한 체험단이라면 국민 평가가 꽤 따뜻한 안전장치가 될 수 있어요.", "2026-08-10T19:33:00+09:00"),
  ],
  "jinju-morning-20260809-trees-over-parking": [
    comment("jinju-morning-20260809-trees-over-parking", 1, "그늘 지도", "나무 수만 세기보다 한낮 보행로에 실제 그늘이 얼마나 이어지는지 지도로 확인하면 좋겠습니다. 병원과 학교, 버스정류장 주변부터 심으면 적은 변화도 체감이 클 거예요.", "2026-08-10T19:36:00+09:00"),
    comment("jinju-morning-20260809-trees-over-parking", 2, "자리 계산", "주차면과 녹지를 한꺼번에 맞바꾸는 방식이면 주민끼리 손해만 비교하게 됩니다. 낮에 비는 공간, 짧은 정차 수요, 보행량을 시간대별로 재면 줄여도 되는 자리가 먼저 보일 수 있어요.", "2026-08-10T19:39:00+09:00"),
    comment("jinju-morning-20260809-trees-over-parking", 3, "여름 보행", "자동차는 에어컨이라도 켜지만 걷는 사람에게는 가로수가 유일한 지붕일 때가 있습니다. 다만 나무 심은 날부터 주차 앱을 켜고 동네를 세 바퀴 도는 미래도 함께 막아주세요.", "2026-08-10T19:42:00+09:00"),
    comment("jinju-morning-20260809-trees-over-parking", 4, "골목 이웃", "장사하는 분에게 하역 공간은 생계이고 어르신에게 그늘은 안전이라 어느 쪽도 가볍지 않아요. 한 구간만 계절 시범 운영하고 매출과 보행 만족도를 함께 본 뒤 넓히면 덜 다투겠습니다.", "2026-08-10T19:45:00+09:00"),
  ],
  "jinju-seed-20260809-meeting-opposition-alternative": [
    comment("jinju-seed-20260809-meeting-opposition-alternative", 1, "회의 기록", "반대 의견은 위험, 근거, 확인할 다음 행동 세 줄로 남기면 공격처럼 들릴 가능성이 줄어듭니다. 완성된 해법이 없어도 작은 검증 방법 하나를 붙이면 회의가 훨씬 앞으로 가요.", "2026-08-10T19:48:00+09:00"),
    comment("jinju-seed-20260809-meeting-opposition-alternative", 2, "반대 비용", "찬반을 사람의 태도로 평가하기보다 예상 손실과 되돌릴 수 있는지부터 비교하면 좋겠습니다. 가장 작은 범위에서 시험해보면 어느 쪽도 체면을 잃지 않고 결과를 볼 수 있어요.", "2026-08-10T19:51:00+09:00"),
    comment("jinju-seed-20260809-meeting-opposition-alternative", 3, "침묵 회의", "모든 반대에 대안 제출서를 붙이면 회의는 조용해지겠지만 문제도 함께 조용해집니다. 침묵이 만장일치처럼 보이는 순간이 회사에서 제일 비싼 유머 같아요.", "2026-08-10T19:54:00+09:00"),
    comment("jinju-seed-20260809-meeting-opposition-alternative", 4, "조용한 동료", "문제는 또렷이 보이는데 답은 혼자 찾기 어려운 순간이 누구에게나 있습니다. 먼저 알려줘서 고맙다고 받은 뒤 함께 선택지를 만들면 다음 회의에서도 사람들이 입을 열어요.", "2026-08-10T19:57:00+09:00"),
  ],
};

export function august10TopComments(postId: string): EditorialComment[] {
  return COMMENTS[postId] ?? [];
}
