import { useMemo } from "react";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { useAppStore } from "@/lib/store";

/** Stable store slices, memoised immutable evidence for every case surface. */
export function useLifecycleCase(id: string | undefined, revision?: number) {
  const lifecycles = useAppStore((s) => s.lifecycles);
  const revisions = useAppStore((s) => s.caseRevisions);
  const processes = useAppStore((s) => s.itemProcesses);
  return useMemo(() => id ? caseForLifecycle(id, lifecycles, revision === undefined ? revisions : {
    [id]: revisions[id]?.filter((entry) => entry.number <= revision) ?? [],
  }, processes) : null, [id, lifecycles, revisions, revision, processes]);
}