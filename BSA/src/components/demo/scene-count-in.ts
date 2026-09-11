import { ASSISTANCE_DURATION_MS } from "@/hooks/use-assistance-presentation";

/** Presentation only; the supplied estimate is already calculated and validated. */
export function startSceneCountIn(value: number, display: (value: number) => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (media.matches || value === 0) {
    display(value);
    return () => {};
  }

  const started = performance.now();
  let frame = 0;
  let active = true;
  const cancel = () => {
    active = false;
    window.cancelAnimationFrame(frame);
    media.removeEventListener("change", onMotionChange);
  };
  const finish = () => {
    if (!active) return;
    cancel();
    display(value);
  };
  function onMotionChange() {
    if (media.matches) finish();
  }
  const tick = (now: number) => {
    if (!active) return;
    if (media.matches || now - started >= ASSISTANCE_DURATION_MS) {
      finish();
      return;
    }
    display(value * Math.max(0, (now - started) / ASSISTANCE_DURATION_MS));
    frame = window.requestAnimationFrame(tick);
  };

  display(0);
  media.addEventListener("change", onMotionChange);
  frame = window.requestAnimationFrame(tick);
  return cancel;
}
