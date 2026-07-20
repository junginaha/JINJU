"use client";
import Image from "next/image";
import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
const STIFFNESS=210,DAMPING=11;
const resist=(v:number)=>v<0?-Math.min(.1,Math.abs(v)/(1+Math.abs(v)*8)):v>1?1+Math.min(.1,(v-1)/(1+(v-1)*8)):v;
export default function PostTemperature({likes,dislikes,interactive=false}:{likes:number;dislikes:number;interactive?:boolean}){
 const total=likes+dislikes,home=total?dislikes/total:.5; const [position,setPosition]=useState(home); const trackRef=useRef<HTMLDivElement>(null),frameRef=useRef<number|null>(null),positionRef=useRef(home),velocityRef=useRef(0),dragRef=useRef({active:false,lastX:home,lastTime:0});
 const style={"--temperature-position":`${Math.max(-.1,Math.min(1.1,position))*100}%`,"--temperature-home":`${home*100}%`} as CSSProperties;
 useEffect(()=>()=>{if(frameRef.current)cancelAnimationFrame(frameRef.current)},[]);
 useEffect(()=>{if(!dragRef.current.active){velocityRef.current=0;positionRef.current=home;setPosition(home)}},[home]);
 function update(e:PointerEvent<HTMLDivElement>){const r=trackRef.current?.getBoundingClientRect();if(!r?.width)return;const now=performance.now(),next=resist((e.clientX-r.left)/r.width),dt=Math.max(16,now-dragRef.current.lastTime)/1000;velocityRef.current=(next-dragRef.current.lastX)/dt;dragRef.current={active:true,lastX:next,lastTime:now};positionRef.current=next;setPosition(next)}
 function settle(){let last=performance.now();const tick=(now:number)=>{const dt=Math.min(.032,(now-last)/1000);last=now;velocityRef.current+=(-STIFFNESS*(positionRef.current-home)-DAMPING*velocityRef.current)*dt;const next=positionRef.current+velocityRef.current*dt;positionRef.current=next;setPosition(next);if(Math.abs(velocityRef.current)<.003&&Math.abs(next-home)<.0015){velocityRef.current=0;positionRef.current=home;setPosition(home);frameRef.current=null}else frameRef.current=requestAnimationFrame(tick)};frameRef.current=requestAnimationFrame(tick)}
 function start(e:PointerEvent<HTMLDivElement>){if(!interactive)return;e.preventDefault();if(frameRef.current)cancelAnimationFrame(frameRef.current);dragRef.current={active:true,lastX:positionRef.current,lastTime:performance.now()};e.currentTarget.setPointerCapture(e.pointerId);update(e)}
 function end(e:PointerEvent<HTMLDivElement>){if(!interactive||!dragRef.current.active)return;dragRef.current.active=false;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);settle()}
 return <div className={`post-temperature${interactive?" interactive":""}`} style={style} aria-label="게시글 반응 온도"><div className="temperature-copy"><span>OK</span><span>Not OK</span></div><div ref={trackRef} className="temperature-track" role="img" aria-label={`Not OK 방향 ${Math.round(home*100)}%`} onPointerDown={start} onPointerMove={e=>interactive&&dragRef.current.active&&update(e)} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}><span className="temperature-fill"/><span className="temperature-home"/><span className="temperature-marker"><Image src="/jinju-pearl-cutout.png" alt="" width={28} height={28} draggable={false}/></span></div></div>
}
