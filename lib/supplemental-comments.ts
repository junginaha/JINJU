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

const SUFFIXES = ["봄", "별", "빛", "씨", "결", "밤", "잎", "콩"];

const RULES: Array<{ match: RegExp; pair: [string, string] }> = [
  { match: /잘 쉬셨|월요일/, pair: ["안부 한 숟갈에 업무 두 국자라니, 월요일 배식이 참 후합니다.", "잘 쉬었다고 대답한 순간 업무 가능 판정을 받은 기분이죠. 제 주말은 아직 이의신청 중입니다."] },
  { match: /실수.*커피|커피.*실수/, pair: ["날짜 하나 고쳤는데 커피 열 잔까지 책임지면 실수가 카페를 창업한 셈이죠.", "업무는 수정했고 이상한 전통도 업데이트했네요. 이번 패치는 꽤 마음에 듭니다."] },
  { match: /사진.*가족|가족.*사진|단체방/, pair: ["가족 단체방은 사랑으로 운영되는 비공식 사진관이죠. 전시는 따뜻한데 모델 동의서가 자주 빠집니다.", "효도가 깎인 게 아니라 공개 범위를 조정한 겁니다. 가족 앨범에도 설정 메뉴는 필요해요."] },
  { match: /구독/, pair: ["구독 서비스는 제가 잊은 동안에도 저를 하루도 잊지 않더라고요. 참 유료로 다정합니다.", "미래의 나는 운동하고 독서하는데 현재의 통장만 먼저 수련 중이었네요."] },
  { match: /엘리베이터|닫힘 버튼/, pair: ["머리는 열림을 외쳤는데 손가락이 단독으로 폐문 결정을 내렸네요.", "다음에 문 한 번 잡아드리면 됩니다. 이웃 관계는 의외로 버튼 한 번에 복구되더라고요."] },
  { match: /아파트 방송|단수/, pair: ["샴푸 거품을 올린 순간 단수 안내의 핵심이 가장 또렷하게 들립니다.", "관리실 방송은 결론을 기다리는 동안 주민이 먼저 늙어요. 시간과 용건부터 부탁드립니다."] },
  { match: /여름|첫사랑/, pair: ["첫사랑은 사람 이름보다 계절의 냄새로 오래 남는 것 같아요. 제 기억도 갑자기 반팔을 꺼내 입었습니다.", "그 시절 마음은 서툴렀지만 출석률만큼은 완벽했죠. 생각만 하면 매일 등교했으니까요."] },
  { match: /냉장고/, pair: ["냉장고를 세 번 열면 음식보다 제 마음의 재고가 먼저 확인됩니다.", "저희 집 냉장고도 자주 새로고침합니다. 업데이트는 없고 불빛만 성실해요."] },
  { match: /빨래/, pair: ["빨래가 의자에 앉는 순간 가구가 아니라 장기 보관소가 되더라고요.", "다 개지 못해도 잘 말렸으면 오늘 업무의 절반은 성공입니다. 나머지는 의자 정규직으로 두시죠."] },
  { match: /읽씹|답장/, pair: ["답장은 안 왔는데 제 상상력만 장문의 회신을 보냈습니다.", "기다린 마음이 민망한 건 아니죠. 다만 휴대폰 새로고침 부서는 오늘도 과로 중입니다."] },
  { match: /비밀번호/, pair: ["보안을 위해 만든 비밀번호를 정작 본인에게서 가장 안전하게 숨겨버렸네요.", "대문자와 특수문자는 챙겼는데 기억력은 요구사항에서 빠졌나 봅니다."] },
  { match: /택배|상자/, pair: ["택배 상자가 저보다 먼저 이웃에게 자기소개를 마쳤네요.", "배송 정보는 필요해도 구매 내역 발표회까지 열 필요는 없죠. 상자도 말수를 줄였으면 합니다."] },
  { match: /만이천|송금|밥값/, pair: ["몇천 원 따지지 말라는 분이 그 몇천 원을 대신 내주면 회의가 아주 빨리 끝납니다.", "우정은 무료여도 식비는 유료입니다. 입금 알림이 관계를 망치는 게 아니라 자주 구해주더라고요."] },
  { match: /부모님 카드|부모님 돈/, pair: ["결제는 부모님 카드가 하고 생색은 자녀 통장에 적립됐네요.", "가족의 호의와 내 절약은 같은 항목이 아니죠. 가계부도 이 대목에서는 고개를 갸웃할 듯합니다."] },
  { match: /비밀|상처/, pair: ["남의 상처로 연애 과외를 열었네요. 수강료는 제대로 된 사과로 받으셔야겠습니다.", "이름을 가렸다고 비밀이 되는 건 아니죠. 당사자 마음에 모자이크가 안 됐으니까요."] },
  { match: /엄마 전화|부모.*전화/, pair: ["부모님 전화는 짧아질수록 끊고 난 뒤 통화가 마음속에서 더 길게 이어집니다.", "별말 없이 밥 먹었냐고 묻는 통화가 이상하게 하루의 가장 큰 문장이 되더라고요."] },
  { match: /선크림|SPF/, pair: ["선크림을 바르기 전에 시험성적서부터 읽어야 한다면 얼굴보다 아침 시간이 먼저 탑니다.", "소비자는 탐정이 아니라 손님이라는 말에 선크림 뚜껑도 조용히 끄덕였을 듯합니다."] },
  { match: /화장실.*결재|결재.*화장실/, pair: ["회사에서는 화장실도 위성 사무실이 되더라고요. 복지는 휴지뿐이고 업무는 본사급입니다.", "손 씻기 전에 승인부터 했다니 책임감이 너무 방수입니다."] },
  { match: /화분|식물/, pair: ["이름이 없어도 매일 인사받는 화분이면 이미 집에서 제일 사회생활을 잘하고 있습니다.", "물을 준 날보다 말을 건 날 더 싱싱해 보이면, 식물도 관심을 비료로 쓰나 봐요."] },
  { match: /회식/, pair: ["자유 참석에서 불참만 유료 눈치라면 그건 자유 체험판입니다.", "회식 참석 여부보다 다음 날 표정 관리가 더 큰 업무더라고요."] },
  { match: /월급|텅장|통장|생활비/, pair: ["월급은 들어올 때 정문을 쓰고 나갈 때 비상구까지 총동원하더라고요.", "통장은 숫자를 보여줬을 뿐인데 왜 제가 반성문을 쓰게 되는지 모르겠습니다."] },
  { match: /신입|후배/, pair: ["후배가 일을 잘하면 팀은 든든하고 제 자존심만 잠깐 업데이트가 필요하죠.", "경력은 완벽함의 연수가 아니라 도움을 잘 주고받은 시간일지도 모르겠습니다."] },
  { match: /이불|침대/, pair: ["이불 밖이 위험한 건 아직 입증 중이지만, 이불 안이 좋은 건 이미 충분히 재현됐습니다.", "침대와의 협상은 늘 제가 눕는 쪽으로 타결됩니다. 아주 평화적인 노사관계예요."] },
  { match: /연애 예능|라면/, pair: ["남의 연애는 분석하면서 제 라면 물 조절에는 또 실패했습니다.", "새벽 두 시 라면은 출연료도 안 받고 매회 엔딩을 책임지네요."] },
  { match: /AI.*글|완벽한 글/, pair: ["문장이 조금 삐끗할 때 오히려 사람이 걸어온 발자국처럼 느껴질 때가 있어요.", "완벽한 글은 감탄하고 지나가는데 서툰 한 줄은 자꾸 옆자리를 내어주더라고요."] },
  { match: /운동|계단|오분|5분/, pair: ["운동복까지 갈아입어야 운동이라면 제 계단 7층이 억울해서 민원을 넣겠습니다.", "5분도 매일 모이면 제법 묵직합니다. 거창한 계획은 아직 준비운동 중이고요."] },
];

const OPENERS = [
  (hook: string) => `“${hook}”에서 웃었는데 제 하루도 이미 공동 집필 중이네요.`,
  (hook: string) => `제목의 “${hook}” 대목에서 제 생활이 참고인으로 출석했습니다.`,
  (hook: string) => `“${hook}”라니, 웃다가 제 얘기라 자세를 고쳐 앉았습니다.`,
  (hook: string) => `오늘의 생활 밀착형 명문은 “${hook}”로 정하겠습니다.`,
  (hook: string) => `“${hook}”를 읽는 순간 제 기억도 조용히 손을 들었습니다.`,
  (hook: string) => `이 글의 “${hook}”에 제 경험이 무단으로 특별출연했네요.`,
];

const SPECIFIC_TAILS = [
  (title: string) => `“${title}”라는 제목은 오늘 제 상황 보고서 첫 줄로 빌려갑니다.`,
  (title: string) => `“${title}”까지 읽고 나니 제 하루도 같은 장르였네요.`,
  (title: string) => `제 오늘과 눈이 마주친 “${title}”, 조용히 저장해둡니다.`,
  (title: string) => `“${title}”는 제 마음속 생활기록부에도 같은 제목으로 들어가겠습니다.`,
  (title: string) => `“${title}”에서 웃고 나니 억울함도 한 칸 줄었어요.`,
  (title: string) => `오늘의 제 사정은 “${title}” 한 줄이면 설명이 다 되겠습니다.`,
];

const CATEGORY_ENDINGS: Record<string, string[]> = {
  직장: ["회사에서는 사소한 일도 안건이 되고 제 마음만 늘 기타사항이더라고요.", "오늘도 업무보다 표정 관리가 먼저 출근했습니다."],
  돈: ["계산기는 정확한데 마음의 잔돈은 늘 남더라고요.", "통장도 이 글을 읽고 작게 한숨 쉬었을 것 같습니다."],
  관계: ["사람 마음에는 읽음 표시가 없어서 더 오래 들여다보게 되나 봐요.", "가까운 사이일수록 설명서 한 장이 가끔 필요합니다."],
  사회: ["뉴스는 멀리서 오는데 계산서와 피로는 꼭 우리 집까지 잘 찾아옵니다.", "큰 제도 이야기 끝에 늘 평범한 사람의 하루가 서 있네요."],
  제안: ["이 정도는 거창한 혁신보다 버튼 하나와 배려 한 줄이면 될 것 같아요.", "담당자 책상에 이 글을 포스트잇처럼 붙여두고 싶습니다."],
  질문: ["정답은 없어도 이 질문 덕분에 제 하루를 한 번 더 보게 됐습니다.", "질문은 짧은데 제 생각은 벌써 연장 근무에 들어갔네요."],
  일상: ["별일 아닌데 오래 남는 것들이 하루의 진짜 주인공인가 봅니다.", "평범한 하루가 이렇게 웃긴 건 우리 모두 꽤 성실하게 살았다는 뜻이겠죠."],
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
  const suffix = SUFFIXES[Math.floor(seed / (ADJECTIVES.length * NOUNS.length)) % SUFFIXES.length];
  const signature = String(seed % 1000).padStart(3, "0");
  return `${adjective} ${noun}${suffix}${signature}`;
}

function hook(title: string) {
  const clean = title.replace(/[“”"?!.]/g, "").trim();
  if (clean.length <= 22) return clean;
  const clipped = clean.slice(0, 22);
  const lastSpace = clipped.lastIndexOf(" ");
  return lastSpace >= 12 ? clipped.slice(0, lastSpace) : clipped;
}

function genericPair(post: CommentSourcePost): [string, string] {
  const seed = hash(post.id);
  const titleHook = hook(post.title);
  const endings = CATEGORY_ENDINGS[post.category] || CATEGORY_ENDINGS.일상;
  return [
    `${OPENERS[seed % OPENERS.length](titleHook)} ${endings[seed % endings.length]}`,
    `${OPENERS[(seed + 3) % OPENERS.length](titleHook)} ${endings[(seed + 1) % endings.length]}`,
  ];
}

export function supplementalComments(post: CommentSourcePost): SupplementalComment[] {
  const combined = `${post.title}\n${post.content}`;
  const matchedPair = RULES.find((rule) => rule.match.test(combined))?.pair;
  const titleHook = hook(post.title);
  const seed = hash(post.id);
  const pair = matchedPair
    ? [
        `${matchedPair[0]} ${SPECIFIC_TAILS[seed % SPECIFIC_TAILS.length](titleHook)}`,
        `${matchedPair[1]} ${SPECIFIC_TAILS[(seed + 3) % SPECIFIC_TAILS.length](titleHook)}`,
      ]
    : genericPair(post);
  const baseTime = Number.isFinite(Date.parse(post.createdAt)) ? Date.parse(post.createdAt) : Date.now();
  return pair.map((body, index) => ({
    id: `jinju-tone-${post.id}-${index + 1}`,
    body,
    displayName: nickname(post.id, index),
    createdAt: new Date(baseTime + (index === 0 ? 11 : 23) * 60_000).toISOString(),
  }));
}
