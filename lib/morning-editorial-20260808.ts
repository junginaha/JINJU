import type { EditorialComment, EditorialPost } from "./editorial";

export const august8MorningPosts: EditorialPost[] = [
  {
    id: "jinju-morning-20260808-bus-housing",
    title: "청년 주거난에 버스 하우스가 답이 될 수 있을까요",
    content: "청년 주거난 해법으로 폐버스를 고쳐 임시 주거 공간으로 쓰자는 제안이 정치권에서 나왔습니다.\n\n당장 잘 곳을 늘리는 현실적인 방법일까요, 집다운 집을 요구하는 청년에게 바퀴 달린 방을 내미는 것일까요?",
    category: "사회",
    displayName: "버스 창문",
    mode: "의견 묻기",
    createdAt: "2026-08-08T07:10:00+09:00",
    updatedAt: "2026-08-08T07:10:00+09:00",
    heard: 32,
    same: 27,
    support: 0,
    commentCount: 4,
  },
  {
    id: "jinju-morning-20260808-special-school-admission",
    title: "특수학교 입학도 부모가 전쟁처럼 준비해야 하나요",
    content: "특수학교 자리가 부족해 부모들이 최소 1년 전부터 입학을 준비하고, 교육청까지 학생 분산 배치를 호소하는 상황이라고 합니다.\n\n아이에게 맞는 교육을 받을 권리를 거주지역과 경쟁 순서에 맡겨도 괜찮을까요?",
    category: "질문",
    displayName: "학교 문턱",
    mode: "의견 묻기",
    createdAt: "2026-08-08T10:00:00+09:00",
    updatedAt: "2026-08-08T10:00:00+09:00",
    heard: 30,
    same: 14,
    support: 0,
    commentCount: 4,
  },
  {
    id: "jinju-morning-20260808-high-school-baseball-heat",
    title: "프로야구는 멈췄는데 고교야구는 66도 운동장에서 계속됐습니다",
    content: "프로야구는 폭염 때문에 경기를 멈췄는데 고교야구는 지표 온도 66도에 이른 운동장에서 계속됐고 일부 선수는 어지럼증을 호소했습니다.\n\n중요한 대회 기회를 지키는 것과 미성년 선수의 건강 중 무엇을 먼저 기준으로 삼아야 할까요?",
    category: "사회",
    displayName: "뜨거운 타석",
    mode: "의견 묻기",
    createdAt: "2026-08-08T12:50:00+09:00",
    updatedAt: "2026-08-08T12:50:00+09:00",
    heard: 33,
    same: 9,
    support: 0,
    commentCount: 4,
  },
  {
    id: "jinju-morning-20260808-semiconductor-work-hours",
    title: "반도체 연구는 주 52시간으로 경쟁하기 어렵다는 말, 맞을까요",
    content: "반도체 분야에서 연구개발직은 주 52시간제를 유연하게 바꿔야 한다는 요구가 나왔습니다.\n\n경쟁 속도를 따라가려면 필요할까요, 열정을 이유로 밤샘 노동을 정상으로 되돌리는 길이 될까요?",
    category: "직장",
    displayName: "연구 야근",
    mode: "의견 묻기",
    createdAt: "2026-08-08T16:20:00+09:00",
    updatedAt: "2026-08-08T16:20:00+09:00",
    heard: 28,
    same: 25,
    support: 0,
    commentCount: 4,
  },
  {
    id: "jinju-morning-20260808-police-family-case-transfer",
    title: "경찰 가족 사건은 다른 경찰서가 맡는 게 맞을까요",
    content: "경찰이 9월부터 배우자나 부모, 자녀와 관련된 사건은 본인이 직접 수사하지 못하게 하고 다른 경찰관서에 맡기는 제도를 시행한다고 합니다.\n\n수사 신뢰를 지키는 당연한 장치일까요, 작은 지역에서는 인력과 시간을 더 낭비할까요?",
    category: "제안",
    displayName: "사건 거리",
    mode: "의견 묻기",
    createdAt: "2026-08-08T20:10:00+09:00",
    updatedAt: "2026-08-08T20:10:00+09:00",
    heard: 31,
    same: 13,
    support: 0,
    commentCount: 4,
  },
];

const comment = (
  id: string,
  displayName: string,
  body: string,
  createdAt: string,
): EditorialComment => ({ id, displayName, body, createdAt });

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-morning-20260808-bus-housing": [
    comment("morning-0808-bus-housing-1", "임시 주거", "지금 잘 곳이 없는 사람에게는 완벽한 아파트보다 오늘 머물 안전한 공간이 먼저입니다. 임시라는 기한과 다음 주거 대책이 함께 있어야 해요.", "2026-08-08T07:14:00+09:00"),
    comment("morning-0808-bus-housing-2", "청년 세입자", "청년이 원하는 건 버스에서 사는 낭만이 아니라 월급으로 감당할 수 있는 집입니다. 주택난을 개인의 적응력으로 해결하지 않았으면 합니다.", "2026-08-08T07:21:00+09:00"),
    comment("morning-0808-bus-housing-3", "활용 찬성", "폐버스에 냉난방과 화장실, 소방시설을 제대로 갖춘다면 긴급 주거로 활용할 수 있다고 봅니다. 이름보다 실제 시설이 중요해요.", "2026-08-08T07:29:00+09:00"),
    comment("morning-0808-bus-housing-4", "바퀴 방", "이사하기는 편하겠지만 주소지가 주차구역 몇 번으로 적힐까 걱정됩니다. 바퀴를 달기 전에 정책이 도망가지 않게 고정해 주세요.", "2026-08-08T07:38:00+09:00"),
  ],
  "jinju-morning-20260808-special-school-admission": [
    comment("morning-0808-special-school-1", "특수 학부모", "학교를 선택하기도 전에 자리가 있는지부터 걱정해야 합니다. 아이의 교육이 부모의 정보력과 체력에 따라 달라져서는 안 돼요.", "2026-08-08T10:04:00+09:00"),
    comment("morning-0808-special-school-2", "교실 자리", "입학 시기마다 호소문을 내는 건 임시 대응일 뿐입니다. 필요한 지역에 학교와 교실을 장기적으로 늘려야 합니다.", "2026-08-08T10:11:00+09:00"),
    comment("morning-0808-special-school-3", "통합 교육", "특수학교만 계속 늘리면 장애 학생이 지역사회에서 더 분리될 수도 있습니다. 일반 학교 안의 지원 인력과 특수학급도 함께 확대해야 해요.", "2026-08-08T10:19:00+09:00"),
    comment("morning-0808-special-school-4", "입학 전쟁", "아이 한 명 학교에 보내려고 부모가 입시 전문가가 되어야 하는 상황부터 이상합니다. 교육받을 권리에는 대기번호가 없어야죠.", "2026-08-08T10:28:00+09:00"),
  ],
  "jinju-morning-20260808-high-school-baseball-heat": [
    comment("morning-0808-baseball-heat-1", "선수 건강", "프로도 멈추는 날에 학생에게 버티라고 하는 건 교육이 아니라 위험한 인내심 시험입니다. 일정 손해보다 건강 손해가 훨씬 큽니다.", "2026-08-08T12:54:00+09:00"),
    comment("morning-0808-baseball-heat-2", "대회 일정", "새벽이나 야간으로 옮기고 경기 간 휴식시간을 늘리는 방법부터 찾아야 합니다. 취소와 강행만 있는 건 아니에요.", "2026-08-08T13:01:00+09:00"),
    comment("morning-0808-baseball-heat-3", "야구 부모", "한 번뿐인 대회라 포기하기 어려운 마음도 이해합니다. 그래서 선수나 부모가 아니라 주최 측이 객관적인 중단 기준을 정해야 해요.", "2026-08-08T13:09:00+09:00"),
    comment("morning-0808-baseball-heat-4", "그늘 없음", "선수보다 운동장이 먼저 열이 났습니다. 그라운드 체온이 66도면 경기가 아니라 운동장부터 응급실에 가야 합니다.", "2026-08-08T13:18:00+09:00"),
  ],
  "jinju-morning-20260808-semiconductor-work-hours": [
    comment("morning-0808-semiconductor-1", "개발 시계", "연구는 실험 결과가 나오는 시간에 맞춰 움직여야 할 때가 있습니다. 본인이 선택할 수 있는 유연한 근무 방식은 필요해요.", "2026-08-08T16:24:00+09:00"),
    comment("morning-0808-semiconductor-2", "노동 기준", "연구 일정이 급하다는 말은 언제든 나올 수 있습니다. 법의 보호를 풀면 선택이 아니라 눈치로 야근하는 사람이 먼저 생깁니다.", "2026-08-08T16:31:00+09:00"),
    comment("morning-0808-semiconductor-3", "선택 근로", "근로자 동의와 추가 보상, 연속 휴식시간을 보장한다면 제한적인 예외는 검토할 수 있습니다. 회사가 일방적으로 정하면 안 됩니다.", "2026-08-08T16:39:00+09:00"),
    comment("morning-0808-semiconductor-4", "반도체 밤샘", "반도체는 나노 단위로 만드는데 야근은 자꾸 대형화됩니다. 기술 경쟁력에 사람을 오래 앉혀두는 능력까지 포함되지는 않았으면 해요.", "2026-08-08T16:48:00+09:00"),
  ],
  "jinju-morning-20260808-police-family-case-transfer": [
    comment("morning-0808-police-family-1", "수사 신뢰", "공정하게 수사했더라도 가족이 관련되면 결과를 믿기 어렵습니다. 수사하는 사람과 사건 사이에 일정한 거리를 두는 게 맞습니다.", "2026-08-08T20:14:00+09:00"),
    comment("morning-0808-police-family-2", "작은 경찰서", "인력이 적은 지역에서는 다른 관서로 넘기는 동안 초동 대응이 늦어질 수 있습니다. 긴급조치는 먼저 하고 본수사만 이관하는 방식이 필요해요.", "2026-08-08T20:21:00+09:00"),
    comment("morning-0808-police-family-3", "가족 기준", "배우자와 직계가족은 명확하지만 가까운 친척이나 오래된 지인은 경계가 모호합니다. 수사관이 스스로 신고할 수 있는 절차도 있어야 합니다.", "2026-08-08T20:29:00+09:00"),
    comment("morning-0808-police-family-4", "배정 원칙", "사건을 넘겼다는 기록과 담당 변경 이유가 남는다면 시민도 결과를 더 신뢰할 수 있습니다. 공정성은 마음보다 확인 가능한 절차에서 나옵니다.", "2026-08-08T20:38:00+09:00"),
  ],
};

export function august8MorningComments(id: string) {
  return COMMENTS[id] ?? [];
}
