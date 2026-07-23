"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko-KR">
      <body
        style={{
          minHeight: "100dvh",
          margin: 0,
          display: "grid",
          placeItems: "center",
          background: "#0b0b0c",
          color: "#f7f7f7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 480, padding: 28, textAlign: "center" }}>
          <img src="/jinju-pearl-cutout.png" alt="" aria-hidden="true" width="76" height="76" />
          <h1 style={{ margin: "20px 0 10px", fontSize: 24 }}>잠시 문제가 생겼어요</h1>
          <p style={{ margin: "0 0 24px", color: "#bdbdc3", lineHeight: 1.6 }}>
            잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 48,
              padding: "0 24px",
              border: 0,
              borderRadius: 999,
              background: "#f7f7f7",
              color: "#111",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
