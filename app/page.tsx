import JinjuApp from "@/components/JinjuAppBridge";
import { getPublicPosts, toClientPost } from "@/lib/public-posts";

export const revalidate = 30;

const fastEntryCss = `
.intro-bootstrap::before {
  position: absolute;
  top: 42%;
  left: 50%;
  width: clamp(112px, 30vw, 156px);
  height: clamp(112px, 30vw, 156px);
  content: "";
  background: url('/jinju-pearl-cutout.png') center / contain no-repeat;
  filter: drop-shadow(0 18px 34px #0000007a);
  opacity: 0;
  transform: translate(-50%, -50%) scale(.94);
  animation: fast-bootstrap-pearl .42s cubic-bezier(.16,1,.3,1) .04s forwards;
}
.intro-bootstrap::after {
  position: absolute;
  top: calc(42% + 86px);
  left: 50%;
  width: min(86vw, 520px);
  content: "인간적으로,\\A 할 말은 하세요!\\A 안전하고 개운하게 속마음을 털어놓으세요";
  color: #c9c5bd;
  font-size: clamp(13px, 3.8vw, 17px);
  line-height: 1.62;
  text-align: center;
  white-space: pre-line;
  letter-spacing: -.025em;
  opacity: 0;
  transform: translate(-50%, 10px);
  animation: fast-bootstrap-copy .42s ease .18s forwards;
}
.jinju-intro .intro-pearl-wrap { animation-delay: .04s; animation-duration: .62s; }
.jinju-intro .intro-skip-stack { animation-delay: .28s; }
.jinju-intro .intro-message { animation: .52s cubic-bezier(.16,1,.3,1) .42s forwards intro-message-pop, .38s 2.15s forwards intro-message-out; }
.jinju-intro .intro-wordmark { animation: .58s cubic-bezier(.16,1,.3,1) .92s forwards intro-wordmark-in; }
.jinju-intro .intro-key-truth { animation-delay: 1.28s; }
.jinju-intro .intro-key-truth::after { animation-delay: 1.28s; }
.jinju-intro .intro-key-mouth { animation-delay: 1.5s; }
.jinju-intro .intro-key-mouth::after { animation-delay: 1.5s; }
.jinju-intro .intro-signature { animation-delay: 1.72s; }
@keyframes fast-bootstrap-pearl { to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
@keyframes fast-bootstrap-copy { to { opacity: 1; transform: translate(-50%, 0); } }
@media (prefers-reduced-motion: reduce) {
  .intro-bootstrap::before,
  .intro-bootstrap::after { animation: none; opacity: 1; }
}
`;

export default async function Home() {
  const publicPosts = await getPublicPosts();
  const initialPosts = publicPosts.slice(0, 100).map(toClientPost);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fastEntryCss }} />
      <JinjuApp initialPosts={initialPosts} initialTotal={publicPosts.length} />
    </>
  );
}
