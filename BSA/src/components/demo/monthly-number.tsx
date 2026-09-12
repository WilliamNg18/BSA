import { useLayoutEffect, useRef } from "react";
import { formatBaselineNumber } from "@/lib/domain/baseline";
import { startSceneCountIn } from "./scene-count-in";

/** Count between estimates without announcing intermediate values. */
export function MonthlyNumber({ value }: { value: number }) {
  const visual = useRef<HTMLSpanElement>(null);
  const current = useRef(value);
  const text = formatBaselineNumber(value, 1);
  useLayoutEffect(() => {
    const element = visual.current;
    if (!element) return;
    const from = current.current;
    return startSceneCountIn(value - from, (delta) => {
      current.current = from + delta;
      element.textContent = formatBaselineNumber(current.current, 1);
    });
  }, [value]);
  return <span role="img" aria-label={text} className="tabular-nums"><span ref={visual} aria-hidden="true">{text}</span></span>;
}
