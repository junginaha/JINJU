"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Intro from "./Intro";
import PostTemperature from "./PostTemperature";
import FeedbackDialog from "./FeedbackDialog";
import TurnstileChallenge from "./TurnstileChallenge";
import { formatCommentTime } from "../lib/comment-time";
import {
  activeReactionHistory,
  REACTION_HISTORY_KEY,
  recordReaction,
  type ReactionHistory,
  type ReactionKind,
} from "../lib/reaction-history";

type SpeechRecognitionLike = { lang:string; continuous:boolean; interimResults:boolean; maxAlternatives?:number; start:()=>void; stop:()=>void; abort:()=>void; onresult:((event:{resultIndex:number;results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>})=>void)|null; onend:(()=>void)|null; onerror:((event:{error?:string})=>void)|null };
type SpeechRecognitionConstructor = new()=>SpeechRecognitionLike;
type VoiceState="idle"|"listening"|"recording"|"transcribing";
type ComposerVoiceField="title"|"body";
type VoiceField=ComposerVoiceField|"query"|"comment";
type VoiceSnapshot={field:ComposerVoiceField;title:string;body:string};
type CommentVoiceTarget={postId:string;category:string;base:string;apply:(value:string)=>void};
type DeleteKeys=Record<string,string>;
declare global { interface Window { SpeechRecognition?:SpeechRecognitionConstructor; webkitSpeechRecognition?:SpeechRecognitionConstructor } }

export type Comment = {
  id: number | string;
  body: string;
  createdAt: string;
  displayName?: string;
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

class CommentReviewError extends Error {
  review: ReviewFeedback;

  constructor(review: ReviewFeedback) {
    super("이 문장만 조금 바꾸면 올릴 수 있어요.");
    this.name = "CommentReviewError";
    this.review = review;
  }
}

export type Post = {
  id: string;
  category: string;
  date: string;
  title: string;
  content: string;
  displayName?: string;
  heard: number;
  same: number;
  comments: Comment[];
};

const topics = ["전체", "일상", "관계", "직장", "돈", "사회", "제안", "질문"];
const POST_DRAFT_KEY="jinju-post-draft-v1",COMMENT_DELETE_KEYS="jinju-owned-comments-v1";
const MAX_RECORDING_MS=120_000,TRANSCRIPTION_TIMEOUT_MS=25_000,FEED_PAGE_SIZE=30;
type FeedApiPost=Omit<Post,"date"|"comments">&{createdAt:string;commentCount?:number};
type FeedApiResponse={posts?:FeedApiPost[];total?:number;siteTotal?:number;hasMore?:boolean;nextOffset?:number;error?:string};
type FeedQueryOverride={topic?:string;query?:string;sort?:"latest"|"popular"};
function normalizeFeedPosts(rows:FeedApiPost[]):Post[]{return rows.map(({createdAt,commentCount,...post})=>({...post,date:new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"numeric",day:"numeric"}).format(new Date(createdAt)),comments:Array.from({length:commentCount??0},(_,index)=>({id:`count-${index}`,body:"",createdAt:""}))}))}

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

export default function JinjuApp({ initialPosts = seedPosts, initialPostId = null, initialTotal }: { initialPosts?: Post[]; initialPostId?: string | null; initialTotal?: number }) {
  const [showIntro, setShowIntro] = useState(true);
  const [introReady, setIntroReady] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [feedState, setFeedState] = useState<"loading" | "ready" | "error">("loading");
  const [feedTotal,setFeedTotal]=useState(Math.max(initialTotal??initialPosts.length,initialPosts.length));
  const [feedNextOffset,setFeedNextOffset]=useState(initialPosts.length);
  const [hasMorePosts,setHasMorePosts]=useState((initialTotal??initialPosts.length)>initialPosts.length);
  const [feedLoadingMore,setFeedLoadingMore]=useState(false);
  const [feedMoreError,setFeedMoreError]=useState(false);
  const [feedbackPost, setFeedbackPost] = useState<Post | null>(null);
  const [topic, setTopic] = useState("전체");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [query, setQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(initialPostId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const [category, setCategory] = useState("일상");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [submitBusy,setSubmitBusy]=useState(false);
  const [postTurnstileToken,setPostTurnstileToken]=useState("");
  const [postTurnstileRequired,setPostTurnstileRequired]=useState(false);
  const [postTurnstileReset,setPostTurnstileReset]=useState(0);
  const [reviewFeedback,setReviewFeedback]=useState<ReviewFeedback|null>(null);
  const [pendingNotice,setPendingNotice]=useState(false);
  const [draftReady,setDraftReady]=useState(false);
  const [commentDeleteKeys,setCommentDeleteKeys]=useState<DeleteKeys>({});
  const [reactedPosts,setReactedPosts]=useState<ReactionHistory>({});
  const [reacting,setReacting]=useState<{postId:string;kind:"heard"|"same"}|null>(null);
  const [voiceState,setVoiceState]=useState<VoiceState>("idle");
  const [activeVoiceField,setActiveVoiceField]=useState<VoiceField>("body");
  const [voiceMessage,setVoiceMessage]=useState("");
  const [voiceUndo,setVoiceUndo]=useState<VoiceSnapshot|null>(null);
  const recognitionRef=useRef<SpeechRecognitionLike|null>(null),recorderRef=useRef<MediaRecorder|null>(null),streamRef=useRef<MediaStream|null>(null),chunksRef=useRef<Blob[]>([]),voiceFieldRef=useRef<VoiceField>("body"),voiceBaseRef=useRef(""),browserTranscriptRef=useRef("");
  const speechSegmentsRef=useRef<Map<number,string>>(new Map()),speechPrefixRef=useRef(""),voiceSessionRef=useRef(0),voiceStartPendingRef=useRef(false),voiceAutoStopRef=useRef<ReturnType<typeof setTimeout>|null>(null),speechRestartRef=useRef<ReturnType<typeof setTimeout>|null>(null),transcriptionAbortRef=useRef<AbortController|null>(null),fieldRevisionRef=useRef({title:0,body:0,query:0,comment:0});
  const commentVoiceTargetRef=useRef<CommentVoiceTarget|null>(null),voiceCommentPostIdRef=useRef<string|null>(null);
  const titleInputRef=useRef<HTMLInputElement|null>(null);
  const bodyInputRef=useRef<HTMLTextAreaElement|null>(null);
  const feedRequestRef=useRef(0);

  const loadPosts = useCallback(async (offset=0,append=false,override?:FeedQueryOverride) => {
    const requestId=++feedRequestRef.current;
    if(append){setFeedLoadingMore(true);setFeedMoreError(false)}else setFeedState("loading");
    try {
      const activeTopic=override?.topic??topic,activeQuery=override?.query??query,activeSort=override?.sort??sort;
      const params=new URLSearchParams({limit:String(FEED_PAGE_SIZE),offset:String(Math.max(0,offset)),sort:activeSort});
      if(activeTopic!=="전체")params.set("category",activeTopic);
      if(activeQuery.trim())params.set("q",activeQuery.trim());
      const response=await fetch(`/api/posts?${params.toString()}`,{cache:"no-store"});
      const data=await response.json() as FeedApiResponse;
      if(!response.ok)throw new Error(data.error||"feed");
      if(requestId!==feedRequestRef.current)return;
      const incoming=normalizeFeedPosts(data.posts||[]);
      setPosts((current)=>{
        if(!append)return incoming;
        const merged=new Map(current.map((post)=>[post.id,post]));
        incoming.forEach((post)=>merged.set(post.id,post));
        return [...merged.values()];
      });
      const nextOffset=Number.isFinite(data.nextOffset)?Math.max(0,Number(data.nextOffset)):offset+incoming.length;
      const resultTotal=Number.isFinite(data.total)?Math.max(0,Number(data.total)):nextOffset;
      setFeedNextOffset(nextOffset);
      setHasMorePosts(typeof data.hasMore==="boolean"?data.hasMore:nextOffset<resultTotal);
      if(Number.isFinite(data.siteTotal))setFeedTotal(Math.max(0,Number(data.siteTotal)));
      else if(!append&&!activeQuery.trim()&&activeTopic==="전체")setFeedTotal(resultTotal);
      setFeedMoreError(false);
      setFeedState("ready");
    } catch {
      if(requestId!==feedRequestRef.current)return;
      if(append)setFeedMoreError(true);else setFeedState("error");
    } finally {
      if(requestId===feedRequestRef.current)setFeedLoadingMore(false);
    }
  }, [query,sort,topic]);

  const syncPostComments = useCallback((postId:string, comments:Comment[]) => {
    setPosts((current) => current.map((post) => post.id===postId ? {...post,comments} : post));
  }, []);

  useEffect(()=>{
  if(selectedPostId)return;
  const timer=window.setTimeout(()=>void loadPosts(0,false),query.trim()?220:0);
  return()=>window.clearTimeout(timer);
},[loadPosts,query,selectedPostId]);

  useEffect(()=>{
    try{const draft=JSON.parse(sessionStorage.getItem(POST_DRAFT_KEY)||"null") as {title?:string;body?:string;category?:string}|null;if(draft){setTitle(draft.title||"");setBody(draft.body||"");if(draft.category) setCategory(draft.category)}}catch{/* Ignore a damaged local draft. */}
    try{localStorage.removeItem("jinju-owned-posts-v1")}catch{/* Remove legacy post deletion credentials when storage is available. */}
    setCommentDeleteKeys(readKeys(COMMENT_DELETE_KEYS));
    try {
      const stored=JSON.parse(localStorage.getItem(REACTION_HISTORY_KEY)||"{}") as unknown;
      setReactedPosts(activeReactionHistory(stored));
    } catch {/* Ignore damaged reaction history. */}
    setDraftReady(true);
  },[]);

  useEffect(()=>{if(!draftReady)return;try{if(title||body)sessionStorage.setItem(POST_DRAFT_KEY,JSON.stringify({title,body,category}));else sessionStorage.removeItem(POST_DRAFT_KEY)}catch{/* Draft storage is best effort. */}},[body,category,draftReady,title]);

  useEffect(()=>{
    if(!composerOpen)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const frame=requestAnimationFrame(()=>bodyInputRef.current?.focus());
    return()=>{cancelAnimationFrame(frame);document.body.style.overflow=previousOverflow};
  },[composerOpen]);

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

  useEffect(() => {
    if (!introReady || showIntro || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    type MotionPhase = "idle" | "waiting-initial" | "queued-initial" | "active-initial" | "waiting-followup" | "queued-followup" | "active-followup" | "done";
    type MotionCampaign = { phase: MotionPhase; generation: number; timer?: number };
    type MotionJob = { node: HTMLElement; generation: number; followup: boolean };

    const pairClass = "is-share-motion-pair";
    const singleClass = "is-share-motion-single";
    const observedNodes = new Set<HTMLElement>();
    const visibleNodes = new WeakSet<HTMLElement>();
    const campaigns = new Map<HTMLElement, MotionCampaign>();
    const timers = new Set<number>();
    const queue: MotionJob[] = [];
    let cancelled = false;
    let cancelActive: (() => void) | null = null;

    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!cancelled) callback();
      }, delay);
      timers.add(timer);
      return timer;
    };
    const clearScheduled = (timer?: number) => {
      if (timer === undefined) return;
      window.clearTimeout(timer);
      timers.delete(timer);
    };

    const runNext = () => {
      if (cancelled || cancelActive) return;
      while (queue.length) {
        const job = queue.shift()!;
        const campaign = campaigns.get(job.node);
        const queuedPhase = job.followup ? "queued-followup" : "queued-initial";
        if (!campaign || campaign.generation !== job.generation || campaign.phase !== queuedPhase) continue;
        if (!job.node.isConnected || !visibleNodes.has(job.node)) {
          campaign.phase = job.followup ? "done" : "idle";
          continue;
        }

        const className = job.followup ? singleClass : pairClass;
        campaign.phase = job.followup ? "active-followup" : "active-initial";
        let finished = false;
        let fallbackTimer: number | undefined;
        const finish = () => {
          if (finished) return;
          finished = true;
          job.node.removeEventListener("animationend", onAnimationEnd);
          clearScheduled(fallbackTimer);
          job.node.classList.remove(className);
          cancelActive = null;
          if (!cancelled && campaign.generation === job.generation) {
            if (job.followup) {
              campaign.phase = "done";
            } else if (job.node.isConnected) {
              campaign.phase = "waiting-followup";
              campaign.timer = schedule(() => {
                campaign.timer = undefined;
                if (campaign.phase !== "waiting-followup" || campaign.generation !== job.generation) return;
                if (!job.node.isConnected || !visibleNodes.has(job.node)) {
                  campaign.phase = "done";
                  return;
                }
                campaign.phase = "queued-followup";
                queue.push({ node: job.node, generation: job.generation, followup: true });
                runNext();
              }, 6000);
            } else {
              campaign.phase = "done";
            }
          }
          runNext();
        };
        const onAnimationEnd = (event: AnimationEvent) => {
          if (event.target === job.node && event.animationName === "share-label-pop-wiggle") finish();
        };
        cancelActive = () => {
          finished = true;
          job.node.removeEventListener("animationend", onAnimationEnd);
          clearScheduled(fallbackTimer);
          job.node.classList.remove(className);
        };
        job.node.addEventListener("animationend", onAnimationEnd);
        job.node.classList.add(className);
        fallbackTimer = schedule(finish, job.followup ? 1400 : 2700);
        return;
      }
    };

    const scheduleInitial = (node: HTMLElement) => {
      const campaign = campaigns.get(node);
      if (!campaign || campaign.phase !== "idle") return;
      campaign.generation += 1;
      const generation = campaign.generation;
      campaign.phase = "waiting-initial";
      campaign.timer = schedule(() => {
        campaign.timer = undefined;
        if (campaign.phase !== "waiting-initial" || campaign.generation !== generation) return;
        if (!node.isConnected || !visibleNodes.has(node)) {
          campaign.phase = "idle";
          return;
        }
        campaign.phase = "queued-initial";
        queue.push({ node, generation, followup: false });
        runNext();
      }, 500);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      entries.forEach((entry) => {
        const node = entry.target as HTMLElement;
        const campaign = campaigns.get(node);
        if (!campaign) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          visibleNodes.add(node);
          scheduleInitial(node);
        } else {
          visibleNodes.delete(node);
          if (campaign.phase === "waiting-initial") {
            clearScheduled(campaign.timer);
            campaign.timer = undefined;
            campaign.generation += 1;
            campaign.phase = "idle";
          } else if (campaign.phase === "queued-initial") {
            campaign.generation += 1;
            campaign.phase = "idle";
          }
        }
      });
      runNext();
    }, { threshold: [0, 0.6] });

    const observeShareLabels = () => {
      observedNodes.forEach((node) => {
        if (node.isConnected) return;
        observer.unobserve(node);
        clearScheduled(campaigns.get(node)?.timer);
        node.classList.remove(pairClass, singleClass);
        visibleNodes.delete(node);
        campaigns.delete(node);
        observedNodes.delete(node);
      });
      document.querySelectorAll<HTMLElement>(".share-label-motion").forEach((node) => {
        if (observedNodes.has(node)) return;
        observedNodes.add(node);
        campaigns.set(node, { phase: "idle", generation: 0 });
        observer.observe(node);
      });
    };
    const mutationObserver = new MutationObserver(observeShareLabels);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    observeShareLabels();

    return () => {
      cancelled = true;
      observer.disconnect();
      mutationObserver.disconnect();
      cancelActive?.();
      timers.forEach((timer) => window.clearTimeout(timer));
      observedNodes.forEach((node) => node.classList.remove(pairClass, singleClass));
    };
  }, [introReady, showIntro]);

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

  const loadMorePosts=useCallback(()=>{
    if(feedLoadingMore||!hasMorePosts)return;
    void loadPosts(feedNextOffset,true);
  },[feedLoadingMore,feedNextOffset,hasMorePosts,loadPosts]);

  function prepareVoiceField(field: ComposerVoiceField) {
    selectVoiceField(field);
  }

  function selectVoiceField(field:VoiceField){voiceFieldRef.current=field;setActiveVoiceField(field)}
  function joinVoice(base:string,addition:string,field:VoiceField){if(field==="title")return [base.trim(),addition.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").slice(0,80);if(field==="query")return [base.trim(),addition.trim()].filter(Boolean).join(" ").replace(/\s+/g," ").slice(0,200);return [base.trimEnd(),addition.trim()].filter(Boolean).join(base.trim()?"\n":"").slice(0,2000)}
  function showLiveTranscript(target:VoiceField,text:string){const value=joinVoice(voiceBaseRef.current,text,target);if(target==="query"){setQuery(value);return}if(target==="comment"){const commentTarget=commentVoiceTargetRef.current;if(commentTarget&&commentTarget.postId===voiceCommentPostIdRef.current)commentTarget.apply(value);return}const input=target==="title"?titleInputRef.current:bodyInputRef.current;if(input)input.value=value}
  function clearVoiceTimers(){if(voiceAutoStopRef.current){clearTimeout(voiceAutoStopRef.current);voiceAutoStopRef.current=null}if(speechRestartRef.current){clearTimeout(speechRestartRef.current);speechRestartRef.current=null}}
  function stopVoice(discard=false){
    clearVoiceTimers();
    if(discard){voiceSessionRef.current+=1;transcriptionAbortRef.current?.abort()}
    const recognition=recognitionRef.current;
    if(recognition){recognition.onend=null;recognition.onresult=null;recognition.onerror=null;try{discard?recognition.abort():recognition.stop()}catch{/* already stopped */}recognitionRef.current=null}
    const recorder=recorderRef.current;
    if(recorder&&recorder.state!=="inactive"){if(discard)recorder.onstop=null;recorder.stop()}
    if(discard){streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;recorderRef.current=null;chunksRef.current=[];browserTranscriptRef.current="";speechSegmentsRef.current.clear();speechPrefixRef.current="";voiceCommentPostIdRef.current=null;setVoiceState("idle")}
  }
  function updateQuery(value:string){if(voiceFieldRef.current==="query"&&(voiceStartPendingRef.current||voiceState==="listening"||voiceState==="recording"))stopVoice(true);if(voiceFieldRef.current==="query")setVoiceMessage("");fieldRevisionRef.current.query+=1;setQuery(value)}
  function updateTitle(value:string){if(voiceState==="listening"||voiceState==="recording")stopVoice(true);fieldRevisionRef.current.title+=1;setVoiceUndo(null);setTitle(value.slice(0,80))}
  function updateBody(value:string){if(voiceState==="listening"||voiceState==="recording")stopVoice(true);fieldRevisionRef.current.body+=1;setVoiceUndo(null);setBody(value.slice(0,2000))}
  function updateCommentVoice(){if(voiceFieldRef.current==="comment"&&(voiceStartPendingRef.current||voiceState!=="idle"))stopVoice(true);if(voiceFieldRef.current==="comment")setVoiceMessage("");fieldRevisionRef.current.comment+=1}
  async function toggleCommentVoice(target:CommentVoiceTarget){commentVoiceTargetRef.current=target;await toggleVoice("comment")}
  function completeCommentVoice(){if(voiceFieldRef.current==="comment")stopVoice(true);commentVoiceTargetRef.current=null;voiceCommentPostIdRef.current=null;fieldRevisionRef.current.comment+=1;if(voiceFieldRef.current==="comment"){selectVoiceField("body");setVoiceMessage("")}}
  function undoVoice(){if(!voiceUndo)return;stopVoice(true);setTitle(voiceUndo.title);setBody(voiceUndo.body);selectVoiceField(voiceUndo.field);setVoiceUndo(null);setVoiceMessage("직전 음성 입력을 되돌렸습니다.")}
  function clearVoiceField(){if(activeVoiceField!=="title"&&activeVoiceField!=="body")return;stopVoice(true);activeVoiceField==="title"?setTitle(""):setBody("");setVoiceUndo(null)}
  async function transcribe(blob: Blob, target: VoiceField, browserText: string, base: string, sessionId:number, revision:number, targetCategory:string) {
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
      form.append("category",target==="query"?"":targetCategory);
      const response = await fetch("/api/transcribe", { method: "POST", body: form, signal:controller.signal });
      const data = await response.json() as { text?: string; error?: string };
      const transcript = response.ok && data.text ? data.text.trim() : browserText.trim();
      if (!transcript) throw new Error(data.error || "음성을 글로 바꾸지 못했습니다. 마이크 권한을 확인해주세요.");
      if(sessionId!==voiceSessionRef.current)return;
      if(fieldRevisionRef.current[target]===revision){
        if (target === "title") setTitle(joinVoice(base, transcript, target));
        else if (target === "query") setQuery(joinVoice(base, transcript, target));
        else if (target === "comment") {const commentTarget=commentVoiceTargetRef.current;if(commentTarget&&commentTarget.postId===voiceCommentPostIdRef.current)commentTarget.apply(joinVoice(base,transcript,target));}
        else setBody(joinVoice(base, transcript, target));
        setVoiceMessage(response.ok ? "음성 입력을 정확하게 다듬었습니다." : "기기에서 인식한 문장을 입력했습니다.");
      }else setVoiceMessage("수정하신 내용을 그대로 유지했습니다.");
    } catch (error) {
      if(sessionId===voiceSessionRef.current)setVoiceMessage(error instanceof DOMException&&error.name==="AbortError"?"빠른 입력 결과를 유지했습니다. 계속 수정하거나 다시 말할 수 있어요.":error instanceof Error ? error.message : "음성 입력을 사용할 수 없습니다.");
    } finally {
      clearTimeout(timeout);
      if(transcriptionAbortRef.current===controller)transcriptionAbortRef.current=null;
      if(sessionId===voiceSessionRef.current){chunksRef.current=[];browserTranscriptRef.current="";speechSegmentsRef.current.clear();speechPrefixRef.current="";voiceCommentPostIdRef.current=null;setVoiceState("idle")}
    }
  }

  async function startRecording(authorizedStream?:MediaStream) {
    if(voiceStartPendingRef.current)return;
    if(voiceFieldRef.current==="comment"&&!commentVoiceTargetRef.current){setVoiceMessage("댓글 입력칸을 확인한 뒤 다시 눌러주세요.");return}
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      authorizedStream?.getTracks().forEach(track=>track.stop());
      setVoiceMessage("이 브라우저에서는 녹음을 지원하지 않습니다. 최신 Chrome 또는 Safari를 사용해주세요.");
      return;
    }
    voiceStartPendingRef.current=true;
    let openedStream=authorizedStream;
    let sessionId=0;
    try {
      sessionId=voiceSessionRef.current+1;
      voiceSessionRef.current=sessionId;
      transcriptionAbortRef.current?.abort();
      clearVoiceTimers();
      const target = voiceFieldRef.current;
      if(target==="title"||target==="body")setVoiceUndo({ field: target, title, body });
      setVoiceMessage("마이크 연결 중…");
      const stream = authorizedStream||await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      openedStream=stream;
      if(sessionId!==voiceSessionRef.current){stream.getTracks().forEach(track=>track.stop());voiceStartPendingRef.current=false;return}
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 128000 }) : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      browserTranscriptRef.current = "";
      speechSegmentsRef.current.clear();
      speechPrefixRef.current="";
      const commentTarget=target==="comment"?commentVoiceTargetRef.current:null;
      const base=target==="title"?title:target==="query"?query:target==="comment"?commentTarget?.base||"":body;
      const targetCategory=target==="comment"?commentTarget?.category||"":category;
      voiceCommentPostIdRef.current=target==="comment"?commentTarget?.postId||null:null;
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
        if(quickText){if(target==="title")setTitle(joinVoice(base,quickText,target));else if(target==="query")setQuery(joinVoice(base,quickText,target));else if(target==="comment"){const liveTarget=commentVoiceTargetRef.current;if(liveTarget&&liveTarget.postId===voiceCommentPostIdRef.current)liveTarget.apply(joinVoice(base,quickText,target))}else setBody(joinVoice(base,quickText,target))}
        void transcribe(blob, target, quickText, base, sessionId, revision, targetCategory);
      };
      recorder.start(1000);
      voiceStartPendingRef.current=false;
      voiceAutoStopRef.current=setTimeout(()=>{if(sessionId===voiceSessionRef.current&&recorder.state==="recording"){setVoiceMessage("2분 녹음을 마쳐 정확한 문장으로 바꾸고 있습니다…");recorder.stop()}},MAX_RECORDING_MS);
      setVoiceState("recording");
      setVoiceMessage(`${target === "title" ? "제목" : target === "query" ? "검색어" : target === "comment" ? "댓글" : "본문"} 녹음 중 · 한 번 더 누르면 완료됩니다.`);
    } catch (error) {
      voiceStartPendingRef.current=false;
      openedStream?.getTracks().forEach(track=>track.stop());
      if(sessionId!==voiceSessionRef.current)return;
      setVoiceState("idle");
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setVoiceMessage(denied ? "마이크가 차단됐습니다. 주소창 자물쇠 → 마이크 → 허용을 눌러주세요." : "마이크를 시작하지 못했습니다. 다른 앱이 마이크를 사용 중인지 확인해주세요.");
    }
  }

  async function toggleVoice(target:VoiceField=voiceFieldRef.current) {
    if(voiceStartPendingRef.current)return;
    const sameTarget=voiceFieldRef.current===target;
    if (sameTarget&&voiceState === "recording") { recorderRef.current?.stop(); return; }
    if (sameTarget&&voiceState === "transcribing") {transcriptionAbortRef.current?.abort();setVoiceState("idle");selectVoiceField(target);await startRecording();return;}
    if (sameTarget&&voiceState === "listening") { stopVoice(); return; }
    if(voiceState!=="idle")stopVoice(true);
    selectVoiceField(target);
    await startRecording();
  }

  useEffect(()=>{const voiceActive=voiceStartPendingRef.current||voiceState!=="idle";if(voiceFieldRef.current==="comment"&&commentVoiceTargetRef.current?.postId!==selectedPostId){if(voiceActive)stopVoice(true);commentVoiceTargetRef.current=null;voiceCommentPostIdRef.current=null;selectVoiceField("body");setVoiceMessage("");return}if(voiceActive&&selectedPostId&&voiceFieldRef.current==="query")stopVoice(true)},[selectedPostId,voiceState]);

  function searchVoicePlaceholder(){if(activeVoiceField!=="query")return "속마음을 검색해 보세요";if(voiceStartPendingRef.current)return "마이크 연결 중…";if(voiceState==="recording")return "듣고 있어요…";if(voiceState==="transcribing")return "검색어를 확인하고 있어요…";return !query&&voiceMessage?voiceMessage:"속마음을 검색해 보세요"}

  function clearPublishedDraft() {
    try{sessionStorage.removeItem(POST_DRAFT_KEY)}catch{/* already clear */}
    setTitle("");
    setBody("");
    setTopic("전체");
  }

  async function submitReviewedPost(finalTitle: string, titleGenerated: boolean, reviewToken = reviewFeedback?.reviewToken || "") {
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: finalTitle, titleGenerated, content: body, category, reviewToken }),
    });
    const data = await response.json() as { error?:string; id?:string; displayName?:string; status?:"approved"|"pending"|"revision_required"; review?:ReviewFeedback };
    if (response.status === 422 && data.review) {
      setReviewFeedback({ ...data.review, suggestedTitle: finalTitle });
      setSubmitStatus(data.error || "이 문장만 조금 바꾸면 올릴 수 있어요.");
      return false;
    }
    if (!response.ok) { setSubmitStatus(data.error || "지금은 저장할 수 없습니다."); return false; }
    clearPublishedDraft();
    setReviewFeedback(null);
    if (data.status === "pending") {
      setSubmitStatus("운영자 승인 대기 상태로 안전하게 보관했습니다.");
      setPendingNotice(true);
      return true;
    }
    await loadPosts(0,false,{topic:"전체",query:"",sort:"latest"});
    setPublishedPostId(data.id || null);
    setSubmitStatus("");
    setComposerOpen(false);
    return true;
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (body.trim().length < 30) { setSubmitStatus("상황과 느낀 점을 30자 이상 적어주세요."); return; }
    if(submitBusy)return;
    if(postTurnstileRequired&&!postTurnstileToken){setSubmitStatus("보안 확인이 끝난 뒤 다시 눌러주세요.");return}
    setSubmitBusy(true);
    setReviewFeedback(null);
    setSubmitStatus("게시 전 우리를 지키는 표현을 확인하고 있어요.");
    try {
      const reviewResponse = await fetch("/api/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, text: body, category, turnstileToken: postTurnstileToken }) });
      const review = await reviewResponse.json() as ReviewFeedback & { error?: string };
      if (!reviewResponse.ok) { setSubmitStatus(review.error || "검수하지 못했습니다. 잠시 후 다시 시도해주세요."); return; }
      const finalTitle = title.trim() || review.suggestedTitle || "익명의 의견";
      if (review.decision === "revise") {
        setReviewFeedback({ ...review, suggestedTitle: finalTitle });
        setSubmitStatus("이 문장만 조금 바꾸면 올릴 수 있어요.");
        return;
      }
      await submitReviewedPost(finalTitle, !title.trim(), review.reviewToken);
    } catch {
      setSubmitStatus("연결을 확인한 뒤 다시 시도해주세요. 초안은 그대로 보관되어 있습니다.");
    } finally {
      setSubmitBusy(false);
      setPostTurnstileToken("");
      setPostTurnstileReset((value)=>value+1);
    }
  }

  function returnToEdit() {
    setReviewFeedback(null);
    setSubmitStatus("수정한 뒤 다시 확인해주세요.");
    requestAnimationFrame(() => bodyInputRef.current?.focus());
  }

  async function react(postId: string, kind: "heard" | "same") {
    if(reactedPosts[postId]?.kind===kind||reacting)return;
    setReacting({postId,kind});
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/react`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data=await response.json() as {error?:string;post?:{heard:number;same:number}};
      if(!response.ok||!data.post)throw new Error(data.error||"반응을 남기지 못했습니다.");
      setPosts((current)=>current.map((post)=>post.id===postId?{...post,heard:data.post!.heard,same:data.post!.same}:post));
      const next=recordReaction(reactedPosts,postId,kind);
      setReactedPosts(next);
      try{localStorage.setItem(REACTION_HISTORY_KEY,JSON.stringify(next))}catch{/* Server-side one-time protection remains active. */}
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "반응을 남기지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setReacting(null);
    }
  }

  async function share(post: Post) {
    const url = `${window.location.origin}/post/${encodeURIComponent(post.id)}?share=jinju`;
    const shareText = "개인정보 없이 할 말은 하는 익명 커뮤니티";
    const sharedMessage = `${shareText}\n\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: sharedMessage });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(sharedMessage).catch(() => undefined);
    }
  }

  async function addComment(postId: string, comment: string, turnstileToken: string):Promise<Comment> {
    const trimmed = comment.trim().slice(0, 2000);
    if (!trimmed) throw new Error("댓글을 두 글자 이상 적어주세요.");
    const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: trimmed, turnstileToken }) });
    const data = await response.json() as { error?: string; id?: string;deleteKey?:string; body?: string; createdAt?: string; displayName?: string; review?: ReviewFeedback };
    if (response.status === 422 && data.review) throw new CommentReviewError(data.review);
    if (!response.ok) throw new Error(data.error || "댓글을 등록할 수 없습니다.");
    const created={id:data.id||Date.now(),body:data.body||trimmed,displayName:data.displayName,createdAt:data.createdAt||new Date().toISOString()};
    if(data.id&&data.deleteKey){const next={...commentDeleteKeys,[data.id]:data.deleteKey};setCommentDeleteKeys(next);saveKeys(COMMENT_DELETE_KEYS,next)}
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, comments: [...post.comments, created] } : post));
    return created;
  }

  async function deleteComment(postId:string,commentId:string|number){const key=String(commentId),deleteKey=commentDeleteKeys[key];if(!deleteKey)throw new Error("이 댓글을 삭제할 권한을 확인할 수 없습니다.");const response=await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`,{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({commentId:key,deleteKey})});const data=await response.json() as {error?:string};if(!response.ok)throw new Error(data.error||"댓글을 삭제하지 못했습니다.");const next={...commentDeleteKeys};delete next[key];setCommentDeleteKeys(next);saveKeys(COMMENT_DELETE_KEYS,next);setPosts(current=>current.map(post=>post.id===postId?{...post,comments:post.comments.filter(item=>String(item.id)!==key)}:post))}

  function openPost(postId: string) {
    if(voiceFieldRef.current==="query"&&(voiceStartPendingRef.current||voiceState!=="idle"))stopVoice(true);
    window.history.pushState({}, "", `/post/${encodeURIComponent(postId)}`);
    setSelectedPostId(postId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closePost() {
    completeCommentVoice();
    window.history.pushState({}, "", "/");
    setSelectedPostId(null);
  }

  function openFeedback(post:Post){if(voiceFieldRef.current==="comment")completeCommentVoice();setFeedbackPost(post)}

  function openComposer() {
    if(voiceFieldRef.current==="query"&&(voiceStartPendingRef.current||voiceState!=="idle"))stopVoice(true);
    if(voiceFieldRef.current==="comment")completeCommentVoice();
    selectVoiceField("body");
    setVoiceMessage("");
    setMobileMenuOpen(false);
    setPublishedPostId(null);
    setSubmitStatus("");
    setPostTurnstileToken("");
    setPostTurnstileReset((value)=>value+1);
    setComposerOpen(true);
  }

  function closeComposer() {
    if(submitBusy)return;
    stopVoice(true);
    setReviewFeedback(null);
    setPendingNotice(false);
    setComposerOpen(false);
  }

  return (
    <>
      {!introReady ? <div className="intro-bootstrap" aria-hidden="true" /> : showIntro && <Intro onComplete={completeIntro} />}
      {feedbackPost && <FeedbackDialog postId={feedbackPost.id} postTitle={feedbackPost.title} onClose={() => setFeedbackPost(null)} />}
      {composerOpen && <section className="composer-screen" role="dialog" aria-modal="true" aria-labelledby="write-title">
        <header className="composer-screen-header">
          <button type="button" onClick={closeComposer} aria-label="글쓰기 닫기">닫기</button>
          <div><strong>새 의견 쓰기</strong><span>초안 자동 저장</span></div>
          <span aria-hidden="true" />
        </header>
        <div className="composer-screen-shell">
          <div className="composer-intro">
            <Pearl size={58} />
            <div><p className="eyebrow">하세요!</p><h2 id="write-title">의견 남기기</h2><p>내가 겪은 상황과 느낀 점을 적어주세요.</p></div>
          </div>
          <form className="chat-composer" onSubmit={publish}>
            {reviewFeedback && <div className="review-overlay" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
              <div className="review-dialog">
                <p className="review-eyebrow">게시 전 확인</p>
                <h3 id="review-dialog-title">이 문장만 조금 바꾸면 올릴 수 있어요.</h3>
                <p>{reviewFeedback.explanation}</p>
                {reviewFeedback.suggestion && <div className="review-suggestion"><strong>이렇게 바꿔보세요</strong><span>{reviewFeedback.suggestion}</span></div>}
                {reviewFeedback.containsPii && <p className="review-pii-warning">개인정보를 지운 뒤 다시 확인해주세요.</p>}
                <div className="review-dialog-actions">
                  <button className="review-edit-button" onClick={returnToEdit} type="button">수정하기</button>
                </div>
              </div>
            </div>}
            {pendingNotice && <div className="review-overlay" role="dialog" aria-modal="true" aria-labelledby="pending-dialog-title">
              <div className="pending-dialog">
                <span className="pending-symbol" aria-hidden="true">●</span>
                <h3 id="pending-dialog-title">앗, 너무 뜨거워요</h3>
                <p>잠시 식힐게요.<br />운영자 승인이 필요합니다.</p>
                <span>글은 공개되지 않고 승인 대기 상태로 안전하게 보관되었습니다.</span>
                <button type="button" onClick={() => {setPendingNotice(false);setComposerOpen(false)}}>확인</button>
              </div>
            </div>}
            <div className="composer-selects"><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="게시판 선택">{topics.slice(1).map((item) => <option key={item}>{item}</option>)}</select></div>
            <input ref={titleInputRef} className={`chat-title${activeVoiceField === "title" ? " voice-target" : ""}`} value={title} onFocus={() => prepareVoiceField("title")} onChange={(event) => updateTitle(event.target.value)} placeholder="비워두면 본문에서 제목을 추천합니다" aria-label="의견 제목" />
            <textarea ref={bodyInputRef} className={activeVoiceField === "body" ? "voice-target" : ""} value={body} onFocus={() => prepareVoiceField("body")} onChange={(event) => updateBody(event.target.value)} placeholder="편하게 적어주세요." aria-label="의견 본문" rows={10} />
            {voiceMessage && <p className="voice-message" role="status">{voiceMessage}</p>}
            <TurnstileChallenge action="post" resetSignal={postTurnstileReset} onToken={setPostTurnstileToken} onRequiredChange={setPostTurnstileRequired} />
            {submitStatus && <p className="composer-status" role="status">{submitStatus}</p>}
            <div className="composer-bottom"><span>제목 {title.length}/80 · 본문 {body.length}/2,000</span><div className="composer-actions">{voiceUndo && <button className="voice-text-button" type="button" onClick={undoVoice}>되돌리기</button>}<button className="voice-text-button" type="button" onClick={clearVoiceField}>지우기</button><button className={`voice-input-button${(activeVoiceField==="title"||activeVoiceField==="body")&&voiceState!=="idle"?" listening":""}`} onClick={()=>void toggleVoice()} type="button" aria-pressed={(activeVoiceField==="title"||activeVoiceField==="body")&&voiceState==="recording"} aria-label={`${activeVoiceField === "title" ? "제목" : "본문"}에 음성 입력${voiceState==="transcribing"?" 다시 시작":""}`}><span className="mic-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z"/><path d="M5 10.5a7 7 0 0 0 14 0"/><path d="M12 17.5V21"/><path d="M9 21h6"/></svg></span></button><button className="submit-review-button" type="submit" disabled={submitBusy||(postTurnstileRequired&&!postTurnstileToken)}><span>{submitBusy?"확인 중…":"게시 전 확인"}</span><span className="send-arrow" aria-hidden="true">↑</span></button></div></div>
          </form>
        </div>
      </section>}
      {selectedPost ? (
        <PostDetail
          key={selectedPost.id}
          post={selectedPost}
          onBack={closePost}
          onReact={(kind) => react(selectedPost.id, kind)}
          reactedKind={reactedPosts[selectedPost.id]?.kind||null}
          reactingKind={reacting?.postId===selectedPost.id?reacting.kind:null}
          onShare={() => share(selectedPost)}
          onFeedback={() => openFeedback(selectedPost)}
          onComment={(comment,turnstileToken) => addComment(selectedPost.id, comment, turnstileToken)}
          commentVoiceActive={activeVoiceField==="comment"}
          commentVoicePending={voiceStartPendingRef.current}
          commentVoiceState={voiceState}
          commentVoiceMessage={activeVoiceField==="comment"?voiceMessage:""}
          onToggleCommentVoice={(base,apply)=>toggleCommentVoice({postId:selectedPost.id,category:selectedPost.category,base,apply})}
          onCommentVoiceEdit={updateCommentVoice}
          onCommentVoiceSubmitted={completeCommentVoice}
          canDeleteComment={(commentId)=>Boolean(commentDeleteKeys[String(commentId)])}
          onDeleteComment={(commentId)=>deleteComment(selectedPost.id,commentId)}
          onCommentsLoaded={syncPostComments}
        />
      ) : (
        <div className="chat-app">
          <Sidebar
            topic={topic}
            sort={sort}
            onTopic={(value) => { setTopic(value); setMobileMenuOpen(false); }}
            onSort={setSort}
            onWrite={openComposer}
            mobileOpen={mobileMenuOpen}
          />
          {mobileMenuOpen && <button className="mobile-menu-scrim" onClick={() => setMobileMenuOpen(false)} aria-label="메뉴 닫기" />}

          <main className="chat-main" id="feed">
            <header className="mobile-chat-header">
              <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="게시판 메뉴 열기">☰</button>
              <a href="/" aria-label="진주.kr 메인으로"><Pearl size={36} /><span><strong>진주</strong><small>할 말은 하세요!</small></span></a>
              <button className="mobile-write-link" type="button" onClick={openComposer}>나의 의견</button>
            </header>

            <div className="feed-shell">
              <header className="feed-heading">
                <div><h1>새로운 의견</h1></div>
                <span>{feedTotal}개의 공개 의견</span>
              </header>

              {feedState === "error" && <section className="feed-state feed-state-error" role="alert"><div><h2>의견을 불러오지 못했어요.</h2><p>잠시 후 다시 시도해 주세요.</p></div><button type="button" onClick={() => { setFeedState("loading"); void loadPosts(0,false); }}>다시 불러오기</button></section>}

              <form className="chat-search" role="search" onSubmit={(event) => event.preventDefault()}>
                <span className="search-privacy-badge">개인정보 0%</span>
                <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder={searchVoicePlaceholder()} aria-label="의견 검색어" aria-describedby="search-voice-status" />
                <button className={`search-voice-button${activeVoiceField==="query"&&(voiceStartPendingRef.current||voiceState!=="idle")?" listening":""}`} onClick={()=>void toggleVoice("query")} type="button" disabled={voiceStartPendingRef.current} aria-pressed={activeVoiceField==="query"&&voiceState==="recording"} aria-label={voiceStartPendingRef.current?"검색어 음성 연결 중":activeVoiceField==="query"&&voiceState==="recording"?"검색어 음성 입력 중지":"검색어 음성 입력"} title={activeVoiceField==="query"&&voiceState==="idle"&&voiceMessage?voiceMessage:undefined}><span className="mic-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z"/><path d="M5 10.5a7 7 0 0 0 14 0"/><path d="M12 17.5V21"/><path d="M9 21h6"/></svg></span></button>
                <button className="search-send" type="submit" aria-label="검색">↑</button>
                <span className="search-voice-status" id="search-voice-status" role="status" aria-live="polite">{activeVoiceField==="query"?voiceMessage:""}</span>
              </form>

              <div className="mobile-channel-strip" aria-label="게시판 선택">
                {topics.map((item) => <button key={item} className={topic === item ? "active" : ""} onClick={() => setTopic(item)} type="button">{item}</button>)}
              </div>

              <section className="post-feed" aria-label="익명 의견 목록">
                {filteredPosts.slice(0, 3).map((post) => (
                  <PostCard key={post.id} post={post} reactedKind={reactedPosts[post.id]?.kind||null} reactingKind={reacting?.postId===post.id?reacting.kind:null} onOpen={() => openPost(post.id)} onReact={(kind) => react(post.id, kind)} onShare={() => share(post)} onFeedback={() => openFeedback(post)} />
                ))}
              </section>

              {filteredPosts.length > 3 && <section className="mid-feed-write-cta" aria-label="의견 쓰기 안내">
                <div><Pearl size={38} /><span><strong>읽다 보니 할 말이 생기셨나요?</strong></span></div>
                <button type="button" onClick={openComposer}>의견 쓰기</button>
              </section>}

              <section className="post-feed continued-feed" aria-label="더 많은 익명 의견">
                {filteredPosts.slice(3).map((post) => (
                  <PostCard key={post.id} post={post} reactedKind={reactedPosts[post.id]?.kind||null} reactingKind={reacting?.postId===post.id?reacting.kind:null} onOpen={() => openPost(post.id)} onReact={(kind) => react(post.id, kind)} onShare={() => share(post)} onFeedback={() => openFeedback(post)} />
                ))}
              </section>

              {hasMorePosts && <div className="feed-pager-slot">
                <button className="feed-more-button" type="button" onClick={loadMorePosts} disabled={feedLoadingMore} aria-busy={feedLoadingMore}>
                  <span className="feed-more-label">{feedLoadingMore?"불러오는 중…":feedMoreError?"다시 불러오기":"더 보기"}</span>
                  <span className="feed-more-arrow" aria-hidden="true">↓</span>
                </button>
              </div>}

              {feedState === "ready" && feedTotal === 0 && <section className="feed-empty"><h2>아직 공개된 의견이 없어요.</h2><p>첫 의견을 남겨주세요.</p><button type="button" onClick={openComposer}>의견 남기기</button></section>}
              {feedState === "ready" && feedTotal > 0 && !filteredPosts.length && <section className="feed-empty"><h2>찾는 의견이 없습니다</h2><p>다른 검색어나 게시판을 선택해 보세요.</p></section>}
            </div>
          </main>
          <button className="floating-write-button" type="button" onClick={openComposer}><span aria-hidden="true">＋</span> 의견 쓰기</button>
          {publishedPostId && <div className="published-toast" role="status">
            <span>의견이 게시되었습니다.</span>
            <button type="button" onClick={() => openPost(publishedPostId)}>내 글 보기</button>
            <button type="button" onClick={() => setPublishedPostId(null)} aria-label="게시 완료 안내 닫기">×</button>
          </div>}
        </div>
      )}
    </>
  );
}

function Sidebar({ topic, sort, onTopic, onSort, onWrite, mobileOpen }: {
  topic: string;
  sort: "latest" | "popular";
  onTopic: (topic: string) => void;
  onSort: (sort: "latest" | "popular") => void;
  onWrite: () => void;
  mobileOpen: boolean;
}) {
  return (
    <aside className={`chat-sidebar${mobileOpen ? " mobile-open" : ""}`}>
      <a href="/" className="sidebar-brand" aria-label="진주.kr 메인으로"><Pearl size={44} /><span><strong>진주</strong><small>할 말은 하세요!</small></span></a>
      <button className="new-post-button" type="button" onClick={onWrite}><span>＋</span> 새 의견 쓰기</button>
      <p className="sidebar-label">게시판</p>
      <nav className="channel-list" aria-label="주제 게시판">{topics.map((item) => <button key={item} className={topic === item ? "active" : ""} onClick={() => onTopic(item)} type="button"><span>{item === "전체" ? "◉" : "#"}</span>{item}</button>)}</nav>
      <p className="sidebar-label">피드</p>
      <nav className="channel-list" aria-label="피드 정렬"><button className={sort === "latest" ? "active" : ""} onClick={() => onSort("latest")} type="button"><span>◷</span>최신 의견</button><button className={sort === "popular" ? "active" : ""} onClick={() => onSort("popular")} type="button"><span>↗</span>인기 의견</button></nav>
      <div className="sidebar-footer"><a href="/about">진주.kr 소개</a><a href="/beta">운영안내</a><a href="/principles">운영원칙</a><a href="/safety">안전안내</a><a href="/privacy">개인정보</a><a href="mailto:hello@xn--o55b9n.kr">문제제보</a><p>개인정보 0%를 지향합니다. 이름·연락처 등 개인 식별정보를 요구하지 않습니다.</p></div>
    </aside>
  );
}

function PostCard({ post, reactedKind, reactingKind, onOpen, onReact, onShare, onFeedback }: {
  post: Post;
  reactedKind: ReactionKind | null;
  reactingKind: "heard" | "same" | null;
  onOpen: () => void;
  onReact: (kind: "heard" | "same") => void;
  onShare: () => void;
  onFeedback: () => void;
}) {
  return (
    <article className="feed-post">
      <a className="post-main-link" href={`/post/${encodeURIComponent(post.id)}`} onClick={(event) => { event.preventDefault(); onOpen(); }}>
        <div className="post-meta"><span>{post.category}{post.displayName ? ` · ${post.displayName}` : ""}</span><time>{post.date}</time></div>
        <h2>{post.title}</h2><p>{post.content}</p>
      </a>
      <PostTemperature likes={post.heard} dislikes={post.same} />
      <div className="post-actions">
        <button className="pearl-reaction" onClick={() => onReact("heard")} type="button" disabled={reactedKind==="heard"||Boolean(reactingKind)} aria-pressed={reactedKind==="heard"} aria-busy={reactingKind==="heard"}><Pearl size={16} /><span>{reactingKind==="heard"?"확인 중…":"좋아요"}</span><strong>{post.heard}</strong></button>
        <button onClick={() => onReact("same")} type="button" disabled={reactedKind==="same"||Boolean(reactingKind)} aria-pressed={reactedKind==="same"} aria-busy={reactingKind==="same"}>{reactingKind==="same"?"확인 중…":"싫어요"}</button>
        <button onClick={onOpen} type="button">댓글 <span>{post.comments.length}</span></button>
        <button className="share-post-button" onClick={onShare} type="button"><span className="share-label-motion">공유하기</span></button>
        <button className="post-report" type="button" onClick={onFeedback}>의견 보내기</button>
      </div>
    </article>
  );
}

function PostDetail({ post, reactedKind, reactingKind, onBack, onReact, onShare, onFeedback, onComment, commentVoiceActive, commentVoicePending, commentVoiceState, commentVoiceMessage, onToggleCommentVoice, onCommentVoiceEdit, onCommentVoiceSubmitted, canDeleteComment, onDeleteComment, onCommentsLoaded }: {
  post: Post;
  reactedKind: ReactionKind | null;
  reactingKind: "heard" | "same" | null;
  onBack: () => void;
  onReact: (kind: "heard" | "same") => void;
  onShare: () => void;
  onFeedback: () => void;
  onComment: (comment: string, turnstileToken: string) => Promise<Comment>;
  commentVoiceActive:boolean;
  commentVoicePending:boolean;
  commentVoiceState:VoiceState;
  commentVoiceMessage:string;
  onToggleCommentVoice:(base:string,apply:(value:string)=>void)=>Promise<void>|void;
  onCommentVoiceEdit:()=>void;
  onCommentVoiceSubmitted:()=>void;
  canDeleteComment:(commentId:string|number)=>boolean;
  onDeleteComment:(commentId:string|number)=>Promise<void>;
  onCommentsLoaded:(postId:string,comments:Comment[])=>void;
}) {
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentStatus, setCommentStatus] = useState("");
  const [commentReview, setCommentReview] = useState<ReviewFeedback|null>(null);
  const [commentBusy,setCommentBusy]=useState(false);
  const [commentTurnstileToken,setCommentTurnstileToken]=useState("");
  const [commentTurnstileRequired,setCommentTurnstileRequired]=useState(false);
  const [commentTurnstileReset,setCommentTurnstileReset]=useState(0);
  const [commentDraftReady,setCommentDraftReady]=useState(false);
  const [deleteBusy,setDeleteBusy]=useState<string|null>(null);
  const [detailComments, setDetailComments] = useState<Comment[]>(post.comments.filter((item) => item.body));
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsLoadError, setCommentsLoadError] = useState("");
  const commentVoiceBusy=commentVoiceActive&&(commentVoicePending||commentVoiceState!=="idle");
  const displayedCommentCount=commentsLoading||commentsLoadError ? "…" : detailComments.length;

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsLoadError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`, { cache: "no-store" });
      const data = await response.json() as { comments?: Comment[]; error?: string };
      if (!response.ok) throw new Error(data.error || "댓글을 불러오지 못했습니다.");
      const loadedComments=(data.comments ?? []).filter((item) => item.body);
      setDetailComments(loadedComments);
      onCommentsLoaded(post.id,loadedComments);
    } catch (error) {
      setCommentsLoadError(error instanceof Error ? error.message : "댓글을 불러오지 못했습니다.");
    } finally {
      setCommentsLoading(false);
    }
  }, [onCommentsLoaded, post.id]);

  useEffect(() => {
    try{setComment(sessionStorage.getItem(`jinju-comment-draft:${post.id}`)||"")}catch{/* Best effort draft restore. */}
    setCommentDraftReady(true);
    void loadComments();
  }, [loadComments, post.id]);

  useEffect(()=>{if(!commentDraftReady)return;try{if(comment)sessionStorage.setItem(`jinju-comment-draft:${post.id}`,comment);else sessionStorage.removeItem(`jinju-comment-draft:${post.id}`)}catch{/* Best effort draft save. */}},[comment,commentDraftReady,post.id]);

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()||commentBusy||commentVoiceBusy) return;
    if(commentTurnstileRequired&&!commentTurnstileToken){setCommentError("보안 확인이 끝난 뒤 다시 눌러주세요.");return}
    setCommentError("");
    setCommentReview(null);
    setCommentStatus("게시 전 우리를 지키는 표현을 확인하고 있어요.");
    setCommentBusy(true);
    try {
      const created=await onComment(comment,commentTurnstileToken);
      setDetailComments((current) => [...current, created]);
      onCommentVoiceSubmitted();
      setComment("");
    } catch (error) {
      if (error instanceof CommentReviewError) setCommentReview(error.review);
      else setCommentError(error instanceof Error ? error.message : "댓글을 등록할 수 없습니다.");
    } finally {
      setCommentStatus("");
      setCommentBusy(false);
      setCommentTurnstileToken("");
      setCommentTurnstileReset((value)=>value+1);
    }
  }

  async function removeComment(commentId:string|number){if(!window.confirm("이 댓글을 삭제할까요?"))return;const key=String(commentId);setDeleteBusy(key);setCommentError("");try{await onDeleteComment(commentId);setDetailComments(current=>current.filter(item=>String(item.id)!==key))}catch(error){setCommentError(error instanceof Error?error.message:"댓글을 삭제하지 못했습니다.")}finally{setDeleteBusy(null)}}

  return (
    <main className="detail-page">
      <header className="detail-header"><a className="detail-home" href="/" onClick={(event) => { event.preventDefault(); onBack(); }}>← 진주.kr</a><a href="#comment">댓글 쓰기</a></header>
      <div className="detail-shell">
        <article className="detail-post">
          <div className="post-meta"><span>{post.category}{post.displayName ? ` · ${post.displayName}` : ""}</span><time>{post.date}</time></div>
          <h1>{post.title}</h1><p>{post.content}</p>
          <PostTemperature likes={post.heard} dislikes={post.same} interactive />
          <div className="detail-stats"><button className="pearl-reaction" onClick={() => onReact("heard")} type="button" disabled={reactedKind==="heard"||Boolean(reactingKind)} aria-pressed={reactedKind==="heard"} aria-busy={reactingKind==="heard"}><Pearl size={16} /><span>{reactingKind==="heard"?"확인 중…":"좋아요"}</span><strong>{post.heard}</strong></button><button onClick={() => onReact("same")} type="button" disabled={reactedKind==="same"||Boolean(reactingKind)} aria-pressed={reactedKind==="same"} aria-busy={reactingKind==="same"}>{reactingKind==="same"?"확인 중…":"싫어요"}</button><a href="#comment-list">댓글 <span>{displayedCommentCount}</span></a><button onClick={onShare} type="button"><span className="share-label-motion">공유하기</span></button><button type="button" onClick={onFeedback}>의견 보내기</button></div>
        </article>
        <section className="comment-list" id="comment-list" aria-label="댓글 목록">
          <h2>댓글 {displayedCommentCount}</h2>
          {commentsLoading
            ? <p className="comments-loading" aria-live="polite">댓글을 불러오는 중입니다.</p>
            : commentsLoadError
              ? <div className="comments-load-error" role="alert"><p>{commentsLoadError}</p><button type="button" onClick={()=>void loadComments()}>다시 시도</button></div>
              : detailComments.length
                ? detailComments.map((item) => <article key={item.id}><div><span>{item.displayName || "익명"}</span><span><time dateTime={item.createdAt}>{formatCommentTime(item.createdAt)}</time>{canDeleteComment(item.id)&&<button className="comment-delete-button" onClick={()=>removeComment(item.id)} disabled={deleteBusy===String(item.id)} type="button">{deleteBusy===String(item.id)?"삭제 중":"삭제"}</button>}</span></div><p>{item.body}</p></article>)
                : <p className="no-comments">첫 댓글을 남겨주세요.</p>}
        </section>
        <form className="comment-composer" id="comment" onSubmit={submitComment}>
          <textarea value={comment} onChange={(event) => {onCommentVoiceEdit();setCommentReview(null);setCommentStatus("");setComment(event.target.value.slice(0, 2000))}} maxLength={2000} rows={5} placeholder="내가 겪은 상황과 느낀 점을 적어주세요." aria-label="댓글 내용" aria-describedby="comment-voice-status comment-safety-status" />
          <span className="search-voice-status" id="comment-voice-status" role="status" aria-live="polite">{commentVoiceMessage}</span>
          {commentVoiceActive&&commentVoiceMessage&&<p className="voice-message">{commentVoiceMessage}</p>}
          <TurnstileChallenge action="comment" resetSignal={commentTurnstileReset} onToken={setCommentTurnstileToken} onRequiredChange={setCommentTurnstileRequired} />
          {commentStatus && <p className="comment-status" id="comment-safety-status" role="status">{commentStatus}</p>}
          {commentReview && <p className="comment-review" id="comment-safety-status" role="alert"><strong>이 문장만 조금 바꾸면 올릴 수 있어요.</strong>{(commentReview.suggestion||commentReview.explanation)&&<span>{commentReview.suggestion||commentReview.explanation}</span>}</p>}
          {commentError && <p className="comment-error" role="alert">{commentError}</p>}
          <div className="comment-footer"><span>{comment.length}/2,000 · 입력 내용은 등록 전까지 이 기기에 보관됩니다</span><div className="comment-actions"><button className={`comment-voice-button${commentVoiceBusy?" listening":""}`} onClick={()=>void onToggleCommentVoice(comment,(value)=>{setCommentReview(null);setCommentStatus("");setComment(value.slice(0,2000))})} type="button" disabled={commentBusy||commentVoicePending} aria-pressed={commentVoiceActive&&commentVoiceState==="recording"} aria-label={commentVoicePending?"댓글 음성 연결 중":commentVoiceActive&&commentVoiceState==="recording"?"댓글 음성 입력 중지":commentVoiceActive&&commentVoiceState==="transcribing"?"댓글 음성 입력 다시 시작":"댓글 음성 입력"}><span className="mic-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z"/><path d="M5 10.5a7 7 0 0 0 14 0"/><path d="M12 17.5V21"/><path d="M9 21h6"/></svg></span></button><button type="submit" disabled={commentBusy||commentVoiceBusy||(commentTurnstileRequired&&!commentTurnstileToken)}>{commentBusy?"확인 중…":"댓글 남기기"}</button></div></div>
        </form>
      </div>
    </main>
  );
}
