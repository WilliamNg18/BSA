import { useMemo } from "react";
import { selectManualLoopMonth } from "@/lib/domain/manual-loop-month-model";
import { useAppStore } from "@/lib/store";

export function useManualLoopMonth() {
  const draft = useAppStore((state) => state.manualLoopInputs);
  return useMemo(() => selectManualLoopMonth(draft), [draft]);
}
