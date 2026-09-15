import { useMemo } from "react";
import { getAsSubmitted, getPaperReconciliation } from "@/lib/domain/submission-views";
import { useAppStore } from "@/lib/store";

export function useSubmittedCase(caseId: string) {
  const lifecycle = useAppStore((state) => state.lifecycles[caseId]);
  const revisions = useAppStore((state) => state.caseRevisions[caseId]);
  return useMemo(() => {
    try {
      const state = { lifecycles: { [caseId]: lifecycle }, caseRevisions: { [caseId]: revisions } };
      return { submission: getAsSubmitted(state, caseId), reconciliation: getPaperReconciliation(state, caseId), error: null };
    } catch (error) {
      return { submission: null, reconciliation: null,
        error: error instanceof Error ? error.message : "Submitted evidence is unavailable." };
    }
  }, [caseId, lifecycle, revisions]);
}
