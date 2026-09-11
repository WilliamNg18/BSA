import { useEffect, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

/** Local clock only. Identity and live preference changes cancel pending timers. */
export function useCasePresentation(total: number, auto = false, identity: unknown = null) {
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(auto && !reduced ? 0 : total);
  const [run, setRun] = useState<{ from: number } | null>(auto && !reduced ? { from: 0 } : null);
  const [previous, setPrevious] = useState(identity);
  if (previous !== identity) {
    setPrevious(identity);
    setRevealed(auto && !reduced ? 0 : total);
    setRun(auto && !reduced ? { from: 0 } : null);
  }
  useEffect(() => {
    if (reduced) setRun(null);
  }, [reduced]);
  useEffect(() => {
    if (!run || reduced || run.from >= total) return;
    // Schedule against one origin, not the completion of React's previous render.
    // Cleanup cancels every remaining milestone on pause, identity or motion change.
    const timers = Array.from({ length: total - run.from }, (_, index) => {
      const step = run.from + index + 1;
      const delay = Math.round(step * 2000 / total) - Math.round(run.from * 2000 / total);
      return window.setTimeout(() => {
        // A media change can precede React's subscription notification.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        setRevealed(step);
      }, delay);
    });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [run, reduced, total, identity]);
  return {
    revealed, playing: run !== null && revealed < total && !reduced, reduced,
    replay: () => { setRevealed(reduced ? 1 : 0); setRun(reduced ? null : { from: 0 }); },
    step: () => { setRun(null); setRevealed((n) => Math.min(n + 1, total)); },
    toggle: () => setRun((value) => value ? null : { from: revealed }),
    all: () => { setRun(null); setRevealed(total); },
    clear: () => { setRun(null); setRevealed(0); },
  };
}