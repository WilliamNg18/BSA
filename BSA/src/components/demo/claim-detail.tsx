import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "./labels";
import { ClaimsResubmissionComparison } from "./claims-resubmission-comparison";
import { LifecycleHistory } from "./lifecycle-history";
import { PharmacyDraftFields } from "./pharmacy-draft-fields";
import { PharmacyDraftCheck } from "./pharmacy-draft-check";
import { focusPharmacyCorrection } from "./pharmacy-draft-focus";
import { PharmacyRecommendationPanel } from "./pharmacy-recommendation-panel";
import { usePharmacyDraft } from "@/hooks/use-pharmacy-draft";
import { useAppStore } from "@/lib/store";
import { itemStateLabel, NO_VERIFICATION, type CaseLifecycle } from "@/lib/domain/lifecycle";
import type { ExceptionCase } from "@/lib/domain/types";
import { isPlayableCase } from "@/lib/domain/cases";
import { correctionFingerprint } from "@/lib/domain/correction-acknowledgement";
import { PharmacyCorrectionAcknowledgement } from "./pharmacy-correction-acknowledgement";

export function ClaimDetail({ c, row }: { c: ExceptionCase; row: CaseLifecycle }) {
  return <section aria-label="Claim detail" className="space-y-4 rounded-xl border bg-card p-5">
    <PharmacyClaimActionPanel caseId={c.id} compact={false} />
    <LifecycleHistory id={row.caseId} pharmacy />
  </section>;
}

export function PharmacyClaimActionPanel({ caseId, compact = true }: { caseId: string; compact?: boolean }) {
  const { c, revision, draft, original, enabled, result, canApply, suggestionError, validationError, error, act, update } = usePharmacyDraft(caseId);
  const row = useAppStore((s) => s.lifecycles[caseId]);
  const verification = useAppStore((s) => s.itemVerification[caseId]) ?? NO_VERIFICATION;
  const [message, setMessage] = useState<{ caseId: string; revision: number; draft: string; text: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    if (compact || !heading.current) return;
    heading.current.focus({ preventScroll: true });
    heading.current.scrollIntoView({ block: "start", behavior: "instant" });
  }, [caseId, compact, row?.state, revision?.number]);
  if (!isPlayableCase(caseId)) return <p role="status">Background only, not playable.</p>;
  if (!c || !revision || !draft || !original || !row) return <p role="alert">Unknown pharmacy claim.</p>;
  const channel = draft.channel ?? revision.channel ?? (c.channel === "Electronic (EPS)" ? "eps" : "paper");
  const editable = row.state === "referred_back";
  const requested = row.state === "information_requested";
  const response = row.history.filter((event) => event.actor === "operator" && (event.revision ?? 1) === revision.number &&
    (event.to === "referred_back" || event.to === "information_requested")).at(-1);
  const approved = response?.approvedDraft;
  const acknowledgement = draft.correctionAcknowledgement;
  const acknowledged = acknowledgement?.revision === revision.number &&
    acknowledgement.fingerprint === correctionFingerprint(draft);
  const replayText = revision.declaration?.fields.endorsementText ?? revision.endorsementText;
  const draftSignature = JSON.stringify(draft);
  const revisionNumber = revision.number;
  function notify(text: string) {
    setMessage({ caseId, revision: revisionNumber, draft: draftSignature, text });
  }
  return <div data-pharmacy-case={caseId} className="space-y-3">
    <h2 ref={heading} tabIndex={-1} className="rounded-sm text-lg font-semibold focus-visible:outline-2">Claim detail: {caseId}</h2>
    <p role="status">{itemStateLabel(row, "pharmacy", enabled)}</p>
    {row.state === "released_to_pricing" && <p>Paid on the normal schedule (synthetic).</p>}
    {requested && <section aria-label="Requested confirmation" className="space-y-3">
      <dl><dt className="font-semibold">Question</dt><dd>{response?.reason ?? "No question recorded."}</dd>
        <dt>Captured form quantity</dt><dd>{c.extracted.quantity ?? "Unreadable"}</dd>
        <dt>Claim ledger quantity</dt><dd>{c.claim.quantity}</dd></dl>
      <label className="grid gap-2" htmlFor="claim-confirmation">Confirm
        <textarea id="claim-confirmation" className="min-h-20 rounded-md border bg-background p-2"
          value={draft.confirmation ?? ""} onChange={(e) => update({ ...draft, confirmation: e.target.value })} />
      </label>
      <Button data-pharmacy-action="confirmation" onClick={() => act(() => {
        useAppStore.getState().sendConfirmation(caseId, draft.confirmation ?? "");
        notify("Confirmation sent; human re-check required.");
      })}>Send confirmation</Button>
    </section>}
    {revision.confirmation && <section aria-label="Sent pharmacy confirmation">
      <dl><dt className="font-semibold">Pharmacy confirmation sent</dt><dd>{revision.confirmation}</dd></dl>
    </section>}
    {(editable || requested) && <section aria-label="Operator response" className="space-y-2">
      {editable && <dl><dt>RB code</dt><dd>{response?.rbCode ?? "Not recorded"}</dd></dl>}
      {enabled ? approved ? <section aria-label="Operator-approved pharmacy note" className="rounded-md border p-3">
        <h3 className="font-semibold">Operator-approved note</h3>
        <blockquote>{approved.text}</blockquote>
        <dl className="text-sm">
          <dt>Clause / version</dt><dd>{approved.clauseId} / {approved.tariffVersion}</dd>
          <dt>Approved by operator</dt><dd>{approved.approvedBy} / {approved.approvedAt}</dd>
        </dl>
      </section> : <>
        <dl><dt>Human decision reason</dt><dd>{response?.reason ?? "No reason recorded."}</dd></dl>
        <p>No operator-approved draft.</p>
      </> : <dl>
        <dt>Human decision reason</dt><dd>{response?.reason ?? "No reason recorded."}</dd>
        <dt>Current assistance</dt><dd>experience only</dd>
      </dl>}
    </section>}
    <BoundaryTag cls="human" />
    {row.state === "paid" && <section aria-label="Existing pricing outcome">
      <BoundaryTag cls="existing" />
      <p>Paid on the normal schedule: priced by NHSBSA&apos;s existing rules engine{row.history.some((event) => event.revision === revision.number && event.processStep === "automatic_pricing") ? ", no person involved" : " after human review"}.</p>
    </section>}
    {editable && <section aria-label="Correction and resubmission" className="space-y-3">
      {enabled &&
        <PharmacyRecommendationPanel caseId={caseId} draft={{ ...draft, purpose: draft.purpose ?? "correction" }} compact={compact} endorsementId="claim-endorsement"
          onApply={canApply ? () => act(() => {
          const store = useAppStore.getState();
          store.setPharmacyDraft(caseId, { ...draft, purpose: "correction" });
          store.applySuggestedCorrection(caseId);
          focusPharmacyCorrection(draft, useAppStore.getState().pharmacyDrafts[caseId], "claim-endorsement");
        }) : undefined} />}
      <PharmacyDraftFields draft={draft} original={original} channel={channel} update={(next) => update({ ...next, purpose: "correction" })} correction recommendationVisible={enabled} />
      {enabled && <PharmacyDraftCheck result={result} error={validationError || (result?.status === "missing" && !canApply ? suggestionError : "")}
        recheck={() => act(() => { notify(result?.status === "ready" ? "Ready" : validationError || "Correction needs review."); })} />}
      <ClaimsResubmissionComparison enabled={enabled} status={result?.status ?? null} />
      <PharmacyCorrectionAcknowledgement caseId={caseId} draft={draft} act={act} />
      <Button data-pharmacy-action="resubmit" disabled={!acknowledged} onClick={() => act(() => {
        const store = useAppStore.getState();
        if (!store.pharmacyDrafts[caseId] || store.pharmacyDrafts[caseId].purpose === "new_submission") {
          store.setPharmacyDraft(caseId, { ...draft, purpose: "correction" });
        }
        store.resubmit(caseId);
        notify("Resubmitted");
      })}>Resubmit</Button>
    </section>}
    {!editable && <PharmacyRecommendationPanel caseId={caseId} compact={compact} />}
    <dl aria-label="Item verification" className="grid grid-cols-3 gap-2 text-sm">
      <div><dt>Gate 1</dt><dd>{verification.gate1}</dd></div>
      <div><dt>Gate 2</dt><dd>{verification.gate2}</dd></div>
      <div><dt>Reconciled</dt><dd>{verification.reconciled ? "Yes" : "Not established"}</dd></div>
    </dl>
    {!compact && <dl className="grid grid-cols-2 gap-2 text-sm">
      <div><dt>Pharmacy</dt><dd>{c.pharmacy.name} (synthetic)</dd></div>
      <div><dt>Dispensing date</dt><dd>{c.extracted.dispensingDate}</dd></div>
      <div><dt>Current endorsement</dt><dd>{revision.endorsementText || "None"}</dd></div>
      <div><dt>Channel</dt><dd>{channel === "eps" ? "EPS typed message" : "Paper"}</dd></div>
    </dl>}
    {!editable && !requested && !compact && <details><summary className="cursor-pointer">Demonstration replay</summary>
      <dl className="text-sm"><dt>Replay endorsement source</dt><dd>{revision.declaration ? "Retained pharmacy declaration" : "Current submission"}</dd>
        <dt>Replay endorsement</dt><dd>{replayText || "None"}</dd></dl>
      <p>{revision.declaration ? "Replay the retained pharmacy declaration, not the scan reading." : "New demonstration attempt; previous sources remain unchanged."}</p>
      <Button variant="outline" onClick={() => act(() => useAppStore.getState().submitItem({
        caseId, revision: revision.number, channel, endorsementText: replayText,
        declaration: revision.declaration, paperDeclaration: revision.paperDeclaration, epsPrescription: revision.epsPrescription,
      }))}>Submit another demonstration attempt</Button>
    </details>}
    {error && <p role="alert">{error}</p>}
    {enabled && message?.caseId === caseId && message.revision === revision.number && message.draft === draftSignature && <p role="status">{message.text}</p>}
  </div>;
}
