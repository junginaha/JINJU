"use client";

import Image from "next/image";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

const STIFFNESS = 210;
const DAMPING = 11;
const KEYBOARD_STEP = 0.05;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const resist = (value: number) => value < 0
  ? -Math.min(.1, Math.abs(value) / (1 + Math.abs(value) * 8))
  : value > 1
    ? 1 + Math.min(.1, (value - 1) / (1 + (value - 1) * 8))
    : value;

export default function PostTemperature({ likes, dislikes, interactive = false }: { likes: number; dislikes: number; interactive?: boolean }) {
  const total = likes + dislikes;
  const baseHome = total ? dislikes / total : .5;
  const [aggregateHome, setAggregateHome] = useState<number | null>(null);
  const home = aggregateHome ?? baseHome;
  const [position, setPosition] = useState(home);
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const positionRef = useRef(home);
  const velocityRef = useRef(0);
  const postIdRef = useRef<string | null>(null);
  const dragRef = useRef({ active: false, lastX: home, lastTime: 0, startX: home });
  const boundedPosition = clamp(position);
  const otherPercent = Math.round(boundedPosition * 100);
  const agreePercent = 100 - otherPercent;
  const style = {
    "--temperature-position": `${Math.max(-.1, Math.min(1.1, position)) * 100}%`,
    "--temperature-home": `${home * 100}%`,
  } as CSSProperties;

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    if (!dragRef.current.active) {
      velocityRef.current = 0;
      positionRef.current = home;
      setPosition(home);
    }
  }, [home]);

  useEffect(() => {
    if (!interactive) return;
    const match = window.location.pathname.match(/^\/post\/([^/]+)\/?$/);
    if (!match) return;
    const postId = decodeURIComponent(match[1]);
    postIdRef.current = postId;
    let active = true;
    void fetch(`/api/posts/${encodeURIComponent(postId)}/temperature`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data: { count?: number; average?: number } | null) => {
        if (!active || !data || !Number.isFinite(data.average) || !data.count) return;
        setAggregateHome(clamp(Number(data.average) / 100));
      })
      .catch(() => undefined);
    return () => {
      active = false;
      postIdRef.current = null;
    };
  }, [interactive]);

  function update(event: PointerEvent<HTMLDivElement>) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect?.width) return;
    const now = performance.now();
    const next = resist((event.clientX - rect.left) / rect.width);
    const elapsed = Math.max(16, now - dragRef.current.lastTime) / 1000;
    velocityRef.current = (next - dragRef.current.lastX) / elapsed;
    dragRef.current = { ...dragRef.current, active: true, lastX: next, lastTime: now };
    positionRef.current = next;
    setPosition(next);
  }

  function settle() {
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(.032, (now - last) / 1000);
      last = now;
      velocityRef.current += (-STIFFNESS * (positionRef.current - home) - DAMPING * velocityRef.current) * elapsed;
      const next = positionRef.current + velocityRef.current * elapsed;
      positionRef.current = next;
      setPosition(next);
      if (Math.abs(velocityRef.current) < .003 && Math.abs(next - home) < .0015) {
        velocityRef.current = 0;
        positionRef.current = home;
        setPosition(home);
        frameRef.current = null;
      } else {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  }

  async function record(value: number) {
    const postId = postIdRef.current;
    if (!postId) return;
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/temperature`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: Math.round(clamp(value) * 100) }),
      });
      if (!response.ok) return;
      const data = await response.json() as { count?: number; average?: number };
      if (data.count && Number.isFinite(data.average)) setAggregateHome(clamp(Number(data.average) / 100));
    } catch {
      // 반응 저장 실패가 슬라이더 조작을 막지 않습니다.
    }
  }

  function start(event: PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    event.preventDefault();
    event.currentTarget.focus();
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    dragRef.current = { active: true, lastX: positionRef.current, lastTime: performance.now(), startX: positionRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
    update(event);
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || !dragRef.current.active) return;
    const value = clamp(positionRef.current);
    const moved = Math.abs(value - dragRef.current.startX) >= .015;
    dragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (moved) void record(value);
    settle();
  }

  function moveWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return;
    let next: number | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = clamp(boundedPosition - KEYBOARD_STEP);
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = clamp(boundedPosition + KEYBOARD_STEP);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = 1;
    if (next === null) return;
    event.preventDefault();
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    dragRef.current.active = false;
    velocityRef.current = 0;
    positionRef.current = next;
    setPosition(next);
    void record(next);
  }

  return (
    <div className={`post-temperature${interactive ? " interactive" : ""}`} style={style} aria-label="게시글 반응 온도">
      <div className="temperature-copy"><span>공감돼요</span><span>다르게 생각해요</span></div>
      <div
        ref={trackRef}
        className="temperature-track"
        role={interactive ? "slider" : "img"}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? "게시글 반응 선택" : `공감 ${Math.round((1 - home) * 100)}%, 다른 생각 ${Math.round(home * 100)}%`}
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? 100 : undefined}
        aria-valuenow={interactive ? otherPercent : undefined}
        aria-valuetext={interactive ? `공감 ${agreePercent}%, 다른 생각 ${otherPercent}%` : undefined}
        aria-orientation={interactive ? "horizontal" : undefined}
        onKeyDown={moveWithKeyboard}
        onPointerDown={start}
        onPointerMove={(event) => interactive && dragRef.current.active && update(event)}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      >
        <span className="temperature-fill" />
        <span className="temperature-home" />
        <span className="temperature-marker"><Image src="/jinju-pearl-ui.webp" alt="" width={28} height={28} draggable={false} /></span>
      </div>
    </div>
  );
}
