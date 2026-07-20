"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const INTRO_STORAGE_KEY = "jinju-intro-seen-v1";
const INTRO_DURATION = 9000;
const INTRO_FADE_DURATION = 560;

export default function Intro({ onComplete }: { onComplete: () => void }) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    closeTimerRef.current = null;
    finishTimerRef.current = null;
    autoTimerRef.current = null;
  }, []);

  const finish = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    clearTimers();
    setClosing(true);
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "seen");
    } catch {
      // The intro still works when storage is unavailable.
    }
    finishTimerRef.current = setTimeout(onComplete, INTRO_FADE_DURATION);
  }, [clearTimers, onComplete]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeTimerRef.current = setTimeout(() => {
      if (!closingRef.current) setClosing(true);
    }, INTRO_DURATION - 600);
    autoTimerRef.current = setTimeout(() => {
      if (closingRef.current) return;
      closingRef.current = true;
      try {
        sessionStorage.setItem(INTRO_STORAGE_KEY, "seen");
      } catch {
        // Continue without session persistence.
      }
      onComplete();
    }, INTRO_DURATION);

    return () => {
      clearTimers();
      document.body.style.overflow = previousOverflow;
    };
  }, [clearTimers, onComplete]);

  return (
    <section
      className={`jinju-intro${closing ? " is-closing" : ""}`}
      style={{ "--intro-duration": `${INTRO_DURATION}ms` } as React.CSSProperties}
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
            <button className="intro-skip-button" onClick={finish} type="button">
              <span className="intro-skip-arrow" aria-hidden="true">↗</span>
              바로 들어가기
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

        <p className="intro-signature">JINJU IS AN ANONYMOUS COMMUNITY WITH ZERO PERSONAL DATA</p>
      </div>

      <div className="intro-entry" aria-hidden="true">
        <div className="intro-temperature-loader">
          <div className="intro-temperature-track">
            <span className="intro-temperature-fill" />
            <span className="intro-temperature-rail">
              <span className="intro-temperature-group">
                <Image className="intro-temperature-pearl" src="/jinju-pearl-cutout.png" alt="" width={18} height={18} />
                <span className="intro-temperature-label">개운하게~</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
