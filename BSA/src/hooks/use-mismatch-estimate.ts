import { useMemo } from "react";
import { useManualLoopMonth } from "./use-manual-loop-month";
import { selectMismatchEstimate } from "@/lib/domain/mismatch-estimate";
import { useAppStore } from "@/lib/store";

export function useMismatchEstimate() {
  const sharePercent = useAppStore((state) => state.mismatchSharePercent);
  const month = useManualLoopMonth();
  const submittedClaimVolume = month.result?.counts.monthlyItems ?? null;
  return useMemo(() => selectMismatchEstimate(sharePercent, submittedClaimVolume), [sharePercent, submittedClaimVolume]);
}
