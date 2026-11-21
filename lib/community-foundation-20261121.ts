import type { EditorialPost, EditorialComment } from "./editorial";

// 글과 대화는 단일 편집 출처. 실제 이용자 참여 실적에 합산하지 않는다.
export const foundationPosts: EditorialPost[] = [
  {
    "id": "jinju-editorial-20261121-different-opinion",
    "title": "다르게 읽었다는 말, 어디까지 편하게 할 수 있을까요?",
    "content": "같은 책을 읽고도 좋아하는 인물과 마음에 걸린 문장은 다를 수 있어요. 이야기를 나누다가 “저는 그 장면을 조금 다르게 읽었어요”라는 말이 나오면, 틀린 답을 찾기보다 어느 대목에서 그렇게 느꼈는지 듣고 싶어요.\n\n다만 다르게 읽었다는 이유로 사람의 성격까지 판단하면 책 이야기가 갑자기 인사평가가 되겠죠. “그 인물은 왜 좋았어요?”와 “그런 인물을 좋아하는 사람이군요”는 꽤 다른 말이니까요.\n\n생각은 편하게 부딪치고 사람은 편하게 돌아갈 수 있는 대화. 여러분은 의견이 다를 때 어떤 질문을 받으면 말을 더 해보고 싶나요?",
    "category": "질문",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z",
    "heard": 0,
    "same": 0,
    "support": 0,
    "commentCount": 0
  },
  {
    "id": "jinju-editorial-20261121-small-help",
    "title": "위로가 필요한 말에 해결책부터 건네고 있지는 않을까요?",
    "content": "“요즘 좀 지쳐요”라는 말 앞에서 도움을 주고 싶은 마음이 앞설 수 있어요. 일찍 자고, 운동하고, 알림을 끄라는 말까지 금세 줄을 섭니다. 조언은 벌써 달리기 시작했는데, 이야기는 아직 신발도 못 신었을 수 있죠.\n\n“지금은 들어주면 좋을까요, 같이 방법을 찾아볼까요?” 하고 물으면 상대가 원하는 도움을 고를 수 있겠어요. 들어달라는 답을 받았다면, 바로 고칠 부분을 찾기보다 무엇이 가장 버거웠는지 기다려주고요.\n\n반대로 구체적인 도움이 필요할 때는 “괜찮아질 거야”만으로 부족할 수도 있어요. 여러분은 마음이 지친 날 어떤 한마디를 받으면 다음 말을 이어갈 수 있나요?",
    "category": "질문",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z",
    "heard": 0,
    "same": 0,
    "support": 0,
    "commentCount": 0
  }
];
export const foundationPostIds = new Set(foundationPosts.map(post => post.id));
export const foundationComments: (EditorialComment & { postId: string })[] = [
  {
    "postId": "jinju-editorial-20261121-different-opinion",
    "id": "jinju-editorial-20261121-different-opinion-conversation-1",
    "body": "반대 의견을 말해도 되는지는 첫 반응에서 느껴질 것 같아요. 바로 설득하기보다 어느 장면 때문인지 물어주면 좋겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-different-opinion",
    "id": "jinju-editorial-20261121-different-opinion-conversation-2",
    "body": "장면을 묻는 건 좋지만 근거를 대라는 시험처럼 들릴 수도 있겠네요. 말투에도 여백이 필요하겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-different-opinion",
    "id": "jinju-editorial-20261121-different-opinion-conversation-3",
    "body": "“어디가 마음에 남았어요?” 정도면 조금 편하겠죠. 정확한 쪽수를 기억하지 못해도 시작할 수 있고요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-different-opinion",
    "id": "jinju-editorial-20261121-different-opinion-conversation-4",
    "body": "책갈피를 세 개 꽂았는데 정작 말하려던 페이지를 못 찾는 상황도 있겠죠. 기억력까지 토론 참가 자격에 넣으면 의자가 많이 비겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-different-opinion",
    "id": "jinju-editorial-20261121-different-opinion-conversation-5",
    "body": "웃고 넘어갈 여유도 좋지만, 서로 다른 판본을 읽었을 수도 있으니 문장 자체를 확인할 때는 확인해야겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-different-opinion",
    "id": "jinju-editorial-20261121-different-opinion-conversation-6",
    "body": "맞아요. 사실 확인이 필요한 부분과 각자의 느낌을 말하는 부분을 구분하면 덜 엇갈리겠네요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-different-opinion",
    "id": "jinju-editorial-20261121-different-opinion-conversation-7",
    "body": "또 “그건 틀렸어요”보다 “앞 장면과 연결하면 다르게 보이지 않나요?”라고 물으면 같이 다시 읽을 수 있겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-different-opinion",
    "id": "jinju-editorial-20261121-different-opinion-conversation-8",
    "body": "그 질문에도 답을 바로 내놓지 않아도 좋겠어요. 생각해본 적 없는 관점을 만나면 잠깐 조용해질 수도 있으니까요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-different-opinion",
    "id": "jinju-editorial-20261121-different-opinion-conversation-9",
    "body": "침묵을 곧장 동의로 받아들이지 않는 것도 필요하겠네요. 말할 시간을 갖는 것과 의견을 바꾸는 건 다른 일이니까요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-different-opinion",
    "id": "jinju-editorial-20261121-different-opinion-conversation-10",
    "body": "결론을 하나로 맞추지 못해도 어느 장면을 다시 읽고 싶은지가 생기면 충분히 가져갈 것이 있겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-small-help",
    "id": "jinju-editorial-20261121-small-help-conversation-1",
    "body": "해결책이 틀려서보다 아직 이야기가 끝나지 않았는데 결론이 나와서 서운할 수 있겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-small-help",
    "id": "jinju-editorial-20261121-small-help-conversation-2",
    "body": "그렇다고 듣는 사람이 무조건 가만히 있어야 한다면 그것도 어렵겠죠. 어떤 도움이 필요한지 물어볼 수 있는 문장이 반가워요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-small-help",
    "id": "jinju-editorial-20261121-small-help-conversation-3",
    "body": "“오늘 무슨 일이 있었어요?”처럼 한 번에 답할 수 있는 질문이면 말문을 열기 편하겠네요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-small-help",
    "id": "jinju-editorial-20261121-small-help-conversation-4",
    "body": "너무 많은 질문은 설명할 숙제가 될 수도 있어요. 상대가 짧게 말하면 잠깐 같이 있어주는 것도 방법이겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-small-help",
    "id": "jinju-editorial-20261121-small-help-conversation-5",
    "body": "위로에도 과제가 붙으면 힘들겠네요. 지친 사람에게 회의록까지 요구할 필요는 없으니까요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-small-help",
    "id": "jinju-editorial-20261121-small-help-conversation-6",
    "body": "다만 실제로 도와줄 수 있는 일이 있다면 구체적으로 제안하는 게 좋겠어요. “필요하면 말해”는 부탁할 일을 다시 찾아야 하니까요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-small-help",
    "id": "jinju-editorial-20261121-small-help-conversation-7",
    "body": "“이 부분은 제가 맡을 수 있어요”라고 말하되 거절해도 괜찮다는 여유가 있으면 좋겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-small-help",
    "id": "jinju-editorial-20261121-small-help-conversation-8",
    "body": "가능한 만큼만 제안해야 오래 지킬 수 있겠죠. 마음이 앞서서 감당하기 어려운 약속을 하면 서로 곤란해질 수 있고요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-small-help",
    "id": "jinju-editorial-20261121-small-help-conversation-9",
    "body": "듣는 사람도 오늘은 여유가 없다고 말할 수 있어야겠네요. 나중에 이야기할 시간을 함께 정할 수도 있겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  },
  {
    "postId": "jinju-editorial-20261121-small-help",
    "id": "jinju-editorial-20261121-small-help-conversation-10",
    "body": "상대에게 필요한 도움과 지금 줄 수 있는 도움을 함께 확인하는 대화라면, 위로하는 쪽도 받는 쪽도 조금 편해지겠어요.",
    "displayName": "다정한 문장",
    "createdAt": "2026-11-21T13:54:04.749022Z"
  }
];
