import type { Metadata } from "next";
import styles from "./start.module.css";

export const metadata: Metadata = {
  title: "처음 오셨나요? 내 생각을 나누는 진주.kr",
  description: "책을 다 못 읽은 마음부터 관계에서 꺼내기 어려운 이야기까지. 진주.kr에서 다른 관점을 읽고, 이름과 연락처를 입력하지 않고 내 생각을 나눠보세요.",
  alternates: { canonical: "/start" },
  openGraph: { title: "말하지 못한 한 가지, 여기 놓고 가세요", description: "다른 관점을 읽고, 내 생각을 나누는 진주.kr", url: "/start", type: "website" },
};

const topics = [
  { slug: "unfinished-book", label: "책과 모임", title: "책을 끝내지 못해도 북클럽에 가도 될까요?", text: "완독한 사람도, 책갈피가 중간인 사람도. 함께 읽는 모임의 문턱을 이야기해요." },
  { slug: "year-end-invitation", label: "연말과 관계", title: "반가운 초대인데, 먼저 돌아가고 싶다면", text: "반가운 마음과 체력은 따로 오니까요. 부담 없이 만나는 방법을 골라봐요." },
  { slug: "reply-later", label: "연락과 마음", title: "답장을 기다리는 마음에도 기준이 필요할까요?", text: "재촉하고 싶지는 않고, 마냥 기다리기도 어려울 때. 서로 편한 한마디를 찾아요." },
];

export default function StartPage() {
  return <main className={styles.page}>
    <header className={styles.header}><a href="/" aria-label="진주.kr 홈">진주<span>할 말은 하세요!</span></a><a href="/about">어떤 곳인가요?</a></header>
    <section className={styles.hero}>
      <p className={styles.eyebrow}>처음 오신 분께</p>
      <h1>말하지 못한 한 가지,<br />여기 놓고 가세요.</h1>
      <p>책을 읽다 남은 질문도,<br />가까운 사람에게 꺼내기 어려운 마음도.<br />다른 관점을 읽고 내 생각을 보태는 곳, 진주입니다.</p>
      <a className={styles.primary} href="/?write=1">내 이야기 쓰기 <span aria-hidden="true">↗</span></a>
      <p className={styles.note}>이름·전화번호 입력 없이 시작해요. 글은 공개되며 안전 검수를 거쳐요.</p>
    </section>
    <section aria-labelledby="start-topics"><p className={styles.eyebrow}>먼저 읽고 싶은 이야기</p><h2 id="start-topics">어느 질문에 마음이 가나요?</h2>
      <div className={styles.topics}>{topics.map(topic => <a key={topic.slug} className={styles.topic} href={`/post/jinju-editorial-20261117-${topic.slug}`}><span>{topic.label}</span><h3>{topic.title}</h3><p>{topic.text}</p><strong>대화 읽고 내 생각 보태기 →</strong></a>)}</div>
      <p className={styles.note}>이 세 글에는 서로 다른 관점을 담은 ‘대화 예시’가 포함되어 있어요. 예시 댓글마다 표시했으며 실제 이용자의 경험담이 아닙니다.</p>
    </section>
    <section className={styles.how}><h2>첫 글은 세 문장이면 좋아요.</h2><ol><li>어떤 상황이었는지.</li><li>어떤 마음이 들었는지.</li><li>다른 사람에게 무엇을 묻고 싶은지.</li></ol><p>본문은 30자 이상. 실명·연락처나 누군가를 알아볼 수 있는 정보는 빼주세요. 초안은 등록 전까지 이 기기에 보관돼요.</p><a className={styles.primary} href="/?write=1">지금 한 가지 이야기하기 <span aria-hidden="true">↗</span></a></section>
    <footer className={styles.footer}><a href="/">전체 이야기</a><a href="/principles">운영원칙</a><a href="/privacy">개인정보 안내</a></footer>
  </main>;
}
