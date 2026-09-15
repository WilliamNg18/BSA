import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "./labels";
import { PainMarker } from "./pain-marker";
import { PrescriptionForm } from "./prescription-form";
import { PharmacyDraftFields } from "./pharmacy-draft-fields";
import { PharmacyDraftCheck } from "./pharmacy-draft-check";
import { PharmacySubmissionReceipt } from "./pharmacy-submission-receipt";
import { focusPharmacyCorrection } from "./pharmacy-draft-focus";
import { PharmacyRecommendationPanel } from "./pharmacy-recommendation-panel";
import { PharmacyTimeline } from "./pharmacy-timeline";
import { usePharmacyDraft } from "@/hooks/use-pharmacy-draft";
import { useAppStore } from "@/lib/store";
import { pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import { paperImageEvidence } from "@/lib/domain/capture-evidence";
import { QUALITY_THRESHOLD } from "@/lib/domain/rules";
import { preparePaperDemoDraft } from "@/lib/domain/pharmacy-correction";

export function PaperPharmacyCapture({ caseId = "EX-24123", compact = false, controls = "correct-and-submit" }: {
  caseId?: string; compact?: boolean; controls?: "submit" | "correct-and-submit";
}) {
  const { c, revision, draft, original, enabled, result, canApply, suggestionError, validationError, error, act, update } = usePharmacyDraft(caseId, "paper");
  const [scannerShown, setScannerShown] = useState(false);
  if (!c || !revision || !draft || !original) return <p role="alert">Paper item unavailable.</p>;
  const poorScan = c.imageQuality < QUALITY_THRESHOLD;
  const submitted = revision.kind !== "seed";
  return <section aria-label="Paper pharmacy submission" data-pharmacy-case={caseId} className="space-y-4">
    <h2 className="text-lg font-semibold">{enabled ? "Proposed: paper form and declaration" : "Paper prescription posted to NHSBSA"}</h2>
    <Button variant="outline" aria-pressed={scannerShown} onClick={() => setScannerShown((shown) => !shown)}>
      Show the form as NHSBSA&apos;s scanner will see it
    </Button>
    {scannerShown && <p role="status">image cannot be read</p>}
    {(!compact || scannerShown) && <PrescriptionForm c={paperImageEvidence(c, revision.templateCaseId)} />}
    <BoundaryTag cls="human" />
    <dl className="text-sm"><dt>Submission purpose</dt><dd>New demonstration attempt; history retained.</dd></dl>
    {enabled ? <>
      <div className="flex flex-wrap gap-2" aria-label="Synthetic declaration preparation">
        <Button variant="outline" onClick={() => act(() => useAppStore.getState().setPharmacyDraft(caseId, preparePaperDemoDraft(c, revision, "complete")))}>Declaration complete</Button>
        <Button variant="outline" onClick={() => act(() => useAppStore.getState().setPharmacyDraft(caseId, preparePaperDemoDraft(c, revision, "missing")))}>Declaration missing information</Button>
      </div>
      {!compact && <Button type="button" variant="outline" onClick={() => update(original)}>
        {c.scenario === "D" ? "Load worked declaration" : "Load complete paper declaration"}
      </Button>}
      <PharmacyDraftFields draft={draft} original={original} channel="paper" update={update} recommendationVisible />
      <PharmacyRecommendationPanel caseId={caseId} draft={draft} compact={compact}
        onApply={controls === "correct-and-submit" && canApply ? () => act(() => {
          const store = useAppStore.getState();
          store.setPharmacyDraft(caseId, { ...draft, purpose: "new_submission" });
          store.applySuggestedCorrection(caseId);
          focusPharmacyCorrection(draft, useAppStore.getState().pharmacyDrafts[caseId]);
        }) : undefined} />
      <PharmacyDraftCheck result={result} error={validationError || (result?.status === "missing" && !canApply ? suggestionError : "")} />
    </> : <p data-paper-narrative className="text-sm">{poorScan
      ? "Type 1 keys; Type 2 judges. RB2B delays are illustrative, not inevitable."
      : "Type 1 keys; complete capture reaches existing pricing."}</p>}
    {!enabled && <PainMarker resolved={false} pain="Possible later correction" resolution="Declaration checked" />}
    <Button data-pharmacy-action="submit" onClick={() => act(() => {
      const text = enabled ? draft.endorsementText : revision.endorsementText;
      useAppStore.getState().submitItem({
        caseId, revision: revision.number, channel: "paper", endorsementText: text,
        ...(enabled ? { declaration: draft.declaration, paperDeclaration: draft.paperDeclaration } : {}),
        precheck: pharmacySnapshot(text, enabled ? draft.paperDeclaration?.dispensingDate ?? c.extracted.dispensingDate : c.extracted.dispensingDate,
          enabled ? "scripted" : "off", enabled ? result : null, enabled && result ? new Date().toISOString() : null),
      });
    })}>{enabled ? "Post paper with declaration" : "Post paper"}</Button>
    {error && <p role="alert">{error}</p>}
    {submitted && <PharmacySubmissionReceipt caseId={caseId} revisionNumber={revision.number} compact={compact} />}
    {submitted && !compact && <PharmacyTimeline key={`${caseId}:${revision.number}`} caseId={caseId} revision={revision.number} />}
  </section>;
}
