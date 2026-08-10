import { permanentRedirect } from "next/navigation";

export default function LegacyBetaPage() {
  permanentRedirect("/operation");
}
