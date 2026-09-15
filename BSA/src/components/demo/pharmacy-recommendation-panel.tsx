import { useMemo } from "react";
import { RecommendationCard } from "./recommendation-card";
import { deriveRecommendation, type ConcreteSuggestion } from "@/lib/domain/recommendations";
import type { PharmacyCorrectionDraft } from "@/lib/domain/lifecycle";
import { useAppStore } from "@/lib/store";

export function PharmacyRecommendationPanel({ caseId, draft, compact = false, onApply, endorsementId = "endorsement" }: {
  caseId: string;
  draft?: PharmacyCorrectionDraft;
  compact?: boolean;
  onApply?: () => void;
  endorsementId?: string;
}) {
  const enabled = useAppStore((s) => s.agentEnabled);
  const lifecycles = useAppStore((s) => s.lifecycles);
  const caseRevisions = useAppStore((s) => s.caseRevisions);
  const pharmacyDrafts = useAppStore((s) => s.pharmacyDrafts);
  const records = useAppStore((s) => s.records);
  const result = useMemo(() => {
    if (!enabled) return null;
    try {
      return { recommendation: deriveRecommendation({
        lifecycles, caseRevisions, records,
        pharmacyDrafts: draft ? { ...pharmacyDrafts, [caseId]: draft } : pharmacyDrafts,
      }, caseId, { kind: draft ? "draft" : "current" }), error: null };
    } catch (cause) {
      return { recommendation: null, error: cause instanceof Error ? cause.message : "Recommendation unavailable for this evidence." };
    }
  }, [enabled, lifecycles, caseRevisions, pharmacyDrafts, records, caseId, draft]);
  if (!result) return null;
  if (!result.recommendation) return <section aria-label="Recommendation" className="rounded-lg border p-3">
    <h3 className="font-semibold">Recommendation</h3><p role="alert">{result.error}</p>
  </section>;
  function focus(target: ConcreteSuggestion["focusTarget"]) {
    const field = draft?.paperDeclaration && ["brandManufacturer", "packSize", "form"].includes(target) ? `paper-${target}`
      : target === "brandManufacturer" ? "eps-manufacturer"
        : target === "packSize" ? "eps-pack" : target === "form" ? "eps-form" : endorsementId;
    document.getElementById(field)?.focus();
  }
  return <RecommendationCard recommendation={result.recommendation} audience="pharmacy" compact={compact}
    pharmacyAction="apply-correction" onApply={result.recommendation.preview ? onApply : undefined} onFocusField={draft ? focus : undefined} />;
}
