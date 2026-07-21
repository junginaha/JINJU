"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Intro from "./Intro";
import PostTemperature from "./PostTemperature";

type SpeechRecognitionLike = { lang:string; continuous:boolean; interimResults:boolean; maxAlternatives?:number; start:()=>void; stop:()=>void; abort:()=>void; onresult:((event:{resultIndex:number;results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>})=>void)|null; onend:(()=>void)|null; onerror:((event:{error?:string})=>void)|null };
type SpeechRecognitionConstructor = new()=>SpeechRecognitionLike;
type VoiceState="idle"|"listening"|"recording"|"transcribing";
type VoiceField="title"|"body";
type VoiceSnapshot={field:VoiceField;title:string;body:string};
type DeleteKeys=Record<string,string>;
declare global { interface Window { SpeechRecognition?:SpeechRecognitionConstructor; webkitSpeechRecognition?:SpeechRecognitionConstructor } }

export type Comment = {
  id: number | string;
  body: string;
  createdAt: string;
  displayName?: string;
  isSeeded?: boolean;
};

type ReviewFeedback = {
  decision?: "allow" | "revise";
  riskLevel?: string;
  detectedIssues?: string[];
  explanation?: string;
  suggestion?: string;
  containsPii?: boolean;
  suggestedTitle?: string;
  reviewToken?: string;
};

export type Post = {
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
const POST_DRAFT_KEY="jinju-post-draft-v1",POST_DELETE_KEYS="jinju-owned-posts-v1",COMMENT_DELETE_KEYS="jinju-owned-comments-v1";
const MAX_RECORDING_MS=120_000,TRANSCRIPTION_TIMEOUT_MS=25_000;

function readKeys(storageKey:string):DeleteKeys{try{return JSON.parse(localStorage.getItem(storageKey)||"{}") as DeleteKeys}catch{return {}}}
function saveKeys(storageKey:string,keys:DeleteKeys){try{localStorage.setItem(storageKey,JSON.stringify(keys))}catch{/* Private browsing can reject storage writes. */}}

const seedPosts: Post[] = [
  {
    id: "rested-then-work",
    category: "직장",
    date: "2026. 7. 19.",
    title: "“잘 쉬셨죠?”라는 말 뒤에는 왜 늘 일이 따라올까요",
    content: "네, 잘 쉬었습니다.\n\n진심은 한 줄인데, 오늘 할 일은 벌써 화면을 가득 채웠네요.\n\n쉬었다는 사실이 업무를 더 받을 준비가 되었다는 뜻은 아닐 텐데요. 잘 쉬었는지 묻는 말이 정말 안부로 끝나는 날도 있었으면 합니다.",
    heard: 32,
    same: 4,
    comments: []
  },
  {
    id: "coffee-mistake-culture",
    category: "직장",
    date: "2026. 7. 18.",
    title: "실수한 사람이 커피를 사는 문화, 오늘 제가 끝냈습니다",
    content: "아침 회의 자료에 날짜를 하루 잘못 적었습니다.\n\n별것 아닌데 이상하게 개운합니다. 제 실수는 수정 대상이지 팀 전체 음료 이용권은 아니니까요.\n\n잘못은 바로잡았고 다음부터 확인하겠다고 말했습니다. 커피 대신 체크리스트를 만들었습니다.",
    heard: 55,
    same: 8,
    comments: []
  },
  {
    id: "family-chat-photo",
    category: "관계",
    date: "2026. 7. 19.",
    title: "어머니가 제 사진을 가족 단체방에 올렸습니다",
    content: "주말에 부모님 댁에서 소파에 누워 잠든 적이 있습니다.\n\n결국 사진은 내려갔습니다. 대신 어머니가 서운해하십니다. 제 초상권을 지켰는데 효도가 조금 깎인 기분이네요.\n\n가족이라도 사진을 올리기 전에 한 번 물어봐 주면 좋겠습니다.",
    heard: 63,
    same: 11,
    comments: []
  },
  {
    id: "unused-subscriptions",
    category: "돈",
    date: "2026. 7. 19.",
    title: "안 쓰는 구독을 해지했더니 월급이 조금 자랐습니다",
    content: "통장에서 매달 빠져나가는 돈을 확인했습니다.\n\n연봉은 그대로인데 월급이 몰래 승진한 기분입니다. 그동안 제 통장이 제 가능성까지 구독하고 있었네요.\n\n작지만 다시 내 선택으로 돌아온 돈이 반갑습니다.",
    heard: 71,
    same: 6,
    comments: []
  },
  {
    id: "elevator-close-button",
    category: "일상",
    date: "2026. 7. 19.",
    title: "엘리베이터 닫힘 버튼을 눌렀는데 이웃이 뛰어왔습니다",
    content: "저녁에 장바구니를 양손에 들고 엘리베이터를 탔습니다.\n\n다음에 마주치면 먼저 말하려고 합니다. “그날 제 손가락이 사회생활을 망쳤습니다.”\n\n문이 닫히는 몇 초가 이렇게 오래 기억에 남을 줄 몰랐습니다.",
    heard: 84,
    same: 3,
    comments: []
  },
  {
    id: "apartment-broadcast-first",
    category: "제안",
    date: "2026. 7. 19.",
    title: "아파트 방송은 첫 문장에 용건부터 말해줬으면 합니다",
    content: "밤 아홉 시에 아파트 방송이 나왔습니다.\n\n주민의 관심은 짧고 샴푸 거품은 오래갑니다. 중요한 내용부터 들려주세요.\n\n언제, 어디서, 무엇을 하는지 먼저 말한 다음 설명을 이어가면 좋겠습니다.",
    heard: 68,
    same: 9,
    comments: []
  }
];

function Pearl({ size = 44, className = "" }: { size?: number; className?: string }) {
  return <Image className={className} src="/jinju-pearl-cutout.png" alt="" width={size} height={size} priority />;
}

export default function JinjuApp({ initialPosts = seedPosts, initialPostId = null }: { initialPosts?: Post[]; initialPostId?: string | null }) {
  const [showIntro, setShowIntro] = useState(true);
  const [introReady, setIntroReady] = useState(false);
  const [posts, setPosts] = useState(initialPosts.length ? initialPosts : seedPosts);
  const [topic, setTopic] = useState("전체");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [query, setQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(initialPostId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [category, setCategory] = useState("일상");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [submitBusy,setSubmitBusy]=useState(false);
  const [reviewFeedback,setReviewFeedback]=useState<ReviewFeedback|null>(null);
  const [pendingNotice,setPendingNotice]=useState(false);
  const [draftReady,setDraftReady]=useState(false);
  const [postDeleteKeys,setPostDeleteKeys]=useState<DeleteKeys>({});
  const [commentDeleteKeys,setCommentDeleteKeys]=useState<DeleteKeys>({});
  const [voiceState,setVoiceState]=useState<VoiceState>("idle");
  const [activeVoiceField,setActiveVoiceField]=useState<VoiceField>("body");
  const [voiceMessage,setVoiceMessage]=useState("");
  const [voiceUndo,setVoiceUndo]=useState<VoiceSnapshot|null>(null);
  const [micPromptOpen,setMicPromptOpen]=useState(false);
  const [micPermissionBusy,setMicPermissionBusy]=useState(false);
  const [micPermissionReady,setMicPermissionReady]=useState(false);
  const [micPromptError,setMicPromptError]=useState("");
  const recognitionRef=useRef<SpeechRecognitionLike|null>(null),recorderRef=useRef<MediaRecorder|null>(null),streamRef=useRef<MediaStream|null>(null),chunksRef=useRef<Blob[]>([]),voiceFieldRef=useRef<VoiceField>("body"),voiceBaseRef=useRef(""),browserTranscriptRef=useRef("");
  const speechSegmentsRef=useRef<Map<number,string>>(new Map()),speechPrefixRef=useRef(""),voiceSessionRef=useRef(0),voiceAutoStopRef=useRef<ReturnType<typeof setTimeout>|null>(null),speechRestartRef=useRef<ReturnType<typeof setTimeout>|null>(null),transcriptionAbortRef=useRef<AbortController|null>(null),fieldRevisionRef=useRef({title:0,body:0});
  const titleInputRef=useRef<HTMLInputElement|null>(null);
  const bodyInputRef=useRef<HTMLTextAreaElement|null>(null);

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

  useEffect(()=>{
    try{const draft=JSON.parse(sessionStorage.getItem(POST_DRAFT_KEY)||"null") as {title?:string;body?:string;category?:string}|null;if(draft){setTitle(draft.title||"");setBody(draft.body||"");if(draft.category) setCategory(draft.category)}}catch{/* Ignore a damaged local draft. */}
    setPostDeleteKeys(readKeys(POST_DELETE_KEYS));
    setCommentDeleteKeys(readKeys(COMMENT_DELETE_KEYS));
    setDraftReady(true);
  },[]);

  useEffect(()=>{if(!draftReady)return;try{if(title||body)sessionStorage.setItem(POST_DRAFT_KEY,JSON.stringify({title,body,category}));else sessionStorage.removeItem(POST_DRAFT_KEY)}catch{/* Draft storage is best effort. */}},[body,category,draftReady,title]);

  useEffect(()=>()=>{voiceSessionRef.current+=1;transcriptionAbortRef.current?.abort();if(voiceAutoStopRef.current)clearTimeout(voiceAutoStopRef.current);if(speechRestartRef.current)clearTimeout(speechRestartRef.current);try{recognitionRef.current?.abort()}catch{/* already stopped */}if(recorderRef.current){recorderRef.current.onstop=null;if(recorderRef.current.state!=="inactive")recorderRef.current.stop()}streamRef.current?.getTracks().forEach(track=>track.stop())},[]);

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
      const pathMatch = window.location.pathname.match(/^\/post\/([^/]+)\/?$/);
      const postId = pathMatch ? decodeURIComponent(pathMatch[1]) : new URLSearchParams(window.location.search).get("post");
      setSelectedPostId(postId || null);
    };
    syncPostFromUrl();
    window.addEventListener("popstate", syncPostFromUrl);
    return () => window.removeEventListener("popstate", syncPostFromUrl);
  }, []);

  const completeIntro = useCallback(() => {
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
  }

  async function allowAndStartMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicPromptError("이 브라우저에서는 음성 입력이 제한됩니다. 키보드의 마이크를 이용해주세요.");
      return;
    }
    setMicPermissionBusy(true);
    try {
      setMicPromptError("");
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:true,noiseSuppression:true,autoGainControl:true } });
      setMicPermissionReady(true);
      setMicPromptOpen(false);
      await startRecording(permissionStream);
    } catch (error) {
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setMicPromptError(denied ? "마이크가 허용되지 않았어요. 다시 시도하거나 이 브라우저의 키보드 마이크를 이용해주세요." : "마이크를 시작하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setMicPermissionBusy(false);
    }
  }

  function selectVoiceField(field:VoiceField){voiceFieldRef.current=field;setActiveVoiceField(field)}
  function joinVoice(base:string,addition:string,field:VoiceField){return field==="title"?[base.trim(),addition.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").slice(0,80):[base.trimEnd(),addition.trim()].filter(Boolean).join(base.trim()?"\n":"").slice(0,2000)}
  function showLiveTranscript(target:VoiceField,text:string){const value=joinVoice(voiceBaseRef.current,text,target),input=target==="title"?titleInputRef.current:bodyInputRef.current;if(input)input.value=value}
  function clearVoiceTimers(){if(voiceAutoStopRef.current){clearTimeout(voiceAutoStopRef.current);voiceAutoStopRef.current=null}if(speechRestartRef.current){clearTimeout(speechRestartRef.current);speechRestartRef.current=null}}
  function stopVoice(discard=false){
    clearVoiceTimers();
    if(discard){voiceSessionRef.current+=1;transcriptionAbortRef.current?.abort()}
    const recognition=recognitionRef.current;
    if(recognition){recognition.onend=null;recognition.onresult=null;recognition.onerror=null;try{discard?recognition.abort():recognition.stop()}catch{/* already stopped */}recognitionRef.current=null}
    const recorder=recorderRef.current;
    if(recorder&&recorder.state!=="inactive"){if(discard)recorder.onstop=null;recorder.stop()}
    if(discard){streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;recorderRef.current=null;chunksRef.current=[];browserTranscriptRef.current="";speechSegmentsRef.current.clear();speechPrefixRef.current="";setVoiceState("idle")}
  }
  function updateTitle(value:string){if(voiceState==="listening"||voiceState==="recording")stopVoice(true);fieldRevisionRef.current.title+=1;setVoiceUndo(null);setTitle(value.slice(0,80))}
  function updateBody(value:string){if(voiceState==="listening"||voiceState==="recording")stopVoice(true);fieldRevisionRef.current.body+=1;setVoiceUndo(null);setBody(value.slice(0,2000))}
  function undoVoice(){if(!voiceUndo)return;stopVoice(true);setTitle(voiceUndo.title);setBody(voiceUndo.body);selectVoiceField(voiceUndo.field);setVoiceUndo(null);setVoiceMessage("직전 음성 입력을 되돌렸습니다.")}
  function clearVoiceField(){stopVoice(true);activeVoiceField==="title"?setTitle(""):setBody("");setVoiceUndo(null)}
  async function transcribe(blob: Blob, target: VoiceField, browserText: string, base: string, sessionId:number, revision:number) {
    setVoiceState("transcribing");
    setVoiceMessage("내용은 입력됐습니다. 정확한 한국어로 한 번 더 확인 중…");
    const controller=new AbortController();
    transcriptionAbortRef.current?.abort();
    transcriptionAbortRef.current=controller;
    const timeout=setTimeout(()=>controller.abort(),TRANSCRIPTION_TIMEOUT_MS);
    try {
      const form = new FormData();
      const filename = blob.type.includes("mp4") ? "jinju-voice.m4a" : "jinju-voice.webm";
      form.append("audio", blob, filename);
      form.append("field",target);
      form.append("context",base.slice(-800));
      form.append("category",category);
      const response = await fetch("/api/transcribe", { method: "POST", body: form, signal:controller.signal });
      const data = await response.json() as { text?: string; error?: string };
      const transcript = response.ok && data.text ? data.text.trim() : browserText.trim();
      if (!transcript) throw new Error(data.error || "음성을 글로 바꾸지 못했습니다. 마이크 권한을 확인해주세요.");
      if(sessionId!==voiceSessionRef.current)return;
      if(fieldRevisionRef.current[target]===revision){
        if (target === "title") setTitle(joinVoice(base, transcript, target));
        else setBody(joinVoice(base, transcript, target));
        setVoiceMessage(response.ok ? "음성 입력을 정확하게 다듬었습니다." : "기기에서 인식한 문장을 입력했습니다.");
      }else setVoiceMessage("수정하신 내용을 그대로 유지했습니다.");
    } catch (error) {
      if(sessionId===voiceSessionRef.current)setVoiceMessage(error instanceof DOMException&&error.name==="AbortError"?"빠른 입력 결과를 유지했습니다. 계속 수정하거나 다시 말할 수 있어요.":error instanceof Error ? error.message : "음성 입력을 사용할 수 없습니다.");
    } finally {
      clearTimeout(timeout);
      if(transcriptionAbortRef.current===controller)transcriptionAbortRef.current=null;
      if(sessionId===voiceSessionRef.current){chunksRef.current=[];browserTranscriptRef.current="";speechSegmentsRef.current.clear();speechPrefixRef.current="";setVoiceState("idle")}
    }
  }

  async function startRecording(authorizedStream?:MediaStream) {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      authorizedStream?.getTracks().forEach(track=>track.stop());
      setVoiceMessage("이 브라우저에서는 녹음을 지원하지 않습니다. 최신 Chrome 또는 Safari를 사용해주세요.");
      return;
    }
    try {
      const sessionId=voiceSessionRef.current+1;
      voiceSessionRef.current=sessionId;
      transcriptionAbortRef.current?.abort();
      clearVoiceTimers();
      const target = voiceFieldRef.current;
      setVoiceUndo({ field: target, title, body });
      setVoiceMessage("마이크 연결 중…");
      const stream = authorizedStream||await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      setMicPermissionReady(true);
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 128000 }) : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      browserTranscriptRef.current = "";
      speechSegmentsRef.current.clear();
      speechPrefixRef.current="";
      const base=target==="title"?title:body;
      const revision=fieldRevisionRef.current[target];
      voiceBaseRef.current=base;

      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (Recognition) {
        const recognition = new Recognition();
        recognition.lang = "ko-KR";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event) => {
          if(sessionId!==voiceSessionRef.current)return;
          for(let index=event.resultIndex;index<event.results.length;index+=1)speechSegmentsRef.current.set(index,event.results[index][0]?.transcript?.trim()||"");
          const current=[...speechSegmentsRef.current.entries()].sort((a,b)=>a[0]-b[0]).map(([,text])=>text).filter(Boolean).join(" ");
          browserTranscriptRef.current=[speechPrefixRef.current,current].filter(Boolean).join(" ").trim();
          showLiveTranscript(target,browserTranscriptRef.current);
        };
        recognition.onerror = (event) => {
          if(event.error==="not-allowed"||event.error==="service-not-allowed")setVoiceMessage("기기 음성인식은 제한됐지만 녹음은 계속됩니다. 완료 후 정확하게 변환합니다.");
        };
        recognition.onend = () => {
          if(sessionId!==voiceSessionRef.current||recorderRef.current?.state!=="recording")return;
          speechPrefixRef.current=browserTranscriptRef.current;
          speechSegmentsRef.current.clear();
          speechRestartRef.current=setTimeout(()=>{if(sessionId===voiceSessionRef.current&&recorderRef.current?.state==="recording")try{recognition.start()}catch{/* Server transcription remains available. */}},150);
        };
        recognitionRef.current = recognition;
        try { recognition.start(); } catch { recognitionRef.current = null; }
      }

      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onerror = () => {
        setVoiceMessage("녹음 중 오류가 발생했습니다. 주소창의 마이크 권한을 확인해주세요.");
        stopVoice(true);
      };
      recorder.onstop = () => {
        clearVoiceTimers();
        const liveRecognition=recognitionRef.current;
        if(liveRecognition){liveRecognition.onend=null;try{liveRecognition.stop()}catch{/* already stopped */}}
        recognitionRef.current=null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current=null;
        recorderRef.current=null;
        if (blob.size < 100) {
          setVoiceState("idle");
          setVoiceMessage("녹음된 음성이 없습니다. 다시 눌러 말씀해주세요.");
          return;
        }
        const quickText=browserTranscriptRef.current.trim();
        if(quickText){if(target==="title")setTitle(joinVoice(base,quickText,target));else setBody(joinVoice(base,quickText,target))}
        void transcribe(blob, target, quickText, base, sessionId, revision);
      };
      recorder.start(1000);
      voiceAutoStopRef.current=setTimeout(()=>{if(sessionId===voiceSessionRef.current&&recorder.state==="recording"){setVoiceMessage("2분 녹음을 마쳐 정확한 문장으로 바꾸고 있습니다…");recorder.stop()}},MAX_RECORDING_MS);
      setVoiceState("recording");
      setVoiceMessage(`${target === "title" ? "제목" : "본문"} 녹음 중 · 한 번 더 누르면 완료됩니다.`);
    } catch (error) {
      authorizedStream?.getTracks().forEach(track=>track.stop());
      setVoiceState("idle");
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setVoiceMessage(denied ? "마이크가 차단됐습니다. 주소창 자물쇠 → 마이크 → 허용을 눌러주세요." : "마이크를 시작하지 못했습니다. 다른 앱이 마이크를 사용 중인지 확인해주세요.");
    }
  }

  async function toggleVoice() {
    if (voiceState === "recording") { recorderRef.current?.stop(); return; }
    if (voiceState === "transcribing") {transcriptionAbortRef.current?.abort();setVoiceState("idle");await startRecording();return;}
    if (voiceState === "listening") { stopVoice(); return; }
    if(!micPermissionReady){setMicPromptError("");setMicPromptOpen(true);return}
    await startRecording();
  }

  function clearPublishedDraft() {
    try{sessionStorage.removeItem(POST_DRAFT_KEY)}catch{/* already clear */}
    setTitle("");
    setBody("");
    setTopic("전체");
  }

  async function submitReviewedPost(finalTitle: string, acceptReviewHold: boolean, reviewToken = reviewFeedback?.reviewToken || "") {
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: finalTitle, content: body, category, acceptReviewHold, reviewToken }),
    });
    const data = await response.json() as { error?:string; id?:string; deleteKey?:string; status?:"approved"|"pending"|"revision_required"; review?:ReviewFeedback };
    if (response.status === 422 && data.review) {
      setReviewFeedback({ ...data.review, suggestedTitle: finalTitle });
      setSubmitStatus(data.error || "조금만 다듬으면 바로 게시할 수 있어요.");
      return false;
    }
    if (!response.ok) { setSubmitStatus(data.error || "지금은 저장할 수 없습니다."); return false; }
    if(data.id&&data.deleteKey){const next={...postDeleteKeys,[data.id]:data.deleteKey};setPostDeleteKeys(next);saveKeys(POST_DELETE_KEYS,next)}
    clearPublishedDraft();
    setReviewFeedback(null);
    if (data.status === "pending") {
      setSubmitStatus("운영자 승인 대기 상태로 안전하게 보관했습니다.");
      setPendingNotice(true);
      return true;
    }
    setSubmitStatus("검수를 통과해 바로 게시되었습니다.");
    await loadPosts();
    document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
    return true;
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (body.trim().length < 8) { setSubmitStatus("본문을 8자 이상 적어주세요."); return; }
    if(submitBusy)return;
    setSubmitBusy(true);
    setReviewFeedback(null);
    setSubmitStatus("AI가 개인정보와 위험 표현을 확인하고 있어요…");
    try {
      const reviewResponse = await fetch("/api/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, text: body, category }) });
      const review = await reviewResponse.json() as ReviewFeedback & { error?: string };
      if (!reviewResponse.ok) { setSubmitStatus(review.error || "검수하지 못했습니다. 잠시 후 다시 시도해주세요."); return; }
      const finalTitle = title.trim() || review.suggestedTitle || "익명의 의견";
      if (review.decision === "revise") {
        setReviewFeedback({ ...review, suggestedTitle: finalTitle });
        setSubmitStatus("고칠 부분을 확인해주세요. 수정하면 다시 검수합니다.");
        return;
      }
      await submitReviewedPost(finalTitle, false, review.reviewToken);
    } catch {
      setSubmitStatus("연결을 확인한 뒤 다시 시도해주세요. 초안은 그대로 보관되어 있습니다.");
    } finally {
      setSubmitBusy(false);
    }
  }

  function returnToEdit() {
    setReviewFeedback(null);
    setSubmitStatus("수정한 뒤 AI 검수를 다시 눌러주세요.");
    requestAnimationFrame(() => bodyInputRef.current?.focus());
  }

  async function submitPending() {
    if(submitBusy || !reviewFeedback || reviewFeedback.containsPii)return;
    setSubmitBusy(true);
    setSubmitStatus("운영자 승인 대기로 안전하게 옮기고 있어요…");
    try { await submitReviewedPost(title.trim() || reviewFeedback.suggestedTitle || "익명의 의견", true); }
    catch { setSubmitStatus("연결을 확인한 뒤 다시 시도해주세요. 초안은 그대로 보관되어 있습니다."); }
    finally { setSubmitBusy(false); }
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
    const url = `${window.location.origin}/post/${encodeURIComponent(post.id)}`;
    if (navigator.share) {
      await navigator.share({ title: post.title, url }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(url);
    }
  }

  async function addComment(postId: string, comment: string):Promise<Comment> {
    const trimmed = comment.trim().slice(0, 2000);
    if (!trimmed) throw new Error("댓글을 두 글자 이상 적어주세요.");
    const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: trimmed }) });
    const data = await response.json() as { error?: string; id?: string;deleteKey?:string; body?: string; createdAt?: string; displayName?: string };
    if (!response.ok) throw new Error(data.error || "댓글을 등록할 수 없습니다.");
    const created={id:data.id||Date.now(),body:data.body||trimmed,displayName:data.displayName,createdAt:data.createdAt||new Date().toISOString()};
    if(data.id&&data.deleteKey){const next={...commentDeleteKeys,[data.id]:data.deleteKey};setCommentDeleteKeys(next);saveKeys(COMMENT_DELETE_KEYS,next)}
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, comments: [...post.comments, created] } : post));
    return created;
  }

  async function deletePost(postId:string){const deleteKey=postDeleteKeys[postId];if(!deleteKey)throw new Error("이 글을 삭제할 권한을 확인할 수 없습니다.");const response=await fetch(`/api/posts/${encodeURIComponent(postId)}`,{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({deleteKey})});const data=await response.json() as {error?:string};if(!response.ok)throw new Error(data.error||"글을 삭제하지 못했습니다.");const next={...postDeleteKeys};delete next[postId];setPostDeleteKeys(next);saveKeys(POST_DELETE_KEYS,next);setPosts(current=>current.filter(post=>post.id!==postId));closePost()}
  async function deleteComment(postId:string,commentId:string|number){const key=String(commentId),deleteKey=commentDeleteKeys[key];if(!deleteKey)throw new Error("이 댓글을 삭제할 권한을 확인할 수 없습니다.");const response=await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`,{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({commentId:key,deleteKey})});const data=await response.json() as {error?:string};if(!response.ok)throw new Error(data.error||"댓글을 삭제하지 못했습니다.");const next={...commentDeleteKeys};delete next[key];setCommentDeleteKeys(next);saveKeys(COMMENT_DELETE_KEYS,next);setPosts(current=>current.map(post=>post.id===postId?{...post,comments:post.comments.filter(item=>String(item.id)!==key)}:post));await loadPosts()}

  function openPost(postId: string) {
    window.history.pushState({}, "", `/post/${encodeURIComponent(postId)}`);
    setSelectedPostId(postId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closePost() {
    window.history.pushState({}, "", "/");
    setSelectedPostId(null);
  }

  return (
    <>
      {!introReady ? <div className="intro-bootstrap" aria-hidden="true" /> : showIntro && <Intro onComplete={completeIntro} />}
      {selectedPost ? (
        <PostDetail
          key={selectedPost.id}
          post={selectedPost}
          onBack={closePost}
          onReact={(kind) => react(selectedPost.id, kind)}
          onShare={() => share(selectedPost)}
          onComment={(comment) => addComment(selectedPost.id, comment)}
          canDeletePost={Boolean(postDeleteKeys[selectedPost.id])}
          canDeleteComment={(commentId)=>Boolean(commentDeleteKeys[String(commentId)])}
          onDeletePost={()=>deletePost(selectedPost.id)}
          onDeleteComment={(commentId)=>deleteComment(selectedPost.id,commentId)}
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
                  {reviewFeedback && <div className="review-overlay" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
                    <div className="review-dialog">
                      <span className="review-symbol" aria-hidden="true">♨</span>
                      <p className="review-eyebrow">AI 검수 결과</p>
                      <h3 id="review-dialog-title">조금만 다듬어 주세요</h3>
                      {reviewFeedback.detectedIssues?.length ? <ul>{reviewFeedback.detectedIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
                      <p>{reviewFeedback.explanation}</p>
                      {reviewFeedback.suggestion && <div className="review-suggestion"><strong>이렇게 고쳐보세요</strong><span>{reviewFeedback.suggestion}</span></div>}
                      {reviewFeedback.containsPii && <p className="review-pii-warning">개인정보는 승인 대기로도 저장하지 않습니다. 해당 정보를 지운 뒤 다시 검수해주세요.</p>}
                      <div className="review-dialog-actions">
                        <button className="review-edit-button" onClick={returnToEdit} type="button">수정하기</button>
                        {!reviewFeedback.containsPii && <button className="review-hold-button" onClick={submitPending} disabled={submitBusy} type="button">{submitBusy ? "보류 접수 중…" : "그대로 제출"}</button>}
                      </div>
                      {!reviewFeedback.containsPii && <small>그대로 제출하면 공개되지 않고 운영자 승인 대기로 이동합니다.</small>}
                    </div>
                  </div>}
                  {pendingNotice && <div className="review-overlay" role="dialog" aria-modal="true" aria-labelledby="pending-dialog-title">
                    <div className="pending-dialog">
                      <span className="pending-symbol" aria-hidden="true">●</span>
                      <h3 id="pending-dialog-title">앗, 너무 뜨거워요</h3>
                      <p>잠시 식힐게요.<br />운영자 승인이 필요합니다.</p>
                      <span>글은 공개되지 않고 승인 대기 상태로 안전하게 보관되었습니다.</span>
                      <button type="button" onClick={() => setPendingNotice(false)}>확인</button>
                    </div>
                  </div>}
                  {micPromptOpen && <div className="mic-permission-overlay" role="dialog" aria-modal="true" aria-labelledby="mic-permission-title">
                    <div className="mic-permission-dialog">
                      <span className="mic-permission-symbol" aria-hidden="true">●</span>
                      <h3 id="mic-permission-title">음성으로 작성할까요?</h3>
                      <p>허용을 누르면 바로 듣기 시작하고, 인식한 문장을 선택한 입력칸에 보여드립니다.</p>
                      {micPromptError&&<p className="mic-permission-error" role="alert">{micPromptError}</p>}
                      <div><button className="mic-later-button" onClick={() => setMicPromptOpen(false)} type="button">취소</button><button className="mic-allow-button" onClick={allowAndStartMicrophone} disabled={micPermissionBusy} type="button">{micPermissionBusy ? "마이크 여는 중…" : "허용하고 바로 말하기"}</button></div>
                    </div>
                  </div>}
                  <div className="composer-selects"><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="게시판 선택">{topics.slice(1, 8).map((item) => <option key={item}>{item}</option>)}</select></div>
                  <input ref={titleInputRef} className={`chat-title${activeVoiceField === "title" ? " voice-target" : ""}`} value={title} onFocus={() => prepareVoiceField("title")} onChange={(event) => updateTitle(event.target.value)} placeholder="비워두면 본문에서 제목을 추천합니다" aria-label="의견 제목" />
                  <textarea ref={bodyInputRef} className={activeVoiceField === "body" ? "voice-target" : ""} value={body} onFocus={() => prepareVoiceField("body")} onChange={(event) => updateBody(event.target.value)} placeholder={"익명의 무게만큼, 책임의 무게도 함께 들어주세요.\n개운하게~"} aria-label="의견 본문" rows={7} />
                  <p className="composer-guide">내가 겪은 일 · 내가 느낀 마음 · 무엇이 문제였는지 · 개운하게...</p>
                  {voiceMessage && <p className="voice-message" role="status">{voiceMessage}</p>}
                  {submitStatus && <p className="composer-status" role="status">{submitStatus}</p>}
                  <div className="composer-bottom"><span>제목 {title.length}/80 · 본문 {body.length}/2,000</span><div className="composer-actions">{voiceUndo && <button className="voice-text-button" type="button" onClick={undoVoice}>되돌리기</button>}<button className="voice-text-button" type="button" onClick={clearVoiceField}>지우기</button><button className={`voice-input-button${voiceState === "idle" ? "" : " listening"}`} onClick={toggleVoice} type="button" aria-pressed={voiceState==="recording"} aria-label={`${activeVoiceField === "title" ? "제목" : "본문"}에 음성 입력${voiceState==="transcribing"?" 다시 시작":""}`}><span className="mic-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z"/><path d="M5 10.5a7 7 0 0 0 14 0"/><path d="M12 17.5V21"/><path d="M9 21h6"/></svg></span></button><button className="submit-review-button" type="submit" disabled={submitBusy}><span>{submitBusy?"검수 중…":"AI 검수"}</span><span className="send-arrow" aria-hidden="true">↑</span></button></div></div>
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
      <a className="post-main-link" href={`/post/${encodeURIComponent(post.id)}`} onClick={(event) => { event.preventDefault(); onOpen(); }}>
        <div className="post-meta"><span>{post.category}</span><span>익명</span><time>{post.date}</time></div>
        <h2>{post.title}</h2><p>{post.content}</p>
      </a>
      <PostTemperature likes={post.heard} dislikes={post.same} />
      <div className="post-actions">
        <button className="pearl-reaction" onClick={() => onReact("heard")} type="button"><Pearl size={16} />좋아요</button>
        <button onClick={() => onReact("same")} type="button">싫어요</button>
        <button onClick={onOpen} type="button">댓글 <span>{post.comments.length}</span></button>
        <button className="share-post-button" onClick={onShare} type="button">공유하기</button>
        <a className="post-report" href="mailto:hello@xn--o55b9n.kr">의견 보내기</a>
      </div>
    </article>
  );
}

function PostDetail({ post, onBack, onReact, onShare, onComment, canDeletePost, canDeleteComment, onDeletePost, onDeleteComment }: {
  post: Post;
  onBack: () => void;
  onReact: (kind: "heard" | "same") => void;
  onShare: () => void;
  onComment: (comment: string) => Promise<Comment>;
  canDeletePost:boolean;
  canDeleteComment:(commentId:string|number)=>boolean;
  onDeletePost:()=>Promise<void>;
  onDeleteComment:(commentId:string|number)=>Promise<void>;
}) {
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentBusy,setCommentBusy]=useState(false);
  const [commentDraftReady,setCommentDraftReady]=useState(false);
  const [deleteBusy,setDeleteBusy]=useState<string|null>(null);
  const [detailComments, setDetailComments] = useState<Comment[]>(post.comments.filter((item) => item.body));
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsLoadError, setCommentsLoadError] = useState("");

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsLoadError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`, { cache: "no-store" });
      const data = await response.json() as { comments?: Comment[]; error?: string };
      if (!response.ok) throw new Error(data.error || "댓글을 불러오지 못했습니다.");
      setDetailComments((data.comments ?? []).filter((item) => item.body));
    } catch (error) {
      setCommentsLoadError(error instanceof Error ? error.message : "댓글을 불러오지 못했습니다.");
    } finally {
      setCommentsLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    try{setComment(sessionStorage.getItem(`jinju-comment-draft:${post.id}`)||"")}catch{/* Best effort draft restore. */}
    setCommentDraftReady(true);
    void loadComments();
  }, [loadComments, post.id]);

  useEffect(()=>{if(!commentDraftReady)return;try{if(comment)sessionStorage.setItem(`jinju-comment-draft:${post.id}`,comment);else sessionStorage.removeItem(`jinju-comment-draft:${post.id}`)}catch{/* Best effort draft save. */}},[comment,commentDraftReady,post.id]);

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()||commentBusy) return;
    setCommentError("");
    setCommentBusy(true);
    try {
      const created=await onComment(comment);
      setDetailComments((current) => [...current, created]);
      setComment("");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "댓글을 등록할 수 없습니다.");
    } finally {
      setCommentBusy(false);
    }
  }

  async function removePost(){if(!window.confirm("이 글을 삭제할까요? 삭제한 글은 다시 되돌릴 수 없습니다."))return;setDeleteBusy("post");setCommentError("");try{await onDeletePost()}catch(error){setCommentError(error instanceof Error?error.message:"글을 삭제하지 못했습니다.");setDeleteBusy(null)}}
  async function removeComment(commentId:string|number){if(!window.confirm("이 댓글을 삭제할까요?"))return;const key=String(commentId);setDeleteBusy(key);setCommentError("");try{await onDeleteComment(commentId);setDetailComments(current=>current.filter(item=>String(item.id)!==key))}catch(error){setCommentError(error instanceof Error?error.message:"댓글을 삭제하지 못했습니다.")}finally{setDeleteBusy(null)}}

  return (
    <main className="detail-page">
      <header className="detail-header"><button onClick={onBack} type="button">← 목록으로</button><a href="#comment">댓글 쓰기</a></header>
      <div className="detail-shell">
        <article className="detail-post">
          <div className="post-meta"><span>{post.category}</span><span>익명</span><time>{post.date}</time></div>
          <h1>{post.title}</h1><p>{post.content}</p>
          <PostTemperature likes={post.heard} dislikes={post.same} interactive />
          <div className="detail-stats"><button className="pearl-reaction" onClick={() => onReact("heard")} type="button"><Pearl size={16} />좋아요</button><button onClick={() => onReact("same")} type="button">싫어요</button><button onClick={onShare} type="button">공유하기</button>{canDeletePost&&<button className="own-delete-button" onClick={removePost} disabled={deleteBusy==="post"} type="button">{deleteBusy==="post"?"삭제 중…":"내 글 삭제"}</button>}<a href="mailto:hello@xn--o55b9n.kr">의견 보내기</a></div>
        </article>
        <section className="comment-list" aria-label="댓글 목록">
          <h2>댓글 {commentsLoading ? "…" : detailComments.length}</h2>
          {commentsLoading
            ? <p className="comments-loading" aria-live="polite">댓글을 불러오는 중입니다.</p>
            : commentsLoadError
              ? <div className="comments-load-error" role="alert"><p>{commentsLoadError}</p><button type="button" onClick={()=>void loadComments()}>다시 시도</button></div>
              : detailComments.length
                ? detailComments.map((item) => <article key={item.id}><div><span>{item.displayName || "익명"}{item.isSeeded&&<small className="seed-comment-label">대화 씨앗</small>}</span><span><time>{item.createdAt}</time>{canDeleteComment(item.id)&&<button className="comment-delete-button" onClick={()=>removeComment(item.id)} disabled={deleteBusy===String(item.id)} type="button">{deleteBusy===String(item.id)?"삭제 중":"삭제"}</button>}</span></div><p>{item.body}</p></article>)
                : <p className="no-comments">첫 댓글을 남겨주세요.</p>}
        </section>
        <form className="comment-composer" id="comment" onSubmit={submitComment}>
          <textarea value={comment} onChange={(event) => setComment(event.target.value.slice(0, 2000))} maxLength={2000} rows={5} placeholder="익명으로 댓글을 남겨주세요" aria-label="댓글 내용" />
          {commentError && <p className="comment-error" role="alert">{commentError}</p>}
          <div><span>{comment.length}/2,000 · 입력 내용은 등록 전까지 이 기기에 보관됩니다</span><button type="submit" disabled={commentBusy}>{commentBusy?"등록 중…":"댓글 남기기"}</button></div>
        </form>
      </div>
    </main>
  );
}
