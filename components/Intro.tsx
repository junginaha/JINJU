"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const INTRO_STORAGE_KEY = "jinju-intro-seen-v1";
const INTRO_DURATION = 2200;
const INTRO_FADE_DURATION = 260;

export default function Intro({ onComplete }: { onComplete: () => void }) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    finishTimerRef.current = null;
    autoTimerRef.current = null;
  }, []);

  const rememberSeen = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "seen");
    } catch {
      // The intro still works when storage is unavailable.
    }
  }, []);

  const finish = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    clearTimers();
    rememberSeen();
    setClosing(true);
    finishTimerRef.current = setTimeout(onComplete, INTRO_FADE_DURATION);
  }, [clearTimers, onComplete, rememberSeen]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    autoTimerRef.current = setTimeout(finish, INTRO_DURATION - INTRO_FADE_DURATION);

    return () => {
      clearTimers();
      document.body.style.overflow = previousOverflow;
    };
  }, [clearTimers, finish]);

  const visible = { opacity: 1, transform: "none", animation: "none" } as const;

  return (
    <section
      className={`jinju-intro${closing ? " is-closing" : ""}`}
      style={{ transition: `opacity ${INTRO_FADE_DURATION}ms cubic-bezier(.4,0,.2,1), visibility ${INTRO_FADE_DURATION}ms` }}
      aria-label="진주 서비스 인트로"
      aria-live="polite"
    >
      <div className="intro-ambient intro-ambient-one" aria-hidden="true" />
      <div className="intro-ambient intro-ambient-two" aria-hidden="true" />

      <div className="intro-stage">
        <div className="intro-logo-cluster">
          <button className="intro-pearl-wrap" style={visible} onClick={finish} type="button" aria-label="진주 로고를 눌러 바로 들어가기">
            <span className="intro-pearl-halo" aria-hidden="true" />
            <Image src="/jinju-pearl-cutout.png" alt="" width={156} height={156} priority />
          </button>
          <div className="intro-skip-stack" style={visible}>
            <button className="intro-skip-button" style={{ animation: "none" }} onClick={finish} type="button">
              <span className="intro-skip-arrow" aria-hidden="true">↗</span>
              바로 들어가기
            </button>
          </div>
        </div>

        <div className="intro-message" style={{ ...visible, minHeight: 0 }}>
          <span>인간적으로,</span>
          <strong>할 말은 하세요!</strong>
          <p style={{ margin: "11px 0 0", color: "#c9c5bd", fontSize: "clamp(13px, 1.8vw, 17px)", lineHeight: 1.55, letterSpacing: "-0.025em" }}>
            안전하고 개운하게 속마음을 털어놓으세요
          </p>
        </div>

        <h1 className="intro-wordmark" style={{ ...visible, marginTop: 24 }} aria-label="진실의 주둥이">
          <span className="intro-key intro-key-truth" style={{ animation: "none" }}>진</span>
          <span>실의&nbsp;</span>
          <span className="intro-key intro-key-mouth" style={{ animation: "none" }}>주</span>
          <span>둥이</span>
        </h1>

        <p className="intro-signature" style={{ ...visible, marginTop: 18 }}>JINJU · ANONYMOUS COMMUNITY</p>
      </div>
    </section>
  );
}
