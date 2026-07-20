"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";

type Post = {
  category: string;
  date: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
  temperature: number;
};

const topics = ["전체", "일상", "관계", "직장", "돈", "사회", "제안", "질문", "광고 홍보"];

const seedPosts: Post[] = [
  { category: "직장", date: "2026. 7. 19.", title: "“잘 쉬셨죠?”라는 말 뒤에는 왜 늘 일이 따라올까요", body: "네, 잘 쉬었습니다.\n진심은 한 줄인데, 오늘 할 일은 벌써 화면을 가득 채웠네요.", likes: 32, comments: 6, temperature: 11 },
  { category: "직장", date: "2026. 7. 18.", title: "실수한 사람이 커피를 사는 문화, 오늘 제가 끝냈습니다", body: "아침 회의 자료에 날짜를 하루 잘못 적었습니다.\n제 실수는 수정 대상이지 팀 전체 음료 이용권은 아니니까요.", likes: 55, comments: 6, temperature: 19 },
  { category: "관계", date: "2026. 7. 19.", title: "어머니가 제 사진을 가족 단체방에 올렸습니다", body: "결국 사진은 내려갔습니다. 대신 어머니가 서운해하십니다.\n제 초상권을 지켰는데 효도가 조금 깎인 기분이네요.", likes: 63, comments: 6, temperature: 15 },
  { category: "돈", date: "2026. 7. 19.", title: "안 쓰는 구독을 해지했더니 월급이 조금 자랐습니다", body: "연봉은 그대로인데 월급이 몰래 승진한 기분입니다.\n그동안 제 통장이 제 가능성까지 구독하고 있었네요.", likes: 71, comments: 6, temperature: 8 },
  { category: "일상", date: "2026. 7. 19.", title: "엘리베이터 닫힘 버튼을 눌렀는데 이웃이 뛰어왔습니다", body: "다음에 마주치면 먼저 말하려고 합니다.\n“그날 제 손가락이 사회생활을 망쳤습니다.”", likes: 84, comments: 6, temperature: 3 },
  { category: "제안", date: "2026. 7. 19.", title: "아파트 방송은 첫 문장에 용건부터 말해줬으면 합니다", body: "주민의 관심은 짧고 샴푸 거품은 오래갑니다.\n중요한 내용부터 들려주세요.", likes: 68, comments: 7, temperature: 12 }
];

function Pearl({ size = 44 }: { size?: number }) {
  return <Image src="/jinju-pearl-cutout.png" alt="" width={size} height={size} priority />;
}

export default function JinjuApp() {
  const [intro, setIntro] = useState(true);
  const [topic, setTopic] = useState("전체");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState(seedPosts);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("일상");

  const filtered = useMemo(() => posts.filter((post) => {
    const categoryMatch = topic === "전체" || post.category === topic;
    const queryMatch = `${post.title} ${post.body}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatch && queryMatch;
  }), [posts, query, topic]);

  function publish(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setPosts((current) => [{
      category,
      date: new Intl.DateTimeFormat("ko-KR").format(new Date()),
      title: title.trim() || body.trim().split("\n")[0].slice(0, 42),
      body: body.trim(),
      likes: 0,
      comments: 0,
      temperature: 50
    }, ...current]);
    setTitle("");
    setBody("");
  }

  return (
    <>
      {intro && (
        <section className="intro" aria-label="진주 서비스 인트로">
          <div className="introGlow introGlowOne" />
          <div className="introGlow introGlowTwo" />
          <div className="introCenter">
            <div className="introBrand">
              <button className="introPearl" onClick={() => setIntro(false)} aria-label="바로 들어가기"><Pearl size={156} /></button>
              <button className="introSkip" onClick={() => setIntro(false)}>바로 들어가기 <span>↗</span></button>
            </div>
            <p className="introMessage"><span>인간적으로,</span><strong>할 말은 하세요!</strong></p>
            <h1 className="introWordmark"><b>진</b>실의 <b>주</b>둥이</h1>
            <p className="introSignature">JINJU IS AN ANONYMOUS COMMUNITY WITH ZERO PERSONAL DATA</p>
          </div>
          <div className="introLoader"><span><i><Pearl size={18} /> 개운하게~</i></span></div>
        </section>
      )}

      <div className="min-h-screen bg-paper text-ink">
        <aside className="sidebar">
          <a href="#" className="brand"><Pearl /><span><strong>진주</strong><small>할 말은 하세요!</small></span></a>
          <a className="newPost" href="#write"><span>＋</span> 새 의견 쓰기</a>
          <p className="sideLabel">게시판</p>
          <nav className="sideNav">
            {topics.map((item) => <button key={item} className={topic === item ? "active" : ""} onClick={() => setTopic(item)}><span>{item === "전체" ? "◉" : "#"}</span>{item}</button>)}
          </nav>
          <p className="sideLabel">피드</p>
          <nav className="sideNav"><button className="active"><span>◷</span>최신 의견</button><button><span>↗</span>인기 의견</button></nav>
          <footer className="sideFooter">
            <div><a href="#beta">공개 베타</a><a href="#principles">운영원칙</a><a href="#safe">안전 안내</a><a href="#privacy">개인정보</a></div>
            <p>개인정보를 운영 데이터로 수집하지 않습니다.</p>
          </footer>
        </aside>

        <main className="main">
          <header className="mobileHeader"><a href="#"><Pearl size={36} /><span><strong>진주</strong><small>할 말은 하세요!</small></span></a><a href="#write">나의 의견</a></header>
          <div className="feedShell">
            <header className="feedHeading"><div><p>공개 베타 · 아무도 몰라요 · 개인정보 0%</p><h1>새로운 익명 의견</h1></div><span>{posts.length}개의 공개 의견</span></header>
            <section className="betaNotice" id="beta">
              <div><strong>공개 베타 운영 중</strong><p>조개가 아픔을 감내하며 귀한 보석을 만들어내듯, 사용자의 상처받은 경험과 진짜 속마음을 소중하게 품어주는 다정하고 정제된 공간입니다.</p><small>정식 오픈 전 실제 사용 환경을 점검하고 있습니다. 글쓰기·검색·신고·삭제 흐름을 우선 안정화합니다.</small></div>
              <nav><a href="#beta">베타 안내</a><a href="mailto:hello@xn--o55b9n.kr">문제 제보</a><a href="#write">내 글 쓰기</a></nav>
            </section>
            <form className="search" onSubmit={(event) => event.preventDefault()}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="무엇이든 검색해 보세요" aria-label="의견 검색어" /><button aria-label="검색">↑</button></form>
            <div className="topicStrip">{topics.map((item) => <button key={item} className={topic === item ? "active" : ""} onClick={() => setTopic(item)}>{item}</button>)}</div>
            <section className="postFeed">
              {filtered.slice(0, 3).map((post, index) => <PostCard key={`${post.title}-${index}`} post={post} onLike={() => setPosts((current) => current.map((item) => item === post ? { ...item, likes: item.likes + 1 } : item))} />)}
            </section>

            <section className="composerSection" id="write">
              <div className="composerTitle"><Pearl size={58} /><div><p>하세요!</p><h2>익명 의견 남기기</h2></div></div>
              <form className="composer" onSubmit={publish}>
                <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="게시판 선택">{topics.slice(1, 8).map((item) => <option key={item}>{item}</option>)}</select>
                <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="비워두면 본문에서 제목을 추천합니다" aria-label="의견 제목" />
                <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={7} placeholder={"익명의 무게만큼, 책임의 무게도 함께 들어주세요.\n개운하게~"} aria-label="의견 본문" />
                <p className="composerGuide">내가 겪은 일 · 내가 느낀 마음 · 무엇이 문제였는지 · 개운하게...</p>
                <div className="composerBottom"><span>제목 {title.length}/80 · 본문 {body.length}/2,000</span><div><button type="button" onClick={() => { setTitle(""); setBody(""); }}>지우기</button><button className="submit" type="submit">확인 <b>↑</b></button></div></div>
              </form>
            </section>
            <section className="postFeed continued">{filtered.slice(3).map((post, index) => <PostCard key={`${post.title}-${index}`} post={post} onLike={() => setPosts((current) => current.map((item) => item === post ? { ...item, likes: item.likes + 1 } : item))} />)}</section>
            {!filtered.length && <p className="empty">아직 이 조건에 맞는 의견이 없어요.</p>}
            <section className="bottomCta"><Pearl size={42} /><div><strong>할 말은 하세요!</strong><span>개운하게~</span></div><a href="#write">의견 남기기</a></section>
          </div>
        </main>
      </div>
    </>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: () => void }) {
  return (
    <article className="post">
      <div className="postMeta"><span>{post.category}</span><time>{post.date}</time></div>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
      <div className="temperature"><div><span>OK</span><span>Not OK</span></div><div className="track"><i style={{ left: `${post.temperature}%` }}><Pearl size={20} /></i></div></div>
      <div className="postActions"><button onClick={onLike}>좋아요 <span>{post.likes}</span></button><button>싫어요</button><button>댓글 <span>{post.comments}</span></button><button onClick={() => navigator.clipboard?.writeText(location.href)}>공유하기</button><a href="mailto:hello@xn--o55b9n.kr">의견 보내기</a></div>
    </article>
  );
}
