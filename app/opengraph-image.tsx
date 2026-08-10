import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "진주.kr — 인간적으로, 할 말은 하세요";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const pearl = await readFile(join(process.cwd(), "public", "jinju-pearl-cutout.png"), "base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          overflow: "hidden",
          position: "relative",
          padding: "72px 82px",
          background: "#0b0b0c",
          color: "#f8f8f8",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 82% 50%, rgba(255, 175, 186, 0.20), transparent 31%), radial-gradient(circle at 68% 74%, rgba(116, 223, 231, 0.14), transparent 33%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 730,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 50,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#a8edf1",
            }}
          >
            진주.kr · 익명 의견 커뮤니티
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: "-0.055em",
            }}
          >
            <span>인간적으로,</span>
            <span>할 말은 하세요.</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontSize: 25,
              lineHeight: 1.45,
              color: "#bdbdc3",
              letterSpacing: "-0.025em",
            }}
          >
            안전하고 개운하게 속마음을 털어놓는 공간
          </div>
        </div>
        <img
          alt=""
          src={`data:image/png;base64,${pearl}`}
          width={360}
          height={360}
          style={{
            objectFit: "contain",
            filter: "drop-shadow(0 24px 44px rgba(255, 220, 225, 0.22))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 82,
            right: 82,
            bottom: 42,
            height: 4,
            display: "flex",
            borderRadius: 999,
            background: "linear-gradient(90deg, #78dfe5 0%, #e7e1f7 50%, #ff7e87 100%)",
          }}
        />
      </div>
    ),
    size,
  );
}
