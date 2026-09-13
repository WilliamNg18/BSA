import { useMemo } from "react";
import type { ProcessMonthSelection } from "@/lib/domain/baseline";
import { selectProcessMonth } from "@/lib/domain/process-month-model";
import { useAppStore } from "@/lib/store";

export function useProcessMonth(): ProcessMonthSelection {
  const draft = useAppStore((state) => state.processInputs);
  return useMemo(() => selectProcessMonth(draft), [draft]);
}
