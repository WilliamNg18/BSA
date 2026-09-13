import { formatBaselineNumber, formatProcessHours, formatProcessItems } from "./baseline";
import type { ManualLoopMonthColumn, ManualLoopMonthResult } from "./baseline";

export const MANUAL_LOOP_ASSUMPTIONS_LINE = "Estimates from labelled assumptions; type NHSBSA's figures above.";
export const MANUAL_LOOP_METRICS = [
  { key: "referredBackItems", label: "Items referred back a month", format: formatProcessItems },
  { key: "operatorHours", label: "Operator hours a month", format: formatProcessHours },
  { key: "gatheringHours", label: "Gathering hours", format: formatProcessHours },
  { key: "judgingHours", label: "First judging hours", format: formatProcessHours },
  { key: "doubleCheckHours", label: "Double-check hours", format: formatProcessHours },
  { key: "itemsGathered", label: "Items a person gathers for", format: formatProcessItems },
  { key: "itemsJudged", label: "Human judgements, including double-checks", format: formatProcessItems },
  { key: "doubleChecks", label: "Second judgements", format: formatProcessItems },
  { key: "pharmacyCompletionHours", label: "Pharmacy completion hours", format: formatProcessHours },
  { key: "decisionsWithRuleAndReason", label: "Decisions with rule and reason recorded", format: formatProcessItems },
] as const satisfies readonly { key: keyof ManualLoopMonthColumn; label: string; format: (value: number) => string }[];

export function manualLoopSummary(result: ManualLoopMonthResult): string {
  return `Estimate: ${formatProcessItems(result.withAgent.referredBackItems)} referrals instead of ${formatProcessItems(result.today.referredBackItems)}; ${formatProcessHours(result.withAgent.operatorHours)} operator hours gathering and judging instead of ${formatProcessHours(result.today.operatorHours)}, including double-checks.`;
}

export function manualLoopRatio(result: ManualLoopMonthResult): string {
  return result.operatorHoursRatio === null
    ? "Ratio unavailable: zero or unrepresentably small With hours."
    : `${formatBaselineNumber(result.operatorHoursRatio, 1)}:1 Today / With operator hours (estimate)`;
}
