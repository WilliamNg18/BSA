import { useLayoutEffect, useRef } from "react";
import { formatBaselineNumber } from "@/lib/domain/baseline";
import { startSceneCountIn } from "./scene-count-in";

/** Count between estimates without announcing intermediate values. */
export function MonthlyNumber({ value, replayKey, format }: { value: number; replayKey?: string; format?: (value: number) => string }) {
  const visual = useRef<HTMLSpanElement>(null);
  const current = useRef(value);
  const previousReplayKey = useRef(replayKey);
  const text = format ? format(value) : formatBaselineNumber(value, 1);
  useLayoutEffect(() => {
    const element = visual.current;
    if (!element) return;
    const from = previousReplayKey.current === replayKey ? current.current : 0;
    previousReplayKey.current = replayKey;
    const difference = value - from;
    return startSceneCountIn(difference, (delta) => {
      // Subtracting a very large prior estimate can lose the target's low bits.
      current.current = delta === difference ? value : from + delta;
      element.textContent = format ? format(current.current) : formatBaselineNumber(current.current, 1);
    });
  }, [value, replayKey, format]);
  return <span role="img" aria-label={text} className="tabular-nums"><span ref={visual} aria-hidden="true">{text}</span></span>;
}
