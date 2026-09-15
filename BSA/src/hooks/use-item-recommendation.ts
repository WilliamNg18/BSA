import { useMemo } from "react";
import { deriveRecommendation, type RecommendationContext } from "@/lib/domain/recommendations";
import { useAppStore } from "@/lib/store";

export function useItemRecommendation(caseId: string | undefined, context: RecommendationContext = { kind: "current" }) {
  const enabled = useAppStore((state) => state.agentEnabled);
  const lifecycles = useAppStore((state) => state.lifecycles);
  const caseRevisions = useAppStore((state) => state.caseRevisions);
  const pharmacyDrafts = useAppStore((state) => state.pharmacyDrafts);
  const records = useAppStore((state) => state.records);
  const kind = context.kind;
  const revision = context.kind === "recorded" ? context.revision : undefined;
  const recordId = context.kind === "recorded" ? context.recordId : undefined;
  return useMemo(() => {
    if (!enabled || !caseId) return { recommendation: null, error: null };
    try {
      let selectedContext: RecommendationContext;
      if (kind === "recorded") {
        if (revision === undefined) throw new Error("Recorded recommendation revision is unavailable.");
        selectedContext = { kind, revision, recordId };
      } else selectedContext = { kind };
      return {
        recommendation: deriveRecommendation({ lifecycles, caseRevisions, pharmacyDrafts, records }, caseId, selectedContext),
        error: null,
      };
    } catch (cause) {
      return { recommendation: null, error: cause instanceof Error ? cause.message : "Recommendation unavailable. Reopen the current item." };
    }
  }, [enabled, caseId, lifecycles, caseRevisions, pharmacyDrafts, records, kind, revision, recordId]);
}
