import { useMemo } from "react";
import { selectBaselineScenario } from "@/lib/domain/baseline";
import { useAppStore } from "@/lib/store";

export function useBaselineScenario() {
  const draft = useAppStore((s) => s.baselineInputs);
  return useMemo(() => selectBaselineScenario(draft), [draft]);
}