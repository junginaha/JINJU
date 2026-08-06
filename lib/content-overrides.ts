import { db, databaseEnabled, ensureSchema } from "./db";

export type ContentOverride = {
  kind: "post" | "comment";
  id: string;
  postId: string;
  title: string | null;
  content: string | null;
  category: string | null;
  displayName: string | null;
  hidden: boolean;
};

const PUBLIC_COMMENT_REWRITES = new Map([
  [
    "jinju-auto-0451693t131i5b2j2s0j-14",
    {
      from: "“아내가 또 가출 했어요”라니, 제목 한 줄이 이미 작은 토론회네요. 입장료는 없지만 각자 가져온 사정은 꽤 묵직합니다.",
      to: "제목 한 줄만으로 작은 토론회가 열렸네요. 입장료는 없지만 각자 가져온 사정은 꽤 묵직합니다.",
    },
  ],
  [
    "jinju-auto-0451693t131i5b2j2s0j-15",
    {
      from: "결국 “아내가 또 가출 했어요”를 어떤 기준으로 바라보느냐가 답을 바꿀 것 같아요. 다른 결론이 나오더라도 서로를 함부로 단정하지 않는 대화였으면 합니다.",
      to: "결국 같은 갈등을 두 사람이 어떤 기준으로 바라보느냐에 따라 답이 달라질 것 같아요. 결론이 다르더라도 서로를 함부로 단정하지 않는 대화였으면 합니다.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-1",
    {
      from: "“최근 정부에서 대통령의 초기 약속과 다르게보유세 강화로 세제 개편안을” 대목에서 상황이 바로 그려졌어요. 웃고 넘길 수도 있지만, 당사자에게는 꽤 오래 남을 만한 순간이었겠네요.",
      to: "약속과 달라졌다고 느낀 지점이 무엇인지 공식 개편안과 함께 확인해보면 좋겠습니다. 세금 이야기는 첫 단추가 사실관계라서요.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-2",
    {
      from: "제목의 “정부세제 개편 어떻게 생각 하나요”라는 질문이 좋습니다. 한쪽을 쉽게 탓하기보다 서로 무엇을 다르게 보고 있는지부터 살펴보게 하네요.",
      to: "세제개편은 표 한 장으로 보이지만 직장 때문에 주소를 옮긴 사람에게는 바로 생활비 문제가 되네요. 실거주하지 못한 이유도 함께 봐야 합니다.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-3",
    {
      from: "“장기보유공제 폐지”라는 대목을 기준으로 보면 답이 한쪽으로만 정리되지는 않겠어요. 무엇을 더 중요하게 보는지에 따라 판단이 꽤 달라질 듯합니다.",
      to: "장기보유공제를 손보려면 오래 보유한 실수요자와 세금만 줄이려는 보유를 구분할 기준이 먼저 필요해 보여요.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-4",
    {
      from: "다만 “최근 정부에서 대통령의 초기 약속과 다르게보유세 강화로 세제 개편안을”만 떼어 놓고 보면 글쓴이와 다른 결론도 가능하겠어요. 같은 장면을 각자 어떻게 읽었는지 이유까지 들어보고 싶습니다.",
      to: "직장 가까이 전세를 얻었다고 보유 주택이 곧 투자용이 되는 건 아니죠. 발령이나 돌봄처럼 피하기 어려운 사정에는 예외가 필요합니다.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-5",
    {
      from: "글에서 제시한 “1주택 미거주자 세금인상”만으로 결론을 내리기 전에 선택지 밖에 빠진 기준은 없는지도 살펴보면 좋겠습니다.",
      to: "실거주를 우대하는 취지는 이해하지만 주소 한 줄로 주거 목적까지 단정하면 억울한 사례가 꽤 생기겠습니다.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-6",
    {
      from: "“종부세 인상”라는 문장이 묘하게 오래 남네요. 제목 한 줄로 시작했는데 댓글창에서는 작은 토론회가 열릴 것 같습니다.",
      to: "종부세를 올리든 내리든 과세 대상과 예상 금액을 먼저 계산해볼 수 있어야 논쟁이 구호에서 생활로 내려올 것 같아요.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-7",
    {
      from: "다른 자리에서 보면 “장기보유공제 폐지”를 전혀 다르게 받아들일 수도 있겠죠. 반대 의견도 사람보다 주장에 초점을 맞추면 더 읽을 만해질 것 같아요.",
      to: "한 채 보유라는 조건만 같을 뿐 현금흐름과 거주 사정은 제각각입니다. 자산가치와 실제 부담 능력을 함께 봐야 하지 않을까요.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-8",
    {
      from: "정답만 고르기보다 “최근 정부에서 대통령의 초기 약속과 다르게보유세 강화로 세제 개편안을”를 왜 그렇게 판단했는지 한 문장씩 덧붙이면 서로의 기준이 더 선명하게 보이겠습니다.",
      to: "세법은 읽을수록 제가 집을 가진 건지 집이 저를 신고하는 건지 헷갈립니다. 사례별 계산표부터 쉽게 공개해줬으면 해요.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-9",
    {
      from: "“1주택 거주자 세금 인하”까지 읽으니 누가 맞는지를 서둘러 정하기보다 각 선택이 어떤 결과로 이어지는지 생각해보게 됩니다.",
      to: "거주자 세금을 낮추는 대신 비거주자 부담을 높이면 직장 이동이 잦은 사람에게는 사실상 이동세처럼 느껴질 수도 있겠네요.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-10",
    {
      from: "이 글의 좋은 점은 “1주택 미거주자 세금인상”를 사소한 일로 접지 않았다는 데 있어요. 작은 불편을 정확히 말하는 사람이 결국 생활의 규칙을 바꾸더라고요.",
      to: "투기 억제라는 목표가 분명해도 정상적인 이사와 파견까지 같은 규칙으로 묶으면 정책의 신뢰가 먼저 흔들릴 수 있습니다.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-11",
    {
      from: "“장기보유공제 폐지”를 읽고 처음 떠오른 답과 조금 생각한 뒤의 답이 달라졌어요. 이런 질문은 결론보다 생각이 바뀌는 과정이 더 흥미롭습니다.",
      to: "공제를 없애면 매물이 늘 거라는 기대도 있지만 오히려 팔지 않고 버티는 사람이 늘 가능성도 함께 따져봐야겠어요.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-12",
    {
      from: "“종부세 인상”에는 완벽한 정답보다 서로 납득할 수 있는 이유가 더 중요할지도 모르겠습니다. 선택은 달라도 설명은 나눌 수 있으니까요.",
      to: "집값이 올랐다고 월급까지 오른 건 아니니 납부 능력 문제는 남습니다. 반대로 큰 자산에 적절한 부담이 필요하다는 주장도 무시하기 어렵고요.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-13",
    {
      from: "작성자가 “최근 정부에서 대통령의 초기 약속과 다르게보유세 강화로 세제 개편안을”를 그냥 삼키지 않고 꺼내줘서 좋네요. 말로 꺼낸 불편은 싸움의 시작이 아니라 조정의 출발점이 될 수도 있습니다.",
      to: "비거주 사유를 선택과 불가피한 사정으로 나눠 심사하면 좋겠습니다. 모든 예외를 막겠다고 현실까지 지우면 규칙이 사람보다 거칠어져요.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-14",
    {
      from: "“정부세제 개편 어떻게 생각 하나요”라니, 제목 한 줄이 이미 작은 토론회네요. 입장료는 없지만 각자 가져온 사정은 꽤 묵직합니다.",
      to: "집은 한 채인데 주소가 두 곳이면 세법 앞에서는 마음까지 두 집 살림이 되네요. 기준은 단순하되 소명 절차는 친절했으면 합니다.",
    },
  ],
  [
    "jinju-auto-303t1k08482d6n4q5x4b-15",
    {
      from: "결국 “1주택 거주자 세금 인하”를 어떤 기준으로 바라보느냐가 답을 바꿀 것 같아요. 다른 결론이 나오더라도 서로를 함부로 단정하지 않는 대화였으면 합니다.",
      to: "실거주자를 보호하면서도 부동산 쏠림을 줄이려는 두 목표가 충돌하네요. 어느 쪽의 비용을 누가 부담하는지 공개해야 토론도 정확해지겠습니다.",
    },
  ],
]);

function publicCommentBody(id: string, body: string) {
  const rewrite = PUBLIC_COMMENT_REWRITES.get(id);
  return rewrite?.from === body ? rewrite.to : body;
}

export async function contentOverrides() {
  const overrides = new Map<string, ContentOverride>();
  if (!databaseEnabled()) return overrides;
  await ensureSchema();
  const rows = await db()`
    SELECT kind, id, post_id, title, content, category, display_name, hidden
    FROM admin_content_overrides`;
  for (const row of rows) {
    const item: ContentOverride = {
      kind: String(row.kind) as ContentOverride["kind"],
      id: String(row.id),
      postId: String(row.post_id || ""),
      title: row.title === null ? null : String(row.title),
      content: row.content === null ? null : String(row.content),
      category: row.category === null ? null : String(row.category),
      displayName: row.display_name === null ? null : String(row.display_name),
      hidden: Boolean(row.hidden),
    };
    overrides.set(`${item.kind}:${item.id}`, item);
  }
  return overrides;
}

export function applyPostOverride<T extends { id: string; title: string; content: string; category: string }>(post: T, overrides: Map<string, ContentOverride>) {
  const override = overrides.get(`post:${post.id}`);
  if (override?.hidden) return null;
  return override ? {
    ...post,
    title: override.title ?? post.title,
    content: override.content ?? post.content,
    category: override.category ?? post.category,
  } : post;
}

export function applyCommentOverrides<T extends { id: string | number; body: string; displayName?: string }>(comments: T[], overrides: Map<string, ContentOverride>) {
  return comments.flatMap((comment) => {
    const override = overrides.get(`comment:${String(comment.id)}`);
    if (override?.hidden) return [];
    return [{
      ...comment,
      body: override?.content ?? publicCommentBody(String(comment.id), comment.body),
      displayName: override?.displayName ?? comment.displayName,
    }];
  });
}

export function hiddenCommentCounts(overrides: Map<string, ContentOverride>) {
  const counts = new Map<string, number>();
  for (const override of overrides.values()) {
    if (override.kind === "comment" && override.hidden) counts.set(override.postId, (counts.get(override.postId) || 0) + 1);
  }
  return counts;
}
