// Usage events for the Toss mini app (key metrics, review timing).
// On 진주.kr nothing is installed on window, so these calls do nothing.
export type TrackEvent =
  | "post_open"
  | "post_publish"
  | "post_pending"
  | "comment_submit"
  | "reaction"
  | "share";

type Tracker = (name: TrackEvent, params?: Record<string, string | number | boolean | null | undefined>) => void;

export function track(name: TrackEvent, params?: Record<string, string | number | boolean | null | undefined>) {
  try {
    const fn = (window as unknown as { __jinjuTrack?: Tracker }).__jinjuTrack;
    if (fn) fn(name, params);
  } catch {
    // Usage events never block the app.
  }
}
