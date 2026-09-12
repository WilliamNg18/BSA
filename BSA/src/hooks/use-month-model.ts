import { useMemo } from "react";
import { selectMonthScenario } from "@/lib/domain/baseline";
import { useAppStore } from "@/lib/store";

export function useMonthModel() {
  const draft = useAppStore((s) => s.baselineInputs);
  const todayMinutes = useAppStore((s) => s.todayMinutes);
  return useMemo(() => selectMonthScenario(draft, todayMinutes), [draft, todayMinutes]);
}
