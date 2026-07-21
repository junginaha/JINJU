export type CommentSourcePost = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
};

export type SupplementalComment = {
  id: string;
  body: string;
  displayName: string;
  createdAt: string;
  isSeeded: true;
};

const ADJECTIVES = [
  "접힌", "느긋한", "말랑한", "엉뚱한", "반듯한", "기웃대는", "졸고있는", "살짝웃는",
  "천천한", "바삭한", "조용한", "유쾌한", "다정한", "부지런한", "멍한", "동그란",
  "반짝인", "한박자늦은", "솔직한", "수상한", "여유로운", "꼼꼼한", "흔들린", "따뜻한",
  "새벽의", "점심지난", "퇴근직전", "구름낀", "마음급한", "눈치빠른", "웃음참는", "잠깐쉰",
];

const NOUNS = [
  "달력", "우산", "만두", "연필", "찻잔", "현관", "키보드", "복숭아",
  "감자", "양말", "도마", "수건", "의자", "서류철", "단추", "주전자",
  "나침반", "책갈피", "리모컨", "계산기", "고무줄", "메뉴판", "알람", "냉장고",
  "종이컵", "가로등", "비누", "베개", "장바구니", "마우스", "물결", "토스터",
];

const RULES: Array<{ match: RegExp; pair: [string, string] }> = [
  { match: /잘 쉬셨|월요일/, pair: ["저 말 들으면 일단 긴장함 ㅋㅋ 안부만 묻고 끝난 적이 별로 없어서", "잘 쉬긴 했는데요… 그렇다고 배터리가 백 퍼센트는 아닙니다"] },
  { match: /실수.*커피|커피.*실수/, pair: ["우리 회사도 이거 있어요. 웃으면서 내긴 하는데 솔직히 은근 부담됨", "날짜 고치고 재발 방지하면 됐지 커피 열 잔까지는 좀 ㅋㅋ"] },
  { match: /사진.*가족|가족.*사진|단체방/, pair: ["엄마 마음도 이해되는데 싫다고 한 사진은 그냥 내려주는 게 맞지", "저도 비슷한 일 있었어요. 다음부터 올리기 전에 톡 한 번만 달라고 했더니 괜찮아졌어요"] },
  { match: /구독/, pair: ["나도 방금 결제 내역 열어봤다가 조용히 창 닫음…", "한 개씩 보면 얼마 안 되는데 다 합치면 진짜 큼. 이번 달엔 두 개만 끊어봐야지"] },
  { match: /엘리베이터|닫힘 버튼/, pair: ["아 이거 한 번 실수하면 집에 와서도 생각남", "다음에 마주치면 문 한 번 잡아주면 되죠 뭐. 너무 마음 쓰지 마세요"] },
  { match: /아파트 방송|단수/, pair: ["중요한 말은 꼭 맨 마지막에 해서 앞부분 다 듣게 함 ㅠ", "시간이랑 용건부터 말해주면 좋겠어요. 씻다가 단수 방송 들으면 진짜 급함"] },
  { match: /여름|첫사랑/, pair: ["첫사랑은 얼굴보다 그때 듣던 노래로 기억나는 것 같음", "이런 글 보면 갑자기 그 시절 날씨까지 생각나요. 좀 신기해요"] },
  { match: /냉장고/, pair: ["저도 아무것도 없다는 거 알면서 또 열어요 ㅋㅋ", "배고픈 게 아니라 그냥 뭔가 심심한 거였구나… 찔렸습니다"] },
  { match: /빨래/, pair: ["우리 집도 의자가 옷장 2호점 됐어요", "빨고 말린 데까지 했으면 오늘 할 일 다 한 걸로 칩시다"] },
  { match: /읽씹|답장/, pair: ["답장 기다릴 때 혼자 별생각 다 하는 거 나만 그런 줄", "바쁜가 보다 하고 넘기고 싶은데 그게 말처럼 쉽지가 않죠"] },
  { match: /비밀번호/, pair: ["보안은 완벽한데 주인도 못 들어감 ㅋㅋ", "비번 바꾸라는 알림 뜰 때마다 한숨부터 나와요"] },
  { match: /택배|상자/, pair: ["상품명 크게 적혀 오는 거 진짜 싫어요. 누가 봐도 알게 왜 그러는지", "송장 떼는 것도 은근 귀찮은데 개인정보 때문에 결국 박박 뜯게 됨"] },
  { match: /만이천|송금|밥값/, pair: ["몇천 원 가지고 그러냐는 사람이 먼저 보내주면 아무 문제 없음", "친한 사이일수록 돈은 바로 정리하는 게 편하더라고요"] },
  { match: /부모님 카드|부모님 돈/, pair: ["부모님 카드 쓰고 내가 아낀 척하는 건 좀 아니지 ㅋㅋ", "도움을 받은 건 고맙다고 하고, 내 절약은 따로 보는 게 맞는 것 같아요"] },
  { match: /비밀|상처/, pair: ["이름 안 말했다고 괜찮은 게 아니죠. 주변 사람은 다 알 텐데", "내 얘기로 남이 교훈 얻는 거… 저는 진짜 싫을 것 같아요"] },
  { match: /엄마 전화|부모.*전화/, pair: ["끊고 나서 괜히 한마디 더 할걸 싶을 때 있어요", "밥 먹었냐는 말밖에 안 했는데 이상하게 오래 남죠"] },
  { match: /선크림|SPF/, pair: ["선크림 하나 사는데 논문까지 찾아봐야 하나 싶음", "소비자가 매번 검증해야 하는 구조면 너무 피곤해요"] },
  { match: /화장실.*결재|결재.*화장실/, pair: ["화장실까지 노트북 들고 간 적 있어서 웃지를 못하겠네요", "급한 건 알겠는데 잠깐만 기다려주는 회사였으면 좋겠다"] },
  { match: /화분|식물/, pair: ["이름 붙이면 진짜 더 자주 보게 돼요. 저희 집은 몽실이임", "식물한테 말 거는 거 저만 하는 줄 알았어요 ㅋㅋ"] },
  { match: /회식/, pair: ["자유 참석인데 안 가면 이유 물어보는 순간 자유 아님", "가끔은 재밌는데 매번 좋아해야 하는 분위기는 피곤해요"] },
  { match: /월급|텅장|통장|생활비/, pair: ["월급날인데 통장 잔액은 왜 어제랑 비슷하죠", "저도 이번 달부터 고정비 먼저 적어봤는데 생각보다 세더라고요"] },
  { match: /신입|후배/, pair: ["후배 잘하면 든든하면서도 살짝 긴장되는 거 인정", "잘하는 사람 옆에서 배우면 되는데 마음은 또 그렇게 간단하지 않죠"] },
  { match: /이불|침대/, pair: ["침대에 잠깐만 누운 사람이 세 시간 뒤에 댓글 남깁니다", "오늘은 그냥 푹 쉬세요. 그런 날도 있어야죠"] },
  { match: /연애 예능|라면/, pair: ["남의 연애는 그렇게 잘 보이는데 내 연애는 왜 모르겠지", "라면 먹을까 말까 고민하다가 이미 물 올린 사람 손"] },
  { match: /AI.*글|완벽한 글/, pair: ["너무 반듯하면 읽다가 거리감 드는 거 뭔지 알 것 같아요", "근데 일부러 틀리고 사람인 척하는 것도 생길 듯. 결국 내용 봐야죠"] },
  { match: /운동|계단|오분|5분/, pair: ["계단 7층이면 운동 맞죠. 저는 3층부터 숨참", "저도 5분만 하자고 시작하면 가끔 20분까지 가더라고요. 시작한 걸로 충분함"] },
];

const CATEGORY_ENDINGS: Record<string, string[]> = {
  직장: ["우리 회사만 이런 줄 알았는데 아니었네요", "나는 조금 다르게 봄. 그래도 이건 한번 얘기해볼 만해요"],
  돈: ["아 이건 통장 열어보기 무섭다 ㅋㅋ", "저도 비슷해요. 금액보다 습관이 더 무서운 것 같아요"],
  관계: ["읽으면서 예전 생각났어요. 그때는 말 한마디가 왜 그렇게 어렵던지", "상대 입장도 있겠지만 내 마음부터 챙겨도 된다고 봐요"],
  사회: ["결국 평범한 사람한테 어떤 영향이 오는지를 봐야죠", "취지는 이해하는데 실제로 굴러갈 때 부작용도 같이 봤으면 해요"],
  제안: ["이거 진짜 있었으면 좋겠어요. 복잡할 필요도 없을 듯", "저라면 바로 씁니다. 필요한 사람 꽤 많을 것 같아요"],
  질문: ["저도 아직 답은 모르겠는데 자꾸 생각나네요", "음… 나는 반반. 상황마다 좀 다를 것 같아요"],
  일상: ["별일 아닌데 이런 게 은근 하루 종일 생각남", "나도 해봤어요 ㅋㅋ 다들 비슷하게 사는구나"],
};

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}
function nickname(postId: string, variant: number) {
  const seed = hash(`${postId}:${variant}:jinju`);
  const adjective = ADJECTIVES[seed % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(seed / ADJECTIVES.length) % NOUNS.length];
  return `${adjective} ${noun}`;
}

function genericPair(post: CommentSourcePost): [string, string] {
  const seed = hash(post.id);
  const endings = CATEGORY_ENDINGS[post.category] || CATEGORY_ENDINGS.일상;
  return [
    endings[seed % endings.length],
    endings[(seed + 1) % endings.length],
  ];
}

export function supplementalComments(post: CommentSourcePost): SupplementalComment[] {
  const combined = `${post.title}\n${post.content}`;
  const matchedPair = RULES.find((rule) => rule.match.test(combined))?.pair;
  const pair = matchedPair || genericPair(post);
  const baseTime = Number.isFinite(Date.parse(post.createdAt)) ? Date.parse(post.createdAt) : Date.now();
  return pair.map((body, index) => ({
    id: `jinju-tone-${post.id}-${index + 1}`,
    body,
    displayName: nickname(post.id, index),
    createdAt: new Date(baseTime + (index === 0 ? 11 : 23) * 60_000).toISOString(),
    isSeeded: true,
  }));
}
