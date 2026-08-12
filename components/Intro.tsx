"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const INTRO_STORAGE_KEY = "jinju-intro-seen-v1";
const INTRO_DURATION = 4000;
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
          <button className="intro-pearl-wrap" onClick={finish} type="button" aria-label="진주 로고를 눌러 바로 들어가기">
            <span className="intro-pearl-halo" aria-hidden="true" />
            <Image src="/jinju-pearl-cutout.png" alt="" width={156} height={156} priority />
          </button>
          <div className="intro-skip-stack">
            <button className="intro-skip-button" onClick={finish} type="button" aria-label="인트로를 건너뛰고 바로 들어가기">
              <svg className="intro-skip-arrow" viewBox="0 0 56 42" aria-hidden="true">
                <path d="M50 35C37 35 25 28 12 12" />
                <path d="M12 12L14 24M12 12L24 10" />
              </svg>
            </button>
          </div>
        </div>

        <div className="intro-message">
          <span>인간적으로,</span>
          <strong>할 말은 하세요!</strong>
        </div>

        <h1 className="intro-wordmark" aria-label="진실의 주둥이">
          <span className="intro-key intro-key-truth">진</span>
          <span>실의&nbsp;</span>
          <span className="intro-key intro-key-mouth">주</span>
          <span>둥이</span>
        </h1>
      </div>
    </section>
  );
}
