import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeChoiceGroup, NativeChoiceItem } from "@/components/ui/native-radio-group";
import { BoundaryTag } from "./labels";
import { EpsPrescriptionMessage } from "./eps-prescription-message";
import { PainMarker } from "./pain-marker";
import { PharmacyTimeline } from "./pharmacy-timeline";
import { PharmacyDraftFields } from "./pharmacy-draft-fields";
import { PharmacyDraftCheck } from "./pharmacy-draft-check";
import { PharmacySubmissionReceipt } from "./pharmacy-submission-receipt";
import { usePharmacyDraft } from "@/hooks/use-pharmacy-draft";
import { pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import { useAppStore } from "@/lib/store";

const SCENARIOS = [
  { id: "EX-24107", label: "Complete endorsement" },
  { id: "EX-24112", label: "NCSO missing date" },
  { id: "SYN-FQ123-TYPE2", label: "Generic missing brand" },
  { id: "SYN-FQ123-MISMATCH", label: "Wrong pack size" },
] as const;

export function EpsPharmacyCapture({ caseId: fixedCaseId, compact = false, controls = "correct-and-submit" }: {
  caseId?: string; compact?: boolean; controls?: "submit" | "correct-and-submit";
}) {
  const [selected, select] = useState("EX-24112");
  const caseId = fixedCaseId ?? selected;
  return <div className="space-y-4">
    {!fixedCaseId && <NativeChoiceGroup value={caseId} onValueChange={select} aria-label="Choose an EPS scenario" className="justify-start">
      {SCENARIOS.map((scenario) => <NativeChoiceItem key={scenario.id} value={scenario.id}>{scenario.label}</NativeChoiceItem>)}
    </NativeChoiceGroup>}
    <EpsClaimEditor key={caseId} caseId={caseId} compact={compact} controls={controls} />
  </div>;
}

function EpsClaimEditor({ caseId, compact, controls }: { caseId: string; compact: boolean; controls: "submit" | "correct-and-submit" }) {
  const { c, revision, draft, original, enabled, result, validationError, error, act, update } = usePharmacyDraft(caseId, "eps");
  if (!c || !revision || !draft?.epsPrescription || !original) return <p role="alert">EPS item unavailable.</p>;
  const eps = draft.epsPrescription;
  const receipt = revision.kind !== "seed";
  return <section data-pharmacy-case={caseId} aria-label="EPS pharmacy submission" className="space-y-4">
    {!compact && <section aria-label="Original EPS prescription"><EpsPrescriptionMessage prescription={revision.epsPrescription ?? c.epsPrescription ?? eps} dispenser={false} /></section>}
    <BoundaryTag cls="human" />
    <p className="text-sm">New demonstration attempt; history retained.</p>
    {!compact && <label className="grid gap-1">Dispensing date
      <input id="eps-dispensing-date" type="date" className="rounded-md border bg-background p-2" value={eps.dispensingDate}
        onChange={(e) => update({ ...draft, epsPrescription: { ...eps, dispensingDate: e.target.value } })} />
    </label>}
    <PharmacyDraftFields draft={draft} original={original} channel="eps" update={update} />
    {!compact && <fieldset><legend className="mb-2 text-sm font-medium">Exemption status</legend>
      <NativeChoiceGroup value={eps.exemptionStatus} onValueChange={(value) => {
        if (value === "exempt" || value === "chargeable" || value === "not_recorded") update({ ...draft, epsPrescription: { ...eps, exemptionStatus: value } });
      }} aria-label="Exemption status" className="justify-start">
        <NativeChoiceItem value="exempt">Exempt</NativeChoiceItem><NativeChoiceItem value="chargeable">Chargeable</NativeChoiceItem><NativeChoiceItem value="not_recorded">Not recorded</NativeChoiceItem>
      </NativeChoiceGroup>
    </fieldset>}
    {enabled ? <PharmacyDraftCheck result={result} error={validationError}
      apply={controls === "correct-and-submit" ? () => act(() => {
        const store = useAppStore.getState();
        store.setPharmacyDraft(caseId, draft);
        store.applySuggestedCorrection(caseId);
      }) : undefined} />
      : <PainMarker resolved={false} pain="No advisory check; later correction is possible" resolution="Requirements checked" />}
    <Button data-pharmacy-action="submit" onClick={() => act(() => {
      useAppStore.getState().submitItem({
        caseId, revision: revision.number, channel: "eps", endorsementText: draft.endorsementText,
        epsPrescription: { ...eps, claimMessageState: "submitted" },
        precheck: pharmacySnapshot(draft.endorsementText, eps.dispensingDate, enabled ? "scripted" : "off", result, result ? new Date().toISOString() : null),
      });
    })}>Send claim</Button>
    {error && <p role="alert">{error}</p>}
    {receipt && <PharmacySubmissionReceipt caseId={caseId} revisionNumber={revision.number} compact={compact} />}
    {receipt && !compact && <PharmacyTimeline key={`${caseId}:${revision.number}`} caseId={caseId} revision={revision.number} />}
  </section>;
}
