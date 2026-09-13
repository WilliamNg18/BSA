import { useLayoutEffect, useRef } from "react";
import { formatBaselineNumber, type BaselineResult, type ProcessMonthResult, type ManualLoopMonthResult } from "@/lib/domain/baseline";
import { startSceneCountIn } from "./scene-count-in";

export function SceneEstimateNumber({ value, digits = 1, enabled, scenario, format }: {
  value: number;
  digits?: number;
  enabled: boolean;
  scenario: BaselineResult | ProcessMonthResult | ManualLoopMonthResult;
  format?: (value: number) => string;
}) {
  const visual = useRef<HTMLSpanElement>(null);
  const text = format ? format(value) : formatBaselineNumber(value, digits);

  useLayoutEffect(() => {
    const element = visual.current;
    if (!element) return;
    element.textContent = text;
    if (!enabled) return;
    return startSceneCountIn(value, (current) => {
      element.textContent = format ? format(current) : formatBaselineNumber(current, digits);
    });
  }, [value, digits, text, enabled, scenario, format]);

  // Expose one stable final value, not the visual animation's intermediate text.
  return <span className="tabular-nums" role={enabled ? "img" : undefined} aria-label={enabled ? text : undefined}>
    <span ref={visual} aria-hidden={enabled || undefined}>{text}</span>
  </span>;
}
