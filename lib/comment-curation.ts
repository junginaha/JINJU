export type CuratableComment = {
  id: string;
  body: string;
  displayName: string;
  createdAt: string;
};

const REWRITES: Record<string, string> = {
  "jinju-seed-20260723-thursday-feels-friday-c01": "여기요. 아침부터 금요일인 줄 알고 버텼는데 아직 하루 남았다니요 ㅋㅋ",
  "jinju-seed-20260723-thursday-feels-friday-c02": "목요일 오후쯤 되면 마음은 먼저 퇴근하더라고요.",
  "jinju-seed-20260723-familiar-lunch-wins-c01": "새 식당 검색은 제가 하고 주문은 늘 김치찌개입니다 ㅋㅋ",
  "jinju-seed-20260723-familiar-lunch-wins-c02": "점심은 모험보다 빨리 나오는 곳이 이기죠.",
  "jinju-seed-20260723-reply-starts-with-apology-c01": "이틀 미루면 답장보다 사과문이 더 길어져요. 저도 지금 하나 밀려 있습니다 ㅠ",
  "jinju-seed-20260723-reply-starts-with-apology-c02": "완벽하게 쓰려다 아예 못 보내는 거, 진짜 제 얘기네요.",
  "jinju-seed-20260723-ai-saved-time-c01": "맞아요. 빨리 끝낸 만큼 일이 더 들어와서 퇴근 시간은 그대로예요.",
  "jinju-seed-20260723-ai-saved-time-c02": "전에는 한 시간에 하나 했는데 지금은 다섯 개 하고도 왜 이것밖에 못 했나 싶어요 ㅋㅋ",
  "jinju-seed-20260723-apology-before-explanation-c01": "저는 미안하다는 말부터 듣고 싶어요. 설명부터 나오면 변명처럼 들리더라고요.",
  "jinju-seed-20260723-apology-before-explanation-c02": "사과문이 길어지면 읽는 사람도 어디서 화내야 할지 놓쳐요.",
  "jinju-seed-20260723-same-elevator-floor-c01": "저도 괜히 우편함 한 번 열어봅니다. 올 편지도 없는데요 ㅋㅋ",
  "jinju-seed-20260723-same-elevator-floor-c02": "상대도 똑같이 신경 쓰고 있을 듯. 둘 다 휴대폰만 보는 복도 완성.",
  "jinju-seed-20260723-lunch-meeting-c01": "우리 팀도 30분 고민하고 늘 김치찌개예요 ㅋㅋ",
  "jinju-seed-20260723-lunch-meeting-c02": "메뉴 정할 때만 전 직원 의견 수렴함.",
  "jinju-seed-20260723-five-second-crosswalk-c01": "예전엔 뛰었는데 요즘은 다음 신호 기다려요. 넘어지면 하루가 더 길어져서요.",
  "jinju-seed-20260723-five-second-crosswalk-c02": "5초 보고 뛰던 체력은 어디 갔는지 ㅋㅋ 이제는 그냥 기다립니다.",
  "jinju-seed-20260723-safe-day-c01": "저도 요즘은 별일 없었다는 말이 제일 좋더라고요.",
  "jinju-seed-20260723-safe-day-c02": "양말 벗고 누웠으면 오늘 할 일은 다 했습니다.",
  "jinju-seed-20260722-late-honor-revocation-c01": "지금이라도 취소한 건 다행인데, 이걸로 끝났다고 하면 안 될 것 같아요.",
  "jinju-seed-20260722-late-honor-revocation-c02": "왜 잘못 줬는지와 피해 회복을 어떻게 할지도 같이 남겨야죠.",
  "jinju-seed-20260722-math-apology-pressure-c02": "친구 말 잘 들어주는 것도 진짜 재능이죠. 시험에는 안 나와서 그렇지.",
  "jinju-seed-20260722-math-apology-pressure-c06": "저도 수학은 일찍 포기했지만 상 받은 학생들한테 박수는 크게 칩니다 ㅋㅋ",
  "jinju-seed-20260722-friend-ai-comfort-c01": "나중에 알면 서운하긴 할 것 같아요. 그래도 잘 위로하고 싶었던 마음은 진짜였겠죠.",
  "jinju-seed-20260722-friend-ai-comfort-c09": "제 친구는 아직 답장 입력 중인 지 삼 년째입니다. 도움 받아서라도 보내준 친구가 조금 부럽네요 ㅋㅋ",
  "jinju-seed-20260722-human-ai-go-handicap-c01": "두 점 먼저 놓았으면 ‘인간이 AI보다 강하다’는 건 좀 과장이죠.",
  "jinju-seed-20260722-human-ai-go-handicap-c02": "그래도 정해진 조건에서 두 판 연속 이긴 건 대단한 거 아닌가요?",
  "jinju-hot-ai-jobs-c1": "회사가 AI 쓰자고 했으면 배우는 시간도 근무시간으로 쳐줘야죠.",
  "jinju-hot-youth-jobs-c1": "첫 경력 쌓을 자리부터 없는데 스펙만 더 쌓으라니 답답하죠.",
  "jinju-hot-false-info-law-c1": "지우는 기준부터 공개해야죠. 누가 왜 지웠는지 모르면 더 못 믿겠어요.",
  "jinju-hot-senior-transit-c1": "무조건 없애기보다 정말 필요한 분은 계속 탈 수 있게 했으면 해요.",
  "jinju-hot-compressed-spending-c1": "저도 평소엔 아끼고 여행 때 씁니다. 그게 낙이라 후회는 없어요.",
  "jinju-hot-marriage-cost-c1": "둘이 작게 하자고 정해도 가족들 설득하는 데서 제일 많이 싸우더라고요.",
  "jinju-hot-school-violence-c1": "입시에 반영해도 피해자가 학교에서 계속 버텨야 하면 달라진 게 없죠.",
  "jinju-hot-heat-work-c1": "쉬라고만 하면 못 쉬죠. 그 시간 돈도 같이 보장돼야 해요.",
  "jinju-hot-subscriptions-c1": "한 달에 한 번 구독 목록을 보는데 꼭 모르는 결제가 하나씩 있더라고요.",
  "jinju-hot-ai-authenticity-c1": "너무 매끈하면 오히려 누가 썼는지 안 보이더라고요.",
  "jinju-today-20260715-investigation-rights-c05": "결국 경찰도 검찰도 못 믿겠다는 얘기잖아요. 누가 맡든 기록부터 공개했으면 합니다.",
  "jinju-seed-20260720-coffee-mistake-culture-c01": "실수했다고 열 잔 사는 건 은근 부담돼요. 실수 고쳤으면 됐죠.",
  "jinju-seed-20260720-coffee-mistake-culture-c05": "우리 회사도 실수하면 간식 사요. 웃으면서 내지만 솔직히 좀 아깝습니다 ㅋㅋ",
  "jinju-seed-20260720-family-chat-photo-c01": "엄마 마음은 알겠는데 싫다고 한 사진은 그냥 내려줬으면 해요.",
  "jinju-seed-20260720-family-chat-photo-c05": "저희 엄마 폰에도 제가 지우고 싶은 사진이 고화질로 남아 있습니다 ㅠ",
  "jinju-seed-20260720-unused-subscriptions-c01": "저도 결제 내역 봤다가 안 쓰는 게 세 개나 있어서 바로 끊었어요.",
  "jinju-seed-20260720-unused-subscriptions-c06": "운동 앱만 켜두면 운동한 기분이라 아직 못 끊고 있습니다 ㅋㅋ",
  "jinju-seed-20260720-elevator-close-button-c01": "저도 급해서 닫힘 눌렀다가 사람 보고 너무 민망했어요.",
  "jinju-seed-20260720-elevator-close-button-c03": "다음에 만나면 문 한 번 잡아드리면 되죠. 너무 오래 신경 쓰지 마세요.",
  "jinju-seed-20260720-apartment-broadcast-first-c04": "일단 시간부터 말하고 이유는 뒤에 설명해주면 좋겠어요.",
  "jinju-seed-20260720-apartment-broadcast-first-c05": "샴푸 중에 들으면 앞말 하나도 안 들어옵니다. 단수 시간부터요 ㅠ",
  "jinju-seed-20260719-summer-first-love-c01": "저도 첫사랑보다 그때 듣던 노래가 더 선명해요.",
  "jinju-seed-20260719-summer-first-love-c04": "이런 글 보면 그 시절 날씨까지 갑자기 생각나요.",
  "jinju-seed-20260719-lunch-walk-alone-c04": "혼자 걷는 게 왜 설명할 일이죠. 조용히 밥 먹고 싶은 날도 있는데.",
  "jinju-seed-20260719-lunch-walk-alone-c06": "저도 혼자 한 바퀴 돌고 오면 오후에 좀 살 것 같더라고요.",
  "jinju-seed-20260719-sibling-parent-card-c01": "부모님 카드 썼으면 아낀 건 본인 돈이 아니죠 ㅋㅋ",
  "jinju-seed-20260719-sibling-parent-card-c02": "도움받은 건 괜찮은데 자기 절약처럼 말한 건 좀 얄밉네요.",
  "jinju-seed-20260719-secret-became-lesson-c01": "이름 안 말해도 주변 사람은 다 알 텐데요. 저는 너무 싫을 것 같아요.",
  "jinju-seed-20260719-secret-became-lesson-c04": "친구 비밀을 연애 교훈으로 쓰는 건 선 넘었죠.",
  "jinju-seed-20260719-fridge-not-hungry-c02": "저도 아무것도 없는 거 알면서 또 열어요 ㅋㅋ",
  "jinju-seed-20260719-fridge-not-hungry-c06": "배고픈 게 아니라 심심했던 거구나… 찔렸습니다.",
  "jinju-seed-20260719-parcel-box-privacy-c03": "상품명 크게 적힌 택배 진짜 싫어요. 송장부터 뜯게 됩니다.",
  "jinju-seed-20260719-parcel-box-privacy-c07": "포장은 무지로 하고 상품명은 작게 해줬으면 좋겠어요.",
  "jinju-seed-20260718-laundry-chair-c03": "우리 집도 의자가 옷장 2호점 됐어요 ㅋㅋ",
  "jinju-seed-20260718-laundry-chair-c06": "빨고 말렸으면 오늘은 다 한 걸로 칩시다.",
  "jinju-seed-20260718-friend-read-receipt-c01": "답장 기다릴 때 혼자 별생각 다 하는 거 저만 그런 줄 알았어요.",
  "jinju-seed-20260718-friend-read-receipt-c06": "바쁜가 보다 넘기고 싶은데 마음은 그게 안 되죠.",
  "jinju-seed-20260718-office-password-c01": "보안은 완벽한데 저도 못 들어갑니다 ㅋㅋ",
  "jinju-seed-20260718-office-password-c02": "비번 바꾸라는 알림 뜰 때마다 한숨부터 나와요.",
  "jinju-seed-20260718-parent-short-call-c01": "저도 통화 짧게 끝나면 편하면서 괜히 한마디 더 할 걸 싶어요.",
  "jinju-seed-20260718-parent-short-call-c05": "부모님이 잘 지내시면 좋은데 제가 없어도 너무 잘 지내면 또 살짝 서운하죠.",
  "jinju-morning-20260717-etf-cash-gate-c04": "코인처럼 흔들렸으면 제한은 필요했다고 봐요.",
  "jinju-morning-20260717-etf-cash-gate-c05": "다만 잔고 적은 사람만 막히는 건 좀 이상하죠.",
  "jinju-morning-20260717-daiso-sunscreen-c02": "아직 다 나온 얘기는 아니라서 결과는 좀 더 봐야겠어요.",
  "jinju-morning-20260717-constitution-holiday-c03": "빨간 날이어도 못 쉬는 분들이 많아서 마냥 좋지만은 않네요.",
  "jinju-morning-20260717-constitution-holiday-c05": "저는 쉬어서 좋지만 누군가는 더 바빠진다는 게 좀 씁쓸해요.",
  "jinju-seed-20260716-delivery-review-c02": "30분 썼으면 취미 맞는 듯 ㅋㅋ 사장님도 꽤 좋아하셨을 것 같아요.",
  "jinju-seed-20260716-delivery-review-c05": "저도 리뷰 한 줄 쓰려다 음식 묘사에 진심 될 때 있어요.",
  "jinju-seed-20260716-bathroom-approval-c01": "저도 화장실에서 업무 알림 본 적 있어 웃지를 못하겠네요.",
  "jinju-seed-20260716-bathroom-approval-c03": "손 씻기도 전에 결재라니… 회사가 너무 급함.",
  "jinju-morning-20260716-ai-monitoring-work-c01": "일 도와주는 건 좋은데 화면 몇 번 눌렀는지까지 보는 건 싫어요.",
  "jinju-morning-20260716-ai-monitoring-work-c05": "저도 감시당하는 느낌 들면 오히려 일 더 안 되더라고요.",
  "jinju-morning-20260716-hospital-app-c02": "은행이든 병원이든 사람한테 물어볼 창구 하나는 남겨뒀으면 합니다.",
  "jinju-morning-20260716-hospital-app-c03": "부모님 대신 앱 눌러드릴 때마다 제가 없으면 어쩌나 싶어요.",
  "jinju-seed-20260716-real-empty-account-c01": "저도 농담처럼 텅장이라 했는데 웃을 일이 아니더라고요.",
  "jinju-seed-20260716-real-empty-account-c03": "재테크 얘기 나오면 할 말 없어서 괜히 물만 마십니다.",
  "jinju-seed-20260716-wedding-money-deleted-contact-c01": "저도 조용히 연락 끊은 친구가 있어요. 싸우지 않아도 끝나는 관계가 있더라고요.",
  "jinju-seed-20260716-wedding-money-deleted-contact-playful-01": "축의금까지 보내고 지운 마음이 어떤 건지 알 것 같아요.",
  "jinju-seed-20260716-bed-is-safe-c04": "편해서 안 나가는 건 괜찮은데 나가는 게 무서워진 거면 좀 걱정될 것 같아요.",
  "jinju-seed-20260716-bed-is-safe-c05": "저도 주말 이틀 내내 이불 안에 있을 때 많아요 ㅋㅋ",
  "jinju-seed-20260716-trust-sign-store-c01": "훔치지 말라는 말만 크게 써 있으면 들어갈 때부터 기분이 좀 그래요.",
  "jinju-seed-20260716-trust-sign-store-c04": "문구 하나 바꾸는 거면 한번 해볼 만하죠.",
  "jinju-seed-20260716-dating-show-ramen-c04": "연애 예능은 그렇게 잘 보면서 제 연애는 하나도 모르겠어요 ㅋㅋ",
  "jinju-seed-20260716-dating-show-ramen-playful-01": "새벽 두 시 라면까지가 본방 사수입니다.",
  "jinju-seed-20260716-childcare-employment-c01": "육아를 도와준다고 말하는 순간부터 좀 이상하죠. 같이 하는 일인데.",
  "jinju-seed-20260716-childcare-employment-playful-01": "육아가 취직이라는 말, 해본 사람은 바로 알 것 같아요.",
  "jinju-proposal-20260716-daangn-senior-phone-playful-01": "저희 부모님도 앱 설명하다가 전화 끊은 적 있어요. 전화 접수 하나 있으면 좋겠네요.",
  "jinju-proposal-20260716-daangn-report-number-playful-01": "신고하고 나서 어떻게 됐는지 몰라서 더 답답할 때 있어요.",
  "jinju-proposal-20260716-no-more-documents-playful-01": "분명 정부가 가진 서류인데 또 떼오라 하면 진짜 허탈해요.",
  "jinju-proposal-20260716-hospital-48h-question-playful-01": "저도 집에만 오면 꼭 질문이 생각나요 ㅠ",
  "jinju-proposal-20260716-bank-evening-c01": "은행 일 보려고 반차 써본 사람이라 저녁 영업 진짜 필요해요.",
  "jinju-proposal-20260716-bank-evening-c04": "전 지점은 무리여도 동네에 한 곳만 늦게 열면 좋겠어요.",
  "jinju-seed-20260716-office-credit-c04": "화가 나는 것보다 아무 감정도 안 드는 날이 더 무섭더라고요.",
  "jinju-seed-20260716-office-credit-c07": "오늘 당장 결정하지 말고 일단 하루라도 쉬었으면 좋겠어요.",
  "jinju-seed-20260716-5am-person-c02": "저도 새벽에 깨면 별생각 다 나요. 계속 그러면 진짜 피곤하죠.",
  "jinju-seed-20260716-5am-person-c03": "남들은 기억도 못 하는데 나만 떠올리는 밤이 있더라고요.",
  "jinju-today-20260715-luxury-home-tax-c04": "100억 집까지 같은 1주택 혜택을 주는 건 좀 아닌 것 같아요.",
  "jinju-today-20260715-luxury-home-tax-c06": "실거주라도 100억이면 세금 기준은 달라야죠.",
  "jinju-today-20260715-coupang-control-c02": "기업이 너무 위축되면 결국 소비자도 손해 볼 수 있다는 걱정은 있어요.",
  "jinju-today-20260715-coupang-control-c04": "저도 빠른 배송 좋아해서 무조건 기업 탓만 하기는 좀 찔립니다.",
  "jinju-hot-seo-hsiyuan-inheritance-c06": "확인도 안 된 얘기를 제목으로 박아버리는 기사가 더 문제 같아요.",
};

const CURATED_IDS: Record<string, string[]> = {
  "jinju-seed-20260723-thursday-feels-friday": ["jinju-seed-20260723-thursday-feels-friday-c01", "jinju-seed-20260723-thursday-feels-friday-c02"],
  "jinju-seed-20260723-familiar-lunch-wins": ["jinju-seed-20260723-familiar-lunch-wins-c01", "jinju-seed-20260723-familiar-lunch-wins-c02"],
  "jinju-seed-20260723-reply-starts-with-apology": ["jinju-seed-20260723-reply-starts-with-apology-c01", "jinju-seed-20260723-reply-starts-with-apology-c02"],
  "jinju-seed-20260723-ai-saved-time": ["jinju-seed-20260723-ai-saved-time-c01", "jinju-seed-20260723-ai-saved-time-c02"],
  "jinju-seed-20260723-apology-before-explanation": ["jinju-seed-20260723-apology-before-explanation-c01", "jinju-seed-20260723-apology-before-explanation-c02"],
  "jinju-seed-20260723-same-elevator-floor": ["jinju-seed-20260723-same-elevator-floor-c01", "jinju-seed-20260723-same-elevator-floor-c02"],
  "jinju-seed-20260723-lunch-meeting": ["jinju-seed-20260723-lunch-meeting-c01", "jinju-seed-20260723-lunch-meeting-c02"],
  "jinju-seed-20260723-five-second-crosswalk": ["jinju-seed-20260723-five-second-crosswalk-c01", "jinju-seed-20260723-five-second-crosswalk-c02"],
  "jinju-seed-20260723-safe-day": ["jinju-seed-20260723-safe-day-c01", "jinju-seed-20260723-safe-day-c02"],
  "jinju-seed-20260722-late-honor-revocation": ["jinju-seed-20260722-late-honor-revocation-c01", "jinju-seed-20260722-late-honor-revocation-c02"],
  "jinju-seed-20260722-math-apology-pressure": ["jinju-seed-20260722-math-apology-pressure-c02", "jinju-seed-20260722-math-apology-pressure-c06"],
  "jinju-seed-20260722-friend-ai-comfort": ["jinju-seed-20260722-friend-ai-comfort-c01", "jinju-seed-20260722-friend-ai-comfort-c09"],
  "jinju-seed-20260722-human-ai-go-handicap": ["jinju-seed-20260722-human-ai-go-handicap-c01", "jinju-seed-20260722-human-ai-go-handicap-c02"],
};

const NAME_FIRST = [
  "느긋한", "솔직한", "푸른", "조용한", "웃는", "말랑한", "산뜻한", "느린",
  "다정한", "엉뚱한", "맑은", "졸린", "담백한", "따뜻한", "수줍은", "명랑한",
  "차분한", "반짝이는", "한숨 돌린", "눈치 빠른", "구름 보는", "마음 놓인", "천천히 걷는", "생각 많은",
  "새벽을 건넌", "점심을 놓친", "퇴근을 기다리는", "한 박자 늦은", "오래 듣는", "살짝 웃는", "기분 좋은", "비스듬한",
];

const NAME_SECOND = [
  "미애", "철수", "수진", "민호", "영희", "정우", "은지", "상호",
  "지영", "동수", "현주", "준호", "선영", "기태", "유진", "성호",
  "참새", "찻잔", "고양이", "구두끈", "너구리", "메모지", "수달", "책갈피",
  "두더지", "우체통", "고슴도치", "연필깎이", "펭귄", "신호등", "나무늘보", "종이배",
];

export function curatedDisplayName(position: number) {
  const firstIndex = position % NAME_FIRST.length;
  const block = Math.floor(position / NAME_FIRST.length);
  const secondIndex = (block + firstIndex * 11) % NAME_SECOND.length;
  return `${NAME_FIRST[firstIndex]} ${NAME_SECOND[secondIndex]}`;
}

function naturalScore(body: string) {
  let score = 0;
  const sentenceCount = body.match(/[.!?…]+(?:\s|$)/g)?.length || 1;
  if (body.length <= 55) score += 5;
  else if (body.length <= 85) score += 3;
  else if (body.length <= 110) score += 1;
  else score -= 3;
  if (sentenceCount <= 1) score += 3;
  else if (sentenceCount === 2) score += 1;
  else score -= 3;
  if (/저도|저는|제가|나는|난 |나도|우리 |우리집|제 /.test(body)) score += 4;
  if (/ㅋㅋ|ㅎㅎ|ㅠ|…|~|진짜|솔직히|은근|그냥|완전|좀 |뭔가|아 /.test(body)) score += 3;
  if (/더라고|잖|거든|네요|듯|인 듯|같아요|맞죠|아닌가요|인가요/.test(body)) score += 2;
  if (/필요합니다|중요합니다|생각합니다|보입니다|바랍니다|검토|장치|구조|기준을|과정이|의미가|해야 합니다|되어야|할 것입니다/.test(body)) score -= 5;
  if (/라는 말|라는 문장|대목|중심처럼|꺼내주셔서|생각하게|마음에 남|가볍게 넘길/.test(body)) score -= 4;
  if (/^[“"]/.test(body)) score -= 5;
  return score;
}

export function curateEditorialComments(postId: string, comments: CuratableComment[], limit = 2, nameOffset = 0) {
  const rewritten = comments.map((comment) => ({
    ...comment,
    body: REWRITES[comment.id] || comment.body,
  }));
  const rewrittenIds = comments.filter((comment) => REWRITES[comment.id]).map((comment) => comment.id);
  const forcedIds = CURATED_IDS[postId] || (rewrittenIds.length >= 2 ? rewrittenIds.slice(0, 2) : undefined);
  if (forcedIds) {
    const byId = new Map(rewritten.map((comment) => [comment.id, comment]));
    return forcedIds.flatMap((id) => {
      const comment = byId.get(id);
      return comment ? [comment] : [];
    }).slice(0, limit).map((comment, index) => ({
      ...comment,
      displayName: curatedDisplayName(nameOffset + index),
    }));
  }
  return rewritten
    .map((comment, index) => ({ comment, index, score: naturalScore(comment.body) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .sort((left, right) => left.index - right.index)
    .map(({ comment }, index) => ({
      ...comment,
      displayName: curatedDisplayName(nameOffset + index),
    }));
}
