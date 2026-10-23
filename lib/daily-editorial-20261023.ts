import type { EditorialPost } from "./editorial";

export const october23ReleaseAt = "2026-10-23T06:15:00+09:00";
export const october23Candidates = [
  "공용 컵의 손잡이 방향", "작은 부품을 옮기는 쟁반", "처음 듣는 이름의 발음", "취미 없는 자기소개", "오래 빌린 물건의 사용법", "문고리에 붙잡힌 소매", "고맙다가 고구마가 되는 자동완성", "소설의 괄호 안과 밖", "소설의 잠을 깨우는 소리", "냉장고 문이 열릴 자리", "사진 속 손가락", "독서 모임의 헌사", "친구에게 보내는 노래", "안경 닦기", "반려 화분 이름짓기", "보증서 사진 보관", "반복 질문에 답하기", "작은 성공 축하하기", "목차부터 고르는 독서", "양말을 옮기는 청소기"
] as const;
const articles = [
  { slug: "cup-handle-reach", title: "컵 손잡이도 방향을 물어보면", category: "생활", content: "다른 사람에게 빈 컵을 건넬 때 손잡이를 어느 쪽으로 두면 잡기 편한지 물어봐요. 내가 익숙한 방향이 상대에게도 편한 방향은 아닐 수 있으니까요. 거창한 취향 조사까지는 필요 없고, 컵 하나가 손에 잘 들어가는 정도의 배려면 충분하겠죠." },
  { slug: "small-parts-tray", title: "작은 물건 이사에는 쟁반 한 장", category: "생활", content: "책상 서랍을 닦으려고 클립과 작은 부품을 꺼낼 때는 넓고 얕은 쟁반에 잠시 모아보세요. 책상 위에 바로 흩어두면 다시 넣으려는 순간 하나씩 행방을 묻게 될 수 있어요. 종류별로 자리를 나눠 옮기고 마지막에 쟁반을 확인하면, 정리가 끝난 뒤 바닥 수색까지 이어지는 일을 줄일 수 있겠네요." },
  { slug: "name-pronunciation", title: "처음 듣는 이름을 다시 물을 용기", category: "관계", content: "처음 만난 사람의 이름을 잘못 들었다면 대충 비슷하게 부르기보다 발음을 한 번 더 물어봐요. 상대가 알려준 대로 짧게 되짚고, 이름이 낯설다는 감상까지 길게 덧붙이지 않아도 괜찮아요. 정확히 부르고 싶어서 묻는다는 마음이 전해지면, 두 번째 인사는 조금 더 편해질 수 있겠죠." },
  { slug: "hobby-introduction", title: "취미란이 비어 있어도 자기소개는 가능", category: "관계", content: "모임에서 취미를 말할 차례인데 근사한 활동이 떠오르지 않는다면, 요즘 잠깐 기분 좋아지는 순간을 이야기해도 좋겠어요. 잘 익은 과일을 고르거나 아침에 커튼을 여는 일처럼 자격증도 장비도 필요 없는 순간이요. 자기소개가 취미 대회의 예선은 아니니, 아직 이름 붙이지 않은 즐거움도 데려와요." },
  { slug: "borrowed-tool-note", title: "빌려주는 물건에 요령도 한 줄", category: "관계", content: "익숙하게 쓰던 물건을 빌려줄 때는 내가 당연하게 아는 사용 요령이 있는지 떠올려봐요. 가방 지퍼가 어느 방향으로 열리는지처럼 작지만 처음 쓰는 사람은 모를 수 있는 부분이요. 문제가 있는 물건은 먼저 상태를 알리고, 설명이 필요한 물건에는 원래 안내서도 함께 건네면 마음 편하게 빌려줄 수 있겠어요." },
  { slug: "sleeve-door-handle", title: "출발 직전에 소매가 면담을 신청", category: "일상", content: "집을 나서려는데 소매가 문고리에 걸리면, 옷만 아직 할 말이 남은 것 같은 순간이죠. 급한 마음에 그대로 당기기보다 한 걸음 돌아와 천천히 풀어줘요. 나를 붙잡은 게 거창한 운명이 아니라 넓은 소매였다는 걸 알면, 지각 사유는 못 되어도 혼자 웃을 이유는 되겠네요." },
  { slug: "autocorrect-sweet-potato", title: "고맙다고 쓰려다 고구마를 보냈다면", category: "일상", content: "자동완성 때문에 엉뚱한 말이 전송됐다면, 가령 고맙다는 인사가 고구마가 됐다면 어떻게 수습하시겠어요. 짧게 바로잡고 원래 전하려던 마음을 한 번 더 적으면 충분하겠죠. 감사가 잠깐 농산물로 배송됐을 뿐이니, 정정문까지 너무 비장할 필요는 없어요." },
  { slug: "parentheses-voice", title: "괄호 안에서 목소리가 달라진다면", category: "일상", content: "함께 읽는 책에 괄호가 있다면, 괄호 밖 문장과 안쪽 문장을 번갈아 소리 내 읽어봐요. 안쪽이 단순한 보충 설명인지, 앞의 말을 슬쩍 의심하거나 고치는 말인지 주변 문장으로 확인하는 거예요. 괄호를 잠깐 빼고 읽었을 때 사라지는 느낌까지 나누면 작은 문장부호로도 대화가 길어질 수 있겠죠." },
  { slug: "wake-up-sound", title: "소설 속 아침은 무슨 소리로 시작하나요", category: "일상", content: "소설에서 인물이 잠에서 깨는 장면을 찾아 무엇이 잠을 깨웠는지 읽어봐요. 본문에 소리가 없다면 없다고 두고, 자명종이나 새소리를 상상으로 채워 넣지는 않는 거예요. 깬 직후 인물이 가장 먼저 하는 행동까지 함께 보면 그날의 시작을 독자마다 어떻게 받아들였는지 이야기할 수 있겠어요." },
];
export const october23EditorialPosts: EditorialPost[] = articles.map(article => ({
  id: `jinju-editorial-20261023-${article.slug}`, title: article.title, content: article.content,
  category: article.category, displayName: "진주 운영팀", mode: "이야기",
  createdAt: october23ReleaseAt, updatedAt: october23ReleaseAt,
  heard: 0, same: 0, support: 0, commentCount: 0,
}));
export const october23OperatorPostIds = new Set(october23EditorialPosts.map(post => post.id));

export const october23ReplyTargets = [
  { postId: "jinju-editorial-20261022-handoff-to-tomorrow", commentId: "3l036n1b2i0o5i3q021f", createdAt: "2026-10-22T11:22:42.000Z" },
  { postId: "jinju-editorial-20261022-finger-photo-cameo", commentId: "556x18013s3o17574v4q", createdAt: "2026-10-22T11:23:21.000Z" },
] as const;
const replyBodies = [
  "은은한 바람님, 정시에 퇴근하면서도 하루의 일을 기록해두셨다니, 신비의 일잘러에게 사실은 아주 성실한 기록 담당자가 있었네요. 오래 앉아 있는 모습보다 무엇을 했는지가 남는다는 점도 좋고요. 업무일지 끝에 다음에 확인할 것 한 줄까지 적어두면 다음 날의 나에게 건네는 인수인계도 되겠어요. 퇴근한 뒤에는 일지에게 설명을 맡기고, 바람님은 편안히 쉬실 수 있기를 바라요.",
  "다정한 정원님, 사진을 지우기 전에 수정해보는 선택지도 있겠네요. 손가락은 촬영 때만 잠깐 도왔는데 결과물에서는 주연 자리를 차지했으니까요. 다만 수정본이 마음에 드는지는 원본과 나란히 놓고 배경까지 살펴보면 좋겠어요. 잘 나온 풍경을 남길지, 웃긴 실수까지 추억으로 둘지는 찍은 사람이 고르면 되겠죠. 원본을 따로 남겨두면 두 가지 즐거움 사이에서 급히 하나를 포기하지 않아도 되겠어요.",
];
export function october23OperatorReplies(postId: string) {
  return october23ReplyTargets.flatMap((target, index) => target.postId === postId ? [{
    id: `operator-reply-20261023-${target.commentId}`, displayName: "진주 운영팀",
    body: replyBodies[index], createdAt: october23ReleaseAt,
  }] : []);
}

// Internal audit, never included in public post objects.
export const october23Audit = {
  "checkedAt": "2026-10-23T06:07:25+09:00",
  "publicPosts": 664,
  "recentPostsAudited": 87,
  "recentCommentsAudited": 827,
  "missingEditorialDates": [
    "2026-09-24",
    "2026-09-25",
    "2026-09-26",
    "2026-09-29",
    "2026-09-30",
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-10",
    "2026-10-11",
    "2026-10-12",
    "2026-10-13",
    "2026-10-14",
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-20"
  ],
  "existingRepliesNotRepeated": 7,
  "newReplyTargets": 2,
  "backlogStatus": "Sequential second batch; no historical timestamps; missing dates remain historical gaps.",
  "editorialEvidence": "Evergreen operator suggestions and explicitly hypothetical humor; no news or unverifiable first-person experience.",
  "candidateSelection": "First nine selected; remaining eleven excluded for overlap or weaker distinction from existing topics.",
  "commentScope": "Public posts since September 22; stored comments excluding known seed IDs/bodies and auto IDs; only two new stored targets receive replies."
} as const;
