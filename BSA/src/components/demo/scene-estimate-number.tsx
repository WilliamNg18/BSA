import { useLayoutEffect, useRef } from "react";
import { formatBaselineNumber, type BaselineResult } from "@/lib/domain/baseline";
import { startSceneCountIn } from "./scene-count-in";

export function SceneEstimateNumber({ value, digits = 1, enabled, scenario }: {
  value: number;
  digits?: number;
  enabled: boolean;
  scenario: BaselineResult;
}) {
  const visual = useRef<HTMLSpanElement>(null);
  const text = formatBaselineNumber(value, digits);

  useLayoutEffect(() => {
    const element = visual.current;
    if (!element) return;
    element.textContent = text;
    if (!enabled) return;
    return startSceneCountIn(value, (current) => {
      element.textContent = formatBaselineNumber(current, digits);
    });
  }, [value, digits, text, enabled, scenario]);

  // Expose one stable final value, not the visual animation's intermediate text.
  return <span className="tabular-nums" role={enabled ? "img" : undefined} aria-label={enabled ? text : undefined}>
    <span ref={visual} aria-hidden={enabled || undefined}>{text}</span>
  </span>;
}
