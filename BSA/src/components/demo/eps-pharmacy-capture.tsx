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
import { focusPharmacyCorrection } from "./pharmacy-draft-focus";
import { PharmacyRecommendationPanel } from "./pharmacy-recommendation-panel";
import { usePharmacyDraft } from "@/hooks/use-pharmacy-draft";
import { pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import { useAppStore } from "@/lib/store";
import { PLAYABLE_CASES, playableCaseChannel } from "@/lib/domain/cases";
import { EPS_STRENGTH_CASE_ID, EPS_STRENGTH_SELECTED_CODE } from "@/lib/domain/eps-strength";
import { EPS_ERROR_EVIDENCE, EPS_STRENGTH_COPY } from "@/lib/domain/eps-error-evidence";

const SCENARIOS = PLAYABLE_CASES.filter((c) => playableCaseChannel(c.id) === "eps").map((c) => ({
  id: c.id, label: c.id === "EX-24107" ? "Complete endorsement" : "Wrong medication strength",
}));

export function EpsPharmacyCapture({ caseId: fixedCaseId, onCaseChange, compact = false, controls = "correct-and-submit" }: {
  caseId?: string; onCaseChange?: (caseId: string) => void; compact?: boolean; controls?: "submit" | "correct-and-submit";
} = {}) {
  const [selected, select] = useState(EPS_STRENGTH_CASE_ID);
  const caseId = fixedCaseId ?? selected;
  return <div className="space-y-4">
    {(!fixedCaseId || onCaseChange) && <NativeChoiceGroup value={caseId} onValueChange={onCaseChange ?? select} aria-label="Choose an EPS scenario" className="justify-start">
      {SCENARIOS.map((scenario) => <NativeChoiceItem key={scenario.id} value={scenario.id}>{scenario.label}</NativeChoiceItem>)}
    </NativeChoiceGroup>}
    <EpsClaimEditor key={caseId} caseId={caseId} compact={compact} controls={controls} />
  </div>;
}

function EpsClaimEditor({ caseId, compact, controls }: { caseId: string; compact: boolean; controls: "submit" | "correct-and-submit" }) {
  const { c, revision, draft, original, enabled, result, canApply, suggestionError, validationError, error, act, update } = usePharmacyDraft(caseId, "eps", "new_submission");
  if (!c || !revision || !draft?.epsPrescription || !original) return <p role="alert">EPS item unavailable.</p>;
  const eps = draft.epsPrescription;
  const receipt = revision.kind !== "seed";
  return <section data-pharmacy-case={caseId} aria-label="EPS pharmacy submission" className="space-y-4">
    {compact && <h2 className="text-lg font-semibold">Pharmacy check</h2>}
    {!compact && <section aria-label="Original EPS prescription">
      <h2 className="text-lg font-semibold">Prescription and dispenser&apos;s claim</h2>
      <EpsPrescriptionMessage prescription={revision.epsPrescription ?? c.epsPrescription ?? eps} dispenser={false} />
    </section>}
    <BoundaryTag cls="human" />
    <dl className="text-sm"><dt>Submission purpose</dt><dd>New demonstration attempt; history retained.</dd></dl>
    {!enabled && caseId === EPS_STRENGTH_CASE_ID && eps.items[0]?.dispensedCode === EPS_STRENGTH_SELECTED_CODE &&
      <section aria-label="Today pricing rule" className="space-y-2 rounded-lg border p-3">
        <h3 className="font-semibold">Today: pricing as endorsed</h3>
        <p className="text-sm">{EPS_STRENGTH_COPY.today}</p>
        <blockquote cite={EPS_ERROR_EVIDENCE.nhsbsa.url}>{EPS_ERROR_EVIDENCE.nhsbsa.quotation}</blockquote>
        <cite className="text-xs not-italic">{EPS_ERROR_EVIDENCE.nhsbsa.label}</cite>
      </section>}
    {!compact && <label className="grid gap-1">Dispensing date
      <input id="eps-dispensing-date" type="date" className="rounded-md border bg-background p-2" value={eps.dispensingDate}
        onChange={(e) => update({ ...draft, epsPrescription: { ...eps, dispensingDate: e.target.value } })} />
    </label>}
    <PharmacyDraftFields draft={draft} original={original} channel="eps" update={update} recommendationVisible={enabled} />
    {!compact && <fieldset><legend className="mb-2 text-sm font-medium">Exemption status</legend>
      <NativeChoiceGroup value={eps.exemptionStatus} onValueChange={(value) => {
        if (value === "exempt" || value === "chargeable" || value === "not_recorded") update({ ...draft, epsPrescription: { ...eps, exemptionStatus: value } });
      }} aria-label="Exemption status" className="justify-start">
        <NativeChoiceItem value="exempt">Exempt</NativeChoiceItem><NativeChoiceItem value="chargeable">Chargeable</NativeChoiceItem><NativeChoiceItem value="not_recorded">Not recorded</NativeChoiceItem>
      </NativeChoiceGroup>
    </fieldset>}
    {enabled ? <>
      <PharmacyRecommendationPanel caseId={caseId} draft={draft} compact={compact}
        onApply={controls === "correct-and-submit" && canApply ? () => act(() => {
        const store = useAppStore.getState();
        store.setPharmacyDraft(caseId, { ...draft, purpose: "new_submission" });
        store.applySuggestedCorrection(caseId);
        focusPharmacyCorrection(draft, useAppStore.getState().pharmacyDrafts[caseId]);
      }) : undefined} />
      <PharmacyDraftCheck result={result} error={validationError || (result?.status === "missing" && !canApply ? suggestionError : "")} />
    </>
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
