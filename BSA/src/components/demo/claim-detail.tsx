import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "@/components/demo/labels";
import { ClaimsResubmissionComparison } from "@/components/demo/claims-resubmission-comparison";
import { LifecycleHistory } from "@/components/demo/lifecycle-history";
import { CompactTooltip, CompactTooltipContent, CompactTooltipTrigger } from "@/components/ui/compact-tooltip";
import { useAppStore } from "@/lib/store";
import { checkPharmacy, pharmacyDateCorrection, pharmacySnapshot, type PharmacyCheck } from "@/lib/domain/pharmacy-check";
import { LIFECYCLE_LABELS, type CaseLifecycle } from "@/lib/domain/lifecycle";
import type { ExceptionCase, PharmacyDeclaration } from "@/lib/domain/types";

export function ClaimDetail({ c, row }: { c: ExceptionCase; row: CaseLifecycle }) {
  const revision = useAppStore((s) => s.caseRevisions[c.id]?.at(-1)?.number);
  return <section aria-label="Claim detail" className="space-y-4 rounded-xl border bg-card p-5">
    <ClaimDetailContent key={`${c.id}-${revision}`} c={c} row={row} />
    <LifecycleHistory id={c.id} pharmacy />
  </section>;
}

function ClaimDetailContent({ c, row }: { c: ExceptionCase; row: CaseLifecycle }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start" }); }, []);
  const enabled = useAppStore((s) => s.agentEnabled);
  const resubmit = useAppStore((s) => s.resubmitItem);
  const confirm = useAppStore((s) => s.sendConfirmation);
  const submit = useAppStore((s) => s.submitItem);
  const revision = useAppStore((s) => s.caseRevisions[c.id]?.at(-1));
  const process = useAppStore((s) => s.itemProcesses[c.id]);
  const channel = revision?.channel ?? (c.channel === "Electronic (EPS)" ? "eps" : "paper");
  const submittedText = revision?.endorsementText ?? c.extracted.endorsementText;
  const replayText = revision?.declaration?.fields.endorsementText ?? submittedText;
  const [text, setText] = useState(submittedText);
  const [productCode, setProductCode] = useState(revision?.declaration?.fields.productCode ?? "");
  const [quantity, setQuantity] = useState(revision?.declaration?.fields.quantity?.toString() ?? "");
  const [prescriber, setPrescriber] = useState(revision?.declaration?.fields.prescriber ?? "");
  const [confirmation, setConfirmation] = useState("");
  const [checked, setChecked] = useState<{ text: string; at: string; result: PharmacyCheck } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const event = row.history.at(-1);
  const approved = event?.approvedDraft;
  const declaration = useMemo<PharmacyDeclaration | undefined>(() => channel === "paper" ? {
    fields: { productCode: productCode.trim() || null, quantity: quantity.trim() ? Number(quantity) : null, endorsementText: text, prescriber: prescriber.trim() || null },
    declaredAt: new Date().toISOString(), provenance: "pharmacy_declaration",
  } : undefined, [channel, productCode, quantity, text, prescriber]);
  const checkOptions = { channel, declaration };
  const result = enabled && checked?.text === text ? checked.result : null;
  const correction = result?.status === "missing" && approved ? pharmacyDateCorrection(c, text) : text;
  const editable = row.state === "referred_back";
  function act(action: () => void, success: string) {
    try { action(); setError(""); setMessage(success); }
    catch (err) { setError(err instanceof Error ? err.message : "Action unavailable. Review the current claim state."); }
  }
  function snapshot() {
    const fresh = enabled ? checkPharmacy(c, text, checkOptions) : null;
    return pharmacySnapshot(text, c.extracted.dispensingDate, enabled ? "scripted" : "off", fresh, fresh ? new Date().toISOString() : null);
  }
  return <>
    <h2 ref={heading} tabIndex={-1} className="scroll-mt-32 break-all rounded-sm text-lg font-semibold focus-visible:outline-2">Claim detail: {c.id}</h2>
    <p role="status">{LIFECYCLE_LABELS[row.state].pharmacy}</p>
    <BoundaryTag cls={event?.actor === "code" ? "deterministic" : event?.actor === "agent" ? "agent" : "human"} />
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      <div><dt>Pharmacy</dt><dd>{c.pharmacy.name} (synthetic)</dd></div>
      <div><dt>Dispensing date</dt><dd>{c.extracted.dispensingDate}</dd></div>
      <div><dt>Claimed amount, not payment</dt><dd>£{c.claim.amountClaimed.toFixed(2)} (synthetic)</dd></div>
      <div><dt>Current endorsement</dt><dd>{submittedText || "None"}</dd></div>
      <div><dt>Channel</dt><dd>{channel === "eps" ? "EPS typed message" : "Paper"}</dd></div>
    </dl>
    {row.state === "paid" && <section aria-label="Existing pricing outcome" className="space-y-1">
      <BoundaryTag cls="existing" />
      <p>Paid on the normal schedule (synthetic), priced by NHSBSA&apos;s existing rules engine{row.history.some((entry) => entry.revision === revision?.number && entry.processStep === "automatic_pricing") ? "; no person involved." : "."}</p>
    </section>}
    {(editable || row.state === "information_requested") && <section aria-label="Operator response" className="space-y-2">
      {editable && <><h3 className="font-semibold">MYS Unpaid item</h3><p>RB code: {event?.rbCode ?? process?.rbCode ?? "Not recorded in this legacy decision"}</p></>}
      {enabled ? (approved ? <section aria-label="Operator-approved pharmacy note" className="space-y-2 rounded-md border p-3">
        <h3 className="font-semibold">Operator-approved note</h3><p>Approved by operator</p><p>{approved.text}</p>
        <div className="text-xs">{approved.approvedBy} · {approved.approvedAt} · {approved.tariffVersion} · {approved.clauseId}</div>
        {event?.exactFix && <p>Exact fix: {event.exactFix}</p>}
      </section> : <p>No operator-approved draft. Enabling assistance does not approve a note.</p>) : <>
        <h3 className="font-semibold">Human decision reason</h3><p>{event?.reason ?? "No reason recorded."}</p>
        <div className="text-sm">{event?.tariffVersion && event.tariffVersion !== "n/a" ? `Rule: ${event.tariffVersion} · Clause: ${event.clauseId ?? "Not recorded"}` : "experience only, no rule recorded in this synthetic judgement."}</div>
        <CompactTooltip><CompactTooltipTrigger asChild><Button variant="link" className="h-auto p-0">How was this sent?</Button></CompactTooltipTrigger>
          <CompactTooltipContent>MYS Unpaid items and NHSmail notification are owner-supplied public context. The operator text and code are recorded synthetic evidence. Weeks of delay are illustrative.</CompactTooltipContent>
        </CompactTooltip>
      </>}
    </section>}
    {editable && <section aria-label="Correction and resubmission" className="space-y-3">
      {channel === "paper" && <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="font-semibold">Correct the paper declaration</legend>
        <p id="claim-declaration-provenance" className="text-sm sm:col-span-2">Every field: declared by the pharmacy, not read from the form.</p>
        <label className="grid gap-1">Declared product code<input className="rounded-md border bg-background p-2" value={productCode} aria-describedby="claim-declaration-provenance" onChange={(e) => { setProductCode(e.target.value); setChecked(null); }} /></label>
        <label className="grid gap-1">Declared quantity<input type="number" min="1" step="1" className="rounded-md border bg-background p-2" value={quantity} aria-describedby="claim-declaration-provenance" onChange={(e) => { setQuantity(e.target.value); setChecked(null); }} /></label>
        <label className="grid gap-1 sm:col-span-2">Declared prescriber (synthetic)<input className="rounded-md border bg-background p-2" value={prescriber} aria-describedby="claim-declaration-provenance" onChange={(e) => { setPrescriber(e.target.value); setChecked(null); }} /></label>
      </fieldset>}
      <label className="grid gap-2" htmlFor="claim-endorsement">Corrected endorsement
        <textarea id="claim-endorsement" className="min-h-20 rounded-md border bg-background p-2" value={text} onChange={(e) => { setText(e.target.value); setChecked(null); }} />
      </label>
      {enabled ? <section aria-label="Claims precheck" className="space-y-2">
        <BoundaryTag cls="deterministic" /><p>Scripted typed-field check, not live capture. No payment guarantee.</p>
        <Button variant="outline" onClick={() => setChecked({ text, at: new Date().toISOString(), result: checkPharmacy(c, text, checkOptions) })}>Re-check endorsement</Button>
        <p role="status">{result ? result.status === "ready" ? "Ready to resubmit" : result.status === "missing" ? "Information may be missing" : "Agent unable to determine" : "Not checked for this edit"}</p>
        {result && <>
          <div>Rule: {result.version ?? "Not retrieved"} · Clause: {result.clause?.id ?? "Not retrieved"}</div>
          <p className={result.status === "missing" ? "rounded-md border-l-4 border-primary bg-muted p-3 font-semibold" : ""}>Endorsement gap: {result.gap}</p>
          <details><summary className="cursor-pointer">Precheck evidence</summary>
            <ul aria-label="Claims precheck stages">{result.stages.map((stage, i) => <li key={i}>{[declaration ? "Declared fields" : "Captured", "Endorsement type", "Dispensing-date version", "Clause", "Requirements"][i]}: {stage}</li>)}</ul>
            <ul>{result.checks.map((check) => <li key={check.id}>{check.label}: {check.met === true ? "met" : check.met === false ? "not met" : "unknown"}</li>)}</ul>
          </details>
        </>}
        {correction !== text && <div className="space-y-2"><p>Append dispensing date: {correction.slice(text.trimEnd().length).trim()}</p>
          <Button variant="outline" onClick={() => { setText(correction); setChecked(null); }}>Apply suggested correction</Button>
        </div>}
      </section> : null}
      <ClaimsResubmissionComparison enabled={enabled} approved={Boolean(approved)} status={result?.status ?? null} />
      <Button onClick={() => act(() => resubmit({ caseId: c.id, channel, endorsementText: text, declaration, precheck: snapshot() }), "Resubmitted for existing routing. Any required capture or judgement remains human.")}>Resubmit claim</Button>
    </section>}
    {row.state === "information_requested" && <section aria-label="Requested confirmation" className="space-y-3">
      <h3 className="font-semibold">Conflicting quantities</h3>
      <dl className="grid gap-2 sm:grid-cols-2"><div><dt>Captured form quantity</dt><dd>{c.extracted.quantity ?? "Unreadable"}</dd></div><div><dt>Claim ledger quantity</dt><dd>{c.claim.quantity}</dd></div></dl>
      <p>Both values remain evidence. Confirmation does not resolve the conflict automatically.</p>
      <label className="grid gap-2" htmlFor="claim-confirmation">Pharmacy confirmation
        <textarea id="claim-confirmation" className="min-h-20 rounded-md border bg-background p-2" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
      </label>
      <Button onClick={() => act(() => confirm(c.id, confirmation), "Confirmation sent; human re-check required.")}>Send confirmation</Button>
    </section>}
    {!editable && row.state !== "information_requested" && <p>Read-only claim. The agent cannot make an operator decision or change payment.</p>}
    <details><summary className="cursor-pointer">Demonstration replay</summary>
      <p>{revision?.declaration
        ? "Replay the retained pharmacy declaration, not the scan reading. Prior evidence remains unchanged; human capture confirmation is still required."
        : "Start a new synthetic submission with current evidence. Prior attempts and decisions remain unchanged."}</p>
      <dl className="text-sm"><dt>Replay endorsement source</dt><dd>{revision?.declaration ? "Retained pharmacy declaration" : "Current submission"}</dd>
        <dt>Replay endorsement</dt><dd>{replayText || "None"}</dd></dl>
      <Button variant="outline" onClick={() => act(() => submit({ caseId: c.id, channel, endorsementText: replayText, declaration: revision?.declaration }), "New demonstration attempt submitted.")}>Submit another demonstration attempt</Button>
    </details>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
  </>;
}