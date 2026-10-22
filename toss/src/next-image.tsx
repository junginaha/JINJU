import type { ImgHTMLAttributes } from "react";

// Minimal stand-in for next/image in the static Toss bundle.
type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string | { src: string }; priority?: boolean; fill?: boolean; quality?: number; unoptimized?: boolean; placeholder?: string; blurDataURL?: string };
export default function Image({ src, priority, fill, quality, unoptimized, placeholder, blurDataURL, style, ...rest }: Props) {
  const url = typeof src === "string" ? src : src.src;
  const fillStyle = fill ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%" } : undefined;
  return <img src={url} loading={priority ? "eager" : "lazy"} decoding="async" style={{ ...fillStyle, ...style }} {...rest} />;
}
