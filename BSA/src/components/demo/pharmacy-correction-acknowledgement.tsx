import type { PharmacyCorrectionDraft } from "@/lib/domain/lifecycle";
import { CORRECTION_ACKNOWLEDGEMENT_LABEL } from "@/lib/domain/correction-acknowledgement";
import { getCorrectionAcknowledgementValid, useAppStore } from "@/lib/store";

export function PharmacyCorrectionAcknowledgement({ caseId, draft, act }: {
  caseId: string; draft: PharmacyCorrectionDraft; act: (action: () => void) => void;
}) {
  const checked = getCorrectionAcknowledgementValid(caseId);
  return <label className="flex items-start gap-2">
    <input type="checkbox" required data-pharmacy-action="acknowledge-correction" checked={checked}
      onChange={(event) => act(() => {
        const store = useAppStore.getState();
        if (!store.pharmacyDrafts[caseId] || store.pharmacyDrafts[caseId].purpose === "new_submission") {
          store.setPharmacyDraft(caseId, { ...draft, purpose: "correction" });
        }
        store.setCorrectionAcknowledgement(caseId, draft.revision, event.target.checked);
      })} />
    {CORRECTION_ACKNOWLEDGEMENT_LABEL}
  </label>;
}
