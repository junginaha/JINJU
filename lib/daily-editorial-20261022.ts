import type { EditorialPost, EditorialComment } from "./editorial";

export const october22Candidates = [
  "마지막 한 장을 쓴 사람",
  "식탁 아래의 가방 자리",
  "내일의 나에게 작업을 인계하기",
  "친구의 비밀을 기억하는 방식",
  "다시 물어봐도 괜찮은 설명",
  "작은 성공의 축하 기준",
  "사진 속 내 손가락",
  "안경을 닦았더니 세상이",
  "냉장고 문을 열고 잊은 목적",
  "책의 헌사에 이름 붙이기",
  "장면 속 냄새를 따라 읽기",
  "같은 사건을 다른 인물의 달력에",
  "반찬통 뚜껑 찾기",
  "좋아하는 노래를 끝까지",
  "말실수 정정하기",
  "답장을 대신 고르지 않기",
  "문 앞에서 기다리는 우산",
  "선물 포장 리본",
  "업무 끝의 커서 위치",
  "단체사진에 찍는 사람도"
] as const;

// Current release batch; no historical publication dates or fabricated engagement.
export const october22ReleaseAt = "2026-10-22T18:15:00+09:00";
const articles = [
  {
    "slug": "handoff-to-tomorrow",
    "title": "내일의 나에게 인수인계 한 줄",
    "category": "생활",
    "content": "작업을 멈출 때 어디까지 했는지만 남기면, 다음 날에는 왜 멈췄는지부터 다시 추리하게 될 수 있어요. 파일을 닫기 전에 다음에 할 동작 하나를 적어보세요. ‘보고서 계속’보다 ‘두 번째 표의 합계 확인’처럼 써두면 내일의 내가 오늘의 나에게 물어볼 일이 하나 줄겠죠."
  },
  {
    "slug": "last-sheet-next-person",
    "title": "마지막 한 장 다음에도 사람이 와요",
    "category": "생활",
    "content": "공용 공간에서 휴지를 마지막까지 썼다면 새 묶음을 놓거나, 여분이 없다는 걸 담당자에게 알려보세요. 교체할 위치를 모르는데 억지로 뜯어놓을 필요는 없고요. 다음 사람이 빈 통을 들고 탐정이 되기 전에 작은 단서 하나만 남겨줘도 충분해요."
  },
  {
    "slug": "explanation-second-question",
    "title": "다시 묻는 사람에게 줄 수 있는 여유",
    "category": "관계",
    "content": "길이나 사용법을 알려줬는데 상대가 같은 부분을 다시 물으면, ‘아까 말했잖아’가 먼저 나올 때가 있죠. 이번에는 설명 전체를 반복하기보다 어느 단계부터 헷갈렸는지 물어보면 어떨까요. 다시 질문할 수 있어야 모르면서 고개만 끄덕이는 일도 줄어들겠지요."
  },
  {
    "slug": "small-win-scale",
    "title": "축하에도 당사자의 눈금이 있어요",
    "category": "관계",
    "content": "누군가 처음 혼자 해낸 일을 신나게 말할 때, 내게 쉬운 일이라고 축하까지 작게 할 필요는 없겠죠. 더 어려운 다음 과제를 곧바로 권하기 전에 무엇이 가장 뿌듯했는지 들어봐요. 겨우 첫걸음이라고 부르면 출발선까지 온 수고가 빠질 수 있으니까요."
  },
  {
    "slug": "finger-photo-cameo",
    "title": "풍경 사진에 손가락이 특별 출연",
    "category": "일상",
    "content": "멋진 풍경을 찍었는데 사진 한쪽을 손가락이 가렸다면, 의도치 않게 촬영자까지 단체사진에 들어간 셈이겠네요. 다시 찍을 수 있는 자리라면 화면 모서리를 먼저 보고 한 장 더 남겨봐요. 원본은 지우기 전에 잠깐 웃고요. 산은 멀리 있는데 손가락만 너무 친근하잖아요."
  },
  {
    "slug": "glasses-world-resolution",
    "title": "세상보다 안경을 먼저 닦는 날",
    "category": "일상",
    "content": "창밖 풍경이 유난히 뿌옇게 느껴질 때 안경 렌즈에 얼룩이 묻어 있지는 않은지 살펴봐요. 렌즈 관리 안내에 맞게 닦았더니 얼룩이 사라졌다면, 오늘의 작은 반전은 안경이 맡은 셈이죠. 세상 전체를 새로고침하기 전에 안경 두 알부터 확인하는 아침도 있겠네요."
  },
  {
    "slug": "reading-smell-map",
    "title": "책 속 냄새를 따라 장면 찾기",
    "category": "일상",
    "content": "이번 북클럽에서는 냄새를 묘사한 대목 하나를 골라 앞뒤 장면을 함께 읽어보세요. 같은 냄새를 누군가는 반갑게, 다른 인물은 불편하게 받아들이는지 살피는 거예요. 해석부터 맞히려 하지 말고 본문에서 실제로 확인되는 반응을 짚어보면, 코끝에서 시작한 대화가 인물의 기억으로 이어질 수 있겠죠."
  },
  {
    "slug": "dedication-question",
    "title": "헌사 한 줄 앞에 잠깐 머물기",
    "category": "일상",
    "content": "책에 헌사가 있다면 본문으로 넘어가기 전에 누구에게 건네는 말인지 읽어봐요. 이름만 적혀 있어 관계를 알 수 없다면 추측을 사실처럼 채우지 않고, 그 짧은 문장이 내게 준 첫인상만 나눠도 좋아요. 책을 다 읽은 뒤 다시 보면 같은 한 줄이 다르게 들리는지도 궁금하네요."
  },
  {
    "slug": "song-with-reason",
    "title": "좋아하는 노래에 이유 한 줄 붙이기",
    "category": "관계",
    "content": "친구에게 노래를 보낼 때 링크만 건네는 대신 어느 순간에 떠올랐는지 짧게 덧붙여봐요. ‘너도 꼭 좋아할 거야’보다 ‘산책할 때 네가 말한 풍경이 생각났어’처럼 내 마음을 설명하는 쪽으로요. 상대가 같은 취향이 아니어도 괜찮도록, 감상평 제출 기한은 없는 선물이면 좋겠네요."
  }
];
export const october22EditorialPosts: EditorialPost[] = articles.map(article => ({
  id: `jinju-editorial-20261022-${article.slug}`,
  title: article.title, content: article.content, category: article.category,
  displayName: "진주 운영팀", mode: "이야기",
  createdAt: october22ReleaseAt, updatedAt: october22ReleaseAt,
  heard: 0, same: 0, support: 0, commentCount: 0,
}));
export const october22OperatorPostIds = new Set(october22EditorialPosts.map(post => post.id));

// Reply targets were read from the public API; existing seeded IDs and bodies were excluded.
const replies = [
  {
    "postId": "jinju-daily-20260928-wipe-one-more-table-seat",
    "parentCommentId": "0o452v2r2o485r2n2b4f",
    "recipient": "맑은 물결",
    "body": "흘린 것을 그냥 지나치지 않고 정리하는 행동이 오래 기억에 남으셨군요. 누가 더 낫다고 점수를 매기기보다, 다음 사람이 편하게 지날 자리를 챙긴 모습에서 배울 점을 찾을 수 있겠어요. 작은 사람이 보여준 배려가 어른의 하루에도 남는다는 이야기를 들려주셔서 고마워요."
  },
  {
    "postId": "jinju-daily-20260928-apology-without-intent-first",
    "parentCommentId": "29226a300z4w3i3v2108",
    "recipient": "담담한 정류장",
    "body": "동료와 꼭 가족처럼 지내야 하는 건 아니라는 말씀에는 고개가 끄덕여져요. 다만 관계를 오래 이어갈지와 내가 한 행동을 짚어 사과할지는 따로 생각할 수도 있겠어요. 억지로 가까워지지 않으면서도 필요한 말만 정확히 건네는 거리, 그 정도면 충분한 관계도 있겠지요."
  },
  {
    "postId": "jinju-daily-20260927-write-character-unsaid-line",
    "parentCommentId": "6r0h4x1h2h440k0h2q5i",
    "recipient": "신중한 조율자",
    "body": "한 줄을 넣었더니 북클럽 테이블에 갑자기 추리소설의 배경음악이 깔리네요. 재미있는 건 같은 말도 누가 누구에게 하느냐에 따라 긴장감이 돌 수도, 감춰온 선행을 알아봤다는 다정한 말이 될 수도 있다는 점이에요. 그 인물이 이 말을 끝내 삼켰다면 무엇을 지키려 했을지도 함께 이야기해보고 싶어요."
  },
  {
    "postId": "jinju-daily-20260927-robot-vacuum-sock-commute",
    "parentCommentId": "3n2h460z2p7310163941",
    "recipient": "정갈한 기록",
    "body": "일을 덜려고 들인 친구를 자꾸 구조하러 가게 되면 허탈하시죠. 청소 담당으로 왔는데 집 안에서 숨바꼭질까지 겸하는 셈이네요. 새 제품을 고르기 전에는 자주 멈추는 위치와 주변 물건을 기록해두면, 지금 기기의 안내를 확인하거나 다음 제품의 조건을 비교할 때 도움이 되겠어요. 집 전체를 청소기 눈치에 맞춰 살 필요는 없으니, 반복되는 자리부터 하나씩 살펴보면 좋겠어요."
  },
  {
    "postId": "jinju-daily-20260927-ask-energy-before-date",
    "parentCommentId": "4m3r16113g5e1q0c0b26",
    "recipient": "느린 해안",
    "body": "미안한 마음을 어떻게든 전하고 싶으셨던 것 같아요. 다만 약속을 취소할 때마다 송금까지 해야 하는 규칙이 생기면 쉬는 일에도 청구서가 붙겠죠. 다음 약속은 체력이 허락하는 범위로 줄여 잡고, 어려울 때는 일찍 알려주는 방식도 함께 찾아보면 좋겠어요. 친구에게 건넨 마음과 별개로, 지친 몸까지 벌을 받을 필요는 없으니까요."
  },
  {
    "postId": "jinju-daily-20260927-ask-energy-before-date",
    "parentCommentId": "3n2r5v54502p1f451022",
    "recipient": "또렷한 문장",
    "body": "친구가 싫은 건 아닌데 연락이 조용해서 안심되는 날도 있죠. 그럴 때는 연락이 안 오기만 기다리는 대신 오늘은 쉬고 싶다고 먼저 말해도 괜찮겠어요. 산책을 짧게 줄이는 게 편한지, 아예 다른 날이 좋은지도 내 체력부터 보고 정하고요. 우정에 매번 만보 인증이 필요한 건 아니잖아요."
  },
  {
    "postId": "jinju-daily-20260922-cannot-visit-but-still-miss-you",
    "parentCommentId": "4p3v4m3j156c5x0z4f2w",
    "recipient": "잔잔한 윤슬",
    "body": "마음은 있어도 몸이 따라주지 않는다는 말을 꺼내기까지도 망설여질 수 있겠어요. 용돈을 보내신 마음을 방문보다 못한 것으로만 여기지는 않으셨으면 해요. 여력이 있을 때 짧게 안부를 묻거나 편한 시간에 목소리를 나누는 방법도 있지만, 그것마저 숙제처럼 더 얹을 필요는 없겠지요. 나도 힘들다는 사실을 가족을 덜 사랑한다는 뜻으로 번역하지 않아도 괜찮아요."
  }
];
export function october22OperatorReplies(postId: string): EditorialComment[] {
  return replies.filter(reply => reply.postId === postId).map((reply, index) => ({
    id: `operator-reply-20261022-${reply.parentCommentId}`,
    displayName: "진주 운영팀",
    body: `${reply.recipient}님께 드리는 운영팀 답글이에요. ${reply.body}`,
    createdAt: new Date(Date.parse(october22ReleaseAt) + index).toISOString(),
  }));
}

// Internal audit metadata; not included in public post/comment objects.
export const october22Audit = {
  "checkedAt": "2026-10-22T06:08:00+09:00",
  "baseCommit": "b44b1360cdc5e2f0802ba3270cfcc69ad31f9867",
  "publicPostCount": 654,
  "builtInPostCount": 642,
  "recentPostCount": 77,
  "recentCommentCount": 809,
  "commentFallbackResponses": 0,
  "editorialMissingDates": [
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
  "replyTargets": [
    {
      "postId": "jinju-daily-20260928-wipe-one-more-table-seat",
      "commentId": "0o452v2r2o485r2n2b4f",
      "createdAt": "2026-09-29T19:14:08.000Z"
    },
    {
      "postId": "jinju-daily-20260928-apology-without-intent-first",
      "commentId": "29226a300z4w3i3v2108",
      "createdAt": "2026-09-29T19:14:45.000Z"
    },
    {
      "postId": "jinju-daily-20260927-write-character-unsaid-line",
      "commentId": "6r0h4x1h2h440k0h2q5i",
      "createdAt": "2026-09-29T19:15:43.000Z"
    },
    {
      "postId": "jinju-daily-20260927-robot-vacuum-sock-commute",
      "commentId": "3n2h460z2p7310163941",
      "createdAt": "2026-09-29T19:17:56.000Z"
    },
    {
      "postId": "jinju-daily-20260927-ask-energy-before-date",
      "commentId": "4m3r16113g5e1q0c0b26",
      "createdAt": "2026-09-29T19:17:04.000Z"
    },
    {
      "postId": "jinju-daily-20260927-ask-energy-before-date",
      "commentId": "3n2r5v54502p1f451022",
      "createdAt": "2026-09-29T19:18:34.000Z"
    },
    {
      "postId": "jinju-daily-20260922-cannot-visit-but-still-miss-you",
      "commentId": "4p3v4m3j156c5x0z4f2w",
      "createdAt": "2026-09-29T19:19:47.000Z"
    }
  ],
  "notes": [
    "후보 20개를 기존 내장 642편과 공개 654편에 대조. 최근 공개 77편의 댓글 809개를 읽기 확인.",
    "비밀·반찬통·단체사진 후보는 기존 주제와 겹쳐 제외. 업무 커서 후보는 인수인계와 중복되어 통합.",
    "9편은 시의성 있는 뉴스가 아닌 운영팀의 생활·관계·독서 제안. 가상의 개인 경험이나 최신 소식으로 포장하지 않으며 외부 뉴스 사실 주장이 없음.",
    "댓글 7개는 기존 내장 댓글 ID·본문과 불일치하고 공개 댓글 POST 경로의 저장 ID 형식과 일치. 저장소 전체에서도 해당 ID를 확인해 시드 원고가 아님을 대조. 다른 이용자 행세 없이 운영팀 명의로만 답함.",
    "누락 날짜에 대응하는 미게시 원고는 main에서 확인되지 않음. 오늘 9편은 보완 첫 배치이며 과거 날짜 22일분 전체가 완료되었다고 표시하지 않음.",
    "기존 게시물·댓글·반응은 보존. 새 글 9편의 좋아요·댓글 0 시작. 기존의 좋아요 최소값 보정은 이번 신규 ID 9개에만 적용하지 않음.",
    "공개 후 예정 댓글은 생성하지 않음. 새 글에는 운영팀 댓글도 없음. 기존 실제 댓글에만 현재 배치 시각으로 답글.",
    "최근30일 외 이용자 댓글은 이 실행에서 조회하지 않았으며 미확인으로 남김."
  ]
} as const;
