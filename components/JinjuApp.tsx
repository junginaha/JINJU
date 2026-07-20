"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Intro from "./Intro";
import PostTemperature from "./PostTemperature";

type SpeechRecognitionLike = { lang:string; continuous:boolean; interimResults:boolean; start:()=>void; stop:()=>void; abort:()=>void; onresult:((event:{resultIndex:number;results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>})=>void)|null; onend:(()=>void)|null; onerror:(()=>void)|null };
type SpeechRecognitionConstructor = new()=>SpeechRecognitionLike;
type VoiceState="idle"|"listening"|"recording"|"transcribing";
type VoiceField="title"|"body";
type VoiceSnapshot={field:VoiceField;title:string;body:string};
declare global { interface Window { SpeechRecognition?:SpeechRecognitionConstructor; webkitSpeechRecognition?:SpeechRecognitionConstructor } }

type Comment = {
  id: number | string;
  body: string;
  createdAt: string;
  displayName?: string;
};

type Post = {
  id: string;
  category: string;
  date: string;
  title: string;
  content: string;
  heard: number;
  same: number;
  comments: Comment[];
};

const topics = ["전체", "일상", "관계", "직장", "돈", "사회", "제안", "질문", "광고 홍보"];

const seedPosts: Post[] = [
  {
    id: "rested-then-work",
    category: "직장",
    date: "2026. 7. 19.",
    title: "“잘 쉬셨죠?”라는 말 뒤에는 왜 늘 일이 따라올까요",
    content: "네, 잘 쉬었습니다.

진심은 한 줄인데, 오늘 할 일은 벌써 화면을 가득 채웠네요.

쉬었다는 사실이 업무를 더 받을 준비가 되었다는 뜻은 아닐 텐데요. 잘 쉬었는지 묻는 말이 정말 안부로 끝나는 날도 있었으면 합니다.",
    heard: 32,
    same: 4,
    comments: []
  },
  {
    id: "coffee-mistake-culture",
    category: "직장",
    date: "2026. 7. 18.",
    title: "실수한 사람이 커피를 사는 문화, 오늘 제가 끝냈습니다",
    content: "아침 회의 자료에 날짜를 하루 잘못 적었습니다.

별것 아닌데 이상하게 개운합니다. 제 실수는 수정 대상이지 팀 전체 음료 이용권은 아니니까요.

잘못은 바로잡았고 다음부터 확인하겠다고 말했습니다. 커피 대신 체크리스트를 만들었습니다.",
    heard: 55,
    same: 8,
    comments: []
  },
  {
    id: "family-chat-photo",
    category: "관계",
    date: "2026. 7. 19.",
    title: "어머니가 제 사진을 가족 단체방에 올렸습니다",
    content: "주말에 부모님 댁에서 소파에 누워 잠든 적이 있습니다.

결국 사진은 내려갔습니다. 대신 어머니가 서운해하십니다. 제 초상권을 지켰는데 효도가 조금 깎인 기분이네요.

가족이라도 사진을 올리기 전에 한 번 물어봐 주면 좋겠습니다.",
    heard: 63,
    same: 11,
    comments: []
  },
  {
    id: "unused-subscriptions",
    category: "돈",
    date: "2026. 7. 19.",
    title: "안 쓰는 구독을 해지했더니 월급이 조금 자랐습니다",
    content: "통장에서 매달 빠져나가는 돈을 확인했습니다.

연봉은 그대로인데 월급이 몰래 승진한 기분입니다. 그동안 제 통장이 제 가능성까지 구독하고 있었네요.

작지만 다시 내 선택으로 돌아온 돈이 반갑습니다.",
    heard: 71,
    same: 6,
    comments: []
  },
  {
    id: "elevator-close-button",
    category: "일상",
    date: "2026. 7. 19.",
    title: "엘리베이터 닫힘 버튼을 눌렀는데 이웃이 뛰어왔습니다",
    content: "저녁에 장바구니를 양손에 들고 엘리베이터를 탔습니다.

다음에 마주치면 먼저 말하려고 합니다. “그날 제 손가락이 사회생활을 망쳤습니다.”

문이 닫히는 몇 초가 이렇게 오래 기억에 남을 줄 몰랐습니다.",
    heard: 84,
    same: 3,
    comments: []
  },
  {
    id: "apartment-broadcast-first",
    category: "제안",
    date: "2026. 7. 19.",
    title: "아파트 방송은 첫 문장에 용건부터 말해줬으면 합니다",
    content: "밤 아홉 시에 아파트 방송이 나왔습니다.

주민의 관심은 짧고 샴푸 거품은 오래갑니다. 중요한 내용부터 들려주세요.

언제, 어디서, 무엇을 하는지 먼저 말한 다음 설명을 이어가면 좋겠습니다.",
    heard: 68,
    same: 9,
    comments: []
  }
];

function Pearl({ size = 44, className = "" }: { size?: number; className?: string }) {
  return <Image className={className} src="/jinju-pearl-cutout.png" alt="" width={size} height={size} priority />;
}

export default function JinjuApp() {
  const [showIntro, setShowIntro] = useState(true);
  const [introReady, setIntroReady] = useState(false);
  const [posts, setPosts] = useState(seedPosts);
  const [topic, setTopic] = useState("전체");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [query, setQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [category, setCategory] = useState("일상");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [voiceState,setVoiceState]=useState<VoiceState>("idle");
  const [activeVoiceField,setActiveVoiceField]=useState<VoiceField>("body");
  const [voiceMessage,setVoiceMessage]=useState("");
  const [voiceUndo,setVoiceUndo]=useState<VoiceSnapshot|null>(null);
  const [micPromptOpen,setMicPromptOpen]=useState(false);
  const [micPermissionBusy,setMicPermissionBusy]=useState(false);
  const [micPermissionReady,setMicPermissionReady]=useState(false);
  const recognitionRef=useRef<SpeechRecognitionLike|null>(null),recorderRef=useRef<MediaRecorder|null>(null),streamRef=useRef<MediaStream|null>(null),chunksRef=useRef<Blob[]>([]),voiceFieldRef=useRef<VoiceField>("body"),voiceBaseRef=useRef(""),browserTranscriptRef=useRef("");

  const loadPosts = useCallback(async () => {
    try {
      const response = await fetch("/api/posts", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { posts?: Array<Omit<Post, "date" | "comments"> & { createdAt: string; commentCount?: number }> };
      if (!data.posts?.length) return;
      setPosts(data.posts.map((post) => ({
        ...post,
        date: new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(post.createdAt)),
        comments: Array.from({ length: post.commentCount ?? 0 }, (_, index) => ({ id: `count-${index}`, body: "", createdAt: "" })),
      })));
    } catch {
      // The editorial feed remains available if the database is temporarily unavailable.
    }
  }, []);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  useEffect(() => {
    let seen = false;
    try {
      const forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
      seen = !forceIntro && Boolean(sessionStorage.getItem("jinju-intro-seen-v1"));
    } catch {
      seen = false;
    }
    setShowIntro(!seen);
    setIntroReady(true);
  }, []);

  useEffect(() => {
    const syncPostFromUrl = () => {
      const postId = new URLSearchParams(window.location.search).get("post");
      setSelectedPostId(postId || null);
    };
    syncPostFromUrl();
    window.addEventListener("popstate", syncPostFromUrl);
    return () => window.removeEventListener("popstate", syncPostFromUrl);
  }, []);

  const completeIntro = useCallback(() => {
    window.history.replaceState({}, "", "/");
    setSelectedPostId(null);
    setShowIntro(false);
    window.scrollTo({ top: 0 });
  }, []);

  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null;
  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts
      .filter((post) => topic === "전체" || post.category === topic)
      .filter((post) => !normalized || `${post.title} ${post.content}`.toLowerCase().includes(normalized))
      .sort((a, b) => sort === "popular" ? (b.heard + b.same) - (a.heard + a.same) : 0);
  }, [posts, query, sort, topic]);

  function prepareVoiceField(field: VoiceField) {
    selectVoiceField(field);
    if (!micPermissionReady && !micPermissionBusy && voiceState === "idle") setMicPromptOpen(true);
  }

  async function allowMicrophoneOnce() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceMessage("이 브라우저에서는 마이크 권한을 사용할 수 없습니다.");
      setMicPromptOpen(false);
      return;
    }
    setMicPermissionBusy(true);
    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionStream.getTracks().forEach((track) => track.stop());
      setMicPermissionReady(true);
      setMicPromptOpen(false);
      setVoiceMessage("마이크 사용 준비가 끝났습니다. 마이크는 즉시 해제됐으며 녹음 버튼을 누를 때만 켜집니다.");
    } catch (error) {
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setVoiceMessage(denied ? "마이크가 차단됐습니다. 주소창 자물쇠 → 마이크 → 허용을 눌러주세요." : "마이크 권한을 확인하지 못했습니다.");
      setMicPromptOpen(false);
    } finally {
      setMicPermissionBusy(false);
    }
  }

  function selectVoiceField(field:VoiceField){voiceFieldRef.current=field;setActiveVoiceField(field)}
  function joinVoice(base:string,addition:string,field:VoiceField){return field==="title"?[base.trim(),addition.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").slice(0,80):[base.trimEnd(),addition.trim()].filter(Boolean).join(base.trim()?"
":"").slice(0,2000)}
  function stopVoice(discard=false){if(recognitionRef.current){discard?recognitionRef.current.abort():recognitionRef.current.stop();recognitionRef.current=null}if(recorderRef.current&&recorderRef.current.state!=="inactive"){if(discard)recorderRef.current.onstop=null;recorderRef.current.stop()}streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;recorderRef.current=null;if(discard)chunksRef.current=[];setVoiceState("idle")}
  function updateTitle(value:string){if(voiceState==="listening"||voiceState==="recording")stopVoice(true);setVoiceUndo(null);setTitle(value.slice(0,80))}
  function updateBody(value:string){if(voiceState==="listening"||voiceState==="recording")stopVoice(true);setVoiceUndo(null);setBody(value.slice(0,2000))}
  function undoVoice(){if(!voiceUndo)return;stopVoice(true);setTitle(voiceUndo.title);setBody(voiceUndo.body);selectVoiceField(voiceUndo.field);setVoiceUndo(null);setVoiceMessage("직전 음성 입력을 되돌렸습니다.")}
  function clearVoiceField(){stopVoice(true);activeVoiceField==="title"?setTitle(""):setBody("");setVoiceUndo(null)}
  async function transcribe(blob: Blob, target: VoiceField, browserText: string) {
    setVoiceState("transcribing");
    setVoiceMessage("녹음을 정확한 문장으로 바꾸는 중입니다…");
    try {
      const form = new FormData();
      const filename = blob.type.includes("mp4") ? "jinju-voice.m4a" : "jinju-voice.webm";
      form.append("audio", blob, filename);
      const response = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await response.json() as { text?: string; error?: string };
      const transcript = response.ok && data.text ? data.text.trim() : browserText.trim();
      if (!transcript) throw new Error(data.error || "음성을 글로 바꾸지 못했습니다. 마이크 권한을 확인해주세요.");
      if (target === "title") setTitle((value) => joinVoice(value, transcript, target));
      else setBody((value) => joinVoice(value, transcript, target));
      setVoiceMessage(response.ok ? "녹음한 내용을 글로 옮겼습니다." : "기기 음성인식으로 녹음 내용을 글로 옮겼습니다.");
    } catch (error) {
      setVoiceMessage(error instanceof Error ? error.message : "음성 입력을 사용할 수 없습니다.");
    } finally {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      recognitionRef.current = null;
      chunksRef.current = [];
      browserTranscriptRef.current = "";
      setVoiceState("idle");
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceMessage("이 브라우저에서는 녹음을 지원하지 않습니다. 최신 Chrome 또는 Safari를 사용해주세요.");
      return;
    }
    try {
      const target = voiceFieldRef.current;
      setVoiceUndo({ field: target, title, body });
      setVoiceMessage("마이크 연결 중…");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 128000 }) : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      browserTranscriptRef.current = "";

      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (Recognition) {
        const recognition = new Recognition();
        recognition.lang = "ko-KR";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          let text = "";
          for (let index = 0; index < event.results.length; index += 1) text += `${event.results[index][0]?.transcript || ""} `;
          browserTranscriptRef.current = text.trim();
        };
        recognition.onerror = () => undefined;
        recognition.onend = () => undefined;
        recognitionRef.current = recognition;
        try { recognition.start(); } catch { recognitionRef.current = null; }
      }

      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onerror = () => {
        setVoiceMessage("녹음 중 오류가 발생했습니다. 주소창의 마이크 권한을 확인해주세요.");
        stopVoice(true);
      };
      recorder.onstop = () => {
        try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 100) {
          setVoiceState("idle");
          setVoiceMessage("녹음된 음성이 없습니다. 다시 눌러 말씀해주세요.");
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        void transcribe(blob, target, browserTranscriptRef.current);
      };
      recorder.start(500);
      setVoiceState("recording");
      setVoiceMessage(`${target === "title" ? "제목" : "본문"} 녹음 중 · 한 번 더 누르면 완료됩니다.`);
    } catch (error) {
      setVoiceState("idle");
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setVoiceMessage(denied ? "마이크가 차단됐습니다. 주소창 자물쇠 → 마이크 → 허용을 눌러주세요." : "마이크를 시작하지 못했습니다. 다른 앱이 마이크를 사용 중인지 확인해주세요.");
    }
  }

  async function toggleVoice() {
    if (voiceState === "recording") { recorderRef.current?.stop(); return; }
    if (voiceState === "transcribing") return;
    if (voiceState === "listening") { stopVoice(); return; }
    await startRecording();
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (body.trim().length < 8) { setSubmitStatus("본문을 8자 이상 적어주세요."); return; }
    setSubmitStatus("안전하게 확인하고 있습니다…");
    try {
      const reviewResponse = await fetch("/api/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, text: body }) });
      const review = await reviewResponse.json() as { error?: string; riskLevel?: string; explanation?: string; suggestedTitle?: string };
      if (!reviewResponse.ok || ["high", "urgent"].includes(review.riskLevel ?? "")) { setSubmitStatus(review.error || review.explanation || "표현을 한 번 더 확인해주세요."); return; }
      const response = await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: title.trim() || review.suggestedTitle, content: body, category }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) { setSubmitStatus(data.error || "지금은 저장할 수 없습니다."); return; }
      setTitle(""); setBody(""); setTopic("전체"); setMicPermissionReady(false); setSubmitStatus("의견이 안전하게 등록되었습니다.");
      await loadPosts();
      document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setSubmitStatus("연결을 확인한 뒤 다시 시도해주세요.");
    }
  }

  async function react(postId: string, kind: "heard" | "same") {
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, [kind]: post[kind] + 1 } : post));
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/react`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind }) });
      if (!response.ok) setPosts((current) => current.map((post) => post.id === postId ? { ...post, [kind]: Math.max(0, post[kind] - 1) } : post));
    } catch {
      setPosts((current) => current.map((post) => post.id === postId ? { ...post, [kind]: Math.max(0, post[kind] - 1) } : post));
    }
  }

  async function share(post: Post) {
    const url = `${window.location.origin}/?post=${encodeURIComponent(post.id)}`;
    if (navigator.share) {
      await navigator.share({ title: post.title, url }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(url);
    }
  }

  async function addComment(postId: string, comment: string) {
    const trimmed = comment.trim().slice(0, 2000);
    if (!trimmed) return;
    const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: trimmed }) });
    const data = await response.json() as { error?: string; id?: string; body?: string; createdAt?: string; displayName?: string };
    if (!response.ok) throw new Error(data.error || "댓글을 등록할 수 없습니다.");
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, comments: [...post.comments.filter((item) => item.body), { id: data.id || Date.now(), body: data.body || trimmed, displayName: data.displayName, createdAt: "방금 전" }] } : post));
  }

  function openPost(postId: string) {
    window.history.pushState({}, "", `/?post=${encodeURIComponent(postId)}`);
    setSelectedPostId(postId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closePost() {
    window.history.pushState({}, "", "/");
    setSelectedPostId(null);
  }

  if (!introReady) return <div className="intro-bootstrap" aria-hidden="true" />;

  return (
    <>
      {showIntro && <Intro onComplete={completeIntro} />}
      {selectedPost ? (
        <PostDetail
          post={selectedPost}
          onBack={closePost}
          onReact={(kind) => react(selectedPost.id, kind)}
          onShare={() => share(selectedPost)}
          onComment={(comment) => addComment(selectedPost.id, comment)}
        />
      ) : (
        <div className="chat-app">
          <Sidebar
            topic={topic}
            sort={sort}
            onTopic={(value) => { setTopic(value); setMobileMenuOpen(false); }}
            onSort={setSort}
            mobileOpen={mobileMenuOpen}
          />
          {mobileMenuOpen && <button className="mobile-menu-scrim" onClick={() => setMobileMenuOpen(false)} aria-label="메뉴 닫기" />}

          <main className="chat-main" id="feed">
            <header className="mobile-chat-header">
              <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="게시판 메뉴 열기">☰</button>
              <a href="#feed" aria-label="진주 홈"><Pearl size={36} /><span><strong>진주</strong><small>할 말은 하세요!</small></span></a>
              <a href="#write">나의 의견</a>
            </header>

            <div className="feed-shell">
              <header className="feed-heading">
                <div><p className="eyebrow">공개 베타 · 아무도 몰라요 · 개인정보 0%</p><h1>새로운 익명 의견</h1></div>
                <span>{posts.length}개의 공개 의견</span>
              </header>

              <section className="beta-notice" aria-label="공개 베타 안내">
                <div>
                  <strong>공개 베타 운영 중</strong>
                  <p className="beta-notice-identity">조개가 아픔을 감내하며 귀한 보석을 만들어내듯, 사용자의 상처받은 경험과 진짜 속마음을 소중하게 품어주는 다정하고 정제된 공간입니다.</p>
                  <p className="beta-notice-detail">정식 오픈 전 실제 사용 환경을 점검하고 있습니다. 글쓰기·검색·신고·삭제 흐름을 우선 안정화합니다.</p>
                </div>
                <nav aria-label="공개 베타 바로가기"><a href="#beta">베타 안내</a><a href="mailto:hello@xn--o55b9n.kr">문제 제보</a><a href="#write">내 글 삭제</a></nav>
              </section>

              <form className="chat-search" role="search" onSubmit={(event) => event.preventDefault()}>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="무엇이든 검색해 보세요" aria-label="의견 검색어" />
                <button className="search-send" type="submit" aria-label="검색">↑</button>
              </form>

              <div className="mobile-channel-strip" aria-label="게시판 선택">
                {topics.map((item) => <button key={item} className={topic === item ? "active" : ""} onClick={() => setTopic(item)} type="button">{item}</button>)}
              </div>

              <section className="post-feed" aria-label="익명 의견 목록">
                {filteredPosts.slice(0, 3).map((post) => (
                  <PostCard key={post.id} post={post} onOpen={() => openPost(post.id)} onReact={(kind) => react(post.id, kind)} onShare={() => share(post)} />
                ))}
              </section>

              <section className="chat-composer-section" id="write" aria-labelledby="write-title">
                <div className="composer-intro">
                  <Pearl size={58} />
                  <div><p className="eyebrow">하세요!</p><h2 id="write-title">익명 의견 남기기</h2><p>익명의 무게만큼, 책임의 무게도 함께 들어주세요.</p></div>
                </div>
                <form className="chat-composer" onSubmit={publish}>
                  {micPromptOpen && <div className="mic-permission-overlay" role="dialog" aria-modal="true" aria-labelledby="mic-permission-title">
                    <div className="mic-permission-dialog">
                      <span className="mic-permission-symbol" aria-hidden="true">●</span>
                      <h3 id="mic-permission-title">음성으로 작성할까요?</h3>
                      <p>마이크 권한만 먼저 확인합니다. 확인 직후 마이크를 해제하고, 실제 녹음은 마이크 버튼을 누를 때만 시작합니다.</p>
                      <div><button className="mic-later-button" onClick={() => setMicPromptOpen(false)} type="button">나중에</button><button className="mic-allow-button" onClick={allowMicrophoneOnce} disabled={micPermissionBusy} type="button">{micPermissionBusy ? "확인 중…" : "마이크 허용"}</button></div>
                    </div>
                  </div>}
                  <div className="composer-selects"><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="게시판 선택">{topics.slice(1, 8).map((item) => <option key={item}>{item}</option>)}</select></div>
                  <input className={`chat-title${activeVoiceField === "title" ? " voice-target" : ""}`} value={title} onFocus={() => prepareVoiceField("title")} onChange={(event) => updateTitle(event.target.value)} placeholder="비워두면 본문에서 제목을 추천합니다" aria-label="의견 제목" />
                  <textarea className={activeVoiceField === "body" ? "voice-target" : ""} value={body} onFocus={() => prepareVoiceField("body")} onChange={(event) => updateBody(event.target.value)} placeholder={"익명의 무게만큼, 책임의 무게도 함께 들어주세요.
개운하게~"} aria-label="의견 본문" rows={7} />
                  <p className="composer-guide">내가 겪은 일 · 내가 느낀 마음 · 무엇이 문제였는지 · 개운하게...</p>
                  {voiceMessage && <p className="voice-message" role="status">{voiceMessage}</p>}
                  {submitStatus && <p className="composer-status" role="status">{submitStatus}</p>}
                  <div className="composer-bottom"><span>제목 {title.length}/80 · 본문 {body.length}/2,000</span><div className="composer-actions">{voiceUndo && <button className="voice-text-button" type="button" onClick={undoVoice}>되돌리기</button>}<button className="voice-text-button" type="button" onClick={clearVoiceField}>지우기</button><button className={`voice-input-button${voiceState === "idle" ? "" : " listening"}`} onClick={toggleVoice} type="button" disabled={voiceState === "transcribing"} aria-label={`${activeVoiceField === "title" ? "제목" : "본문"}에 음성 입력`}><span className="mic-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z"/><path d="M5 10.5a7 7 0 0 0 14 0"/><path d="M12 17.5V21"/><path d="M9 21h6"/></svg></span></button><button className="submit-review-button" type="submit"><span>확인</span><span className="send-arrow" aria-hidden="true">↑</span></button></div></div>
                </form>
              </section>

              <section className="post-feed continued-feed" aria-label="더 많은 익명 의견">
                {filteredPosts.slice(3).map((post) => (
                  <PostCard key={post.id} post={post} onOpen={() => openPost(post.id)} onReact={(kind) => react(post.id, kind)} onShare={() => share(post)} />
                ))}
              </section>

              {!filteredPosts.length && <section className="feed-empty"><h2>찾는 의견이 없습니다</h2><p>다른 검색어나 게시판을 선택해 보세요.</p></section>}

              <section className="bottom-write-cta" aria-label="하단 의견 남기기">
                <Pearl size={42} /><div><strong>할 말은 하세요!</strong><span className="cta-relief">개운하게~</span></div><a href="#write">의견 남기기</a>
              </section>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

function Sidebar({ topic, sort, onTopic, onSort, mobileOpen }: {
  topic: string;
  sort: "latest" | "popular";
  onTopic: (topic: string) => void;
  onSort: (sort: "latest" | "popular") => void;
  mobileOpen: boolean;
}) {
  return (
    <aside className={`chat-sidebar${mobileOpen ? " mobile-open" : ""}`}>
      <a href="#feed" className="sidebar-brand" aria-label="진주 홈"><Pearl size={44} /><span><strong>진주</strong><small>할 말은 하세요!</small></span></a>
      <a className="new-post-button" href="#write"><span>＋</span> 새 의견 쓰기</a>
      <p className="sidebar-label">게시판</p>
      <nav className="channel-list" aria-label="주제 게시판">{topics.map((item) => <button key={item} className={topic === item ? "active" : ""} onClick={() => onTopic(item)} type="button"><span>{item === "전체" ? "◉" : "#"}</span>{item}</button>)}</nav>
      <p className="sidebar-label">피드</p>
      <nav className="channel-list" aria-label="피드 정렬"><button className={sort === "latest" ? "active" : ""} onClick={() => onSort("latest")} type="button"><span>◷</span>최신 의견</button><button className={sort === "popular" ? "active" : ""} onClick={() => onSort("popular")} type="button"><span>↗</span>인기 의견</button></nav>
      <div className="sidebar-footer"><a href="#beta">공개 베타</a><a href="#principles">운영원칙</a><a href="#safe">안전 안내</a><a href="#privacy">개인정보</a><a href="mailto:hello@xn--o55b9n.kr">신고</a><p>개인정보를 운영 데이터로 수집하지 않습니다.</p></div>
    </aside>
  );
}

function PostCard({ post, onOpen, onReact, onShare }: {
  post: Post;
  onOpen: () => void;
  onReact: (kind: "heard" | "same") => void;
  onShare: () => void;
}) {
  return (
    <article className="feed-post">
      <button className="post-main-link" onClick={onOpen} type="button">
        <div className="post-meta"><span>{post.category}</span><span>익명</span><time>{post.date}</time></div>
        <h2>{post.title}</h2><p>{post.content}</p>
      </button>
      <PostTemperature likes={post.heard} dislikes={post.same} />
      <div className="post-actions">
        <button className="pearl-reaction" onClick={() => onReact("heard")} type="button"><Pearl size={16} />좋아요 <span>{post.heard}</span></button>
        <button onClick={() => onReact("same")} type="button">싫어요</button>
        <button onClick={onOpen} type="button">댓글 <span>{post.comments.length}</span></button>
        <button className="share-post-button" onClick={onShare} type="button">공유하기</button>
        <a className="post-report" href="mailto:hello@xn--o55b9n.kr">의견 보내기</a>
      </div>
    </article>
  );
}

function PostDetail({ post, onBack, onReact, onShare, onComment }: {
  post: Post;
  onBack: () => void;
  onReact: (kind: "heard" | "same") => void;
  onShare: () => void;
  onComment: (comment: string) => Promise<void>;
}) {
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [detailComments, setDetailComments] = useState<Comment[]>(post.comments.filter((item) => item.body));

  useEffect(() => {
    fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : { comments: [] })
      .then((data: { comments?: Comment[] }) => setDetailComments(data.comments ?? []))
      .catch(() => undefined);
  }, [post.id]);

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    setCommentError("");
    try {
      await onComment(comment);
      setDetailComments((current) => [...current, { id: Date.now(), body: comment.trim(), createdAt: "방금 전", displayName: "익명" }]);
      setComment("");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "댓글을 등록할 수 없습니다.");
    }
  }

  return (
    <main className="detail-page">
      <header className="detail-header"><button onClick={onBack} type="button">← 목록으로</button><a href="#comment">댓글 쓰기</a></header>
      <div className="detail-shell">
        <article className="detail-post">
          <div className="post-meta"><span>{post.category}</span><span>익명</span><time>{post.date}</time></div>
          <h1>{post.title}</h1><p>{post.content}</p>
          <PostTemperature likes={post.heard} dislikes={post.same} interactive />
          <div className="detail-stats"><button className="pearl-reaction" onClick={() => onReact("heard")} type="button"><Pearl size={16} />좋아요 <span>{post.heard}</span></button><button onClick={() => onReact("same")} type="button">싫어요</button><button onClick={onShare} type="button">공유하기</button><a href="mailto:hello@xn--o55b9n.kr">의견 보내기</a></div>
        </article>
        <section className="comment-list" aria-label="댓글 목록">
          <h2>댓글 {detailComments.length || post.comments.length}</h2>
          {detailComments.length ? detailComments.map((item) => <article key={item.id}><div><span>{item.displayName || "익명"}</span><time>{item.createdAt}</time></div><p>{item.body}</p></article>) : <p className="no-comments">첫 댓글을 남겨주세요.</p>}
        </section>
        <form className="comment-composer" id="comment" onSubmit={submitComment}>
          <textarea value={comment} onChange={(event) => setComment(event.target.value.slice(0, 2000))} maxLength={2000} rows={5} placeholder="익명으로 댓글을 남겨주세요" aria-label="댓글 내용" />
          {commentError && <p className="comment-error" role="alert">{commentError}</p>}
          <div><span>{comment.length}/2,000</span><button type="submit">댓글 남기기</button></div>
        </form>
      </div>
    </main>
  );
}
