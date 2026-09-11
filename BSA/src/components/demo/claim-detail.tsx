import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "@/components/demo/labels";
import { useAppStore } from "@/lib/store";
import { checkPharmacy, pharmacyDateCorrection, pharmacySnapshot, type PharmacyCheck } from "@/lib/domain/pharmacy-check";
import { LIFECYCLE_LABELS, type CaseLifecycle } from "@/lib/domain/lifecycle";
import type { ExceptionCase } from "@/lib/domain/types";

export function ClaimDetail({ c, row }: { c: ExceptionCase; row: CaseLifecycle }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start" }); }, []);
  const enabled = useAppStore((s) => s.agentEnabled);
  const resubmit = useAppStore((s) => s.resubmitFromPharmacy);
  const confirm = useAppStore((s) => s.sendConfirmation);
  const submit = useAppStore((s) => s.submitFromPharmacy);
  const [text, setText] = useState(c.extracted.endorsementText);
  const [confirmation, setConfirmation] = useState("");
  const [checked, setChecked] = useState<{ text: string; at: string; result: PharmacyCheck } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const event = row.history.at(-1);
  const approved = event?.approvedDraft;
  const result = enabled && checked?.text === text ? checked.result : null;
  const correction = result?.status === "missing" && approved ? pharmacyDateCorrection(c, text) : text;
  const editable = row.state === "referred_back";
  function act(action: () => void, success: string) {
    try { action(); setError(""); setMessage(success); }
    catch (err) { setError(err instanceof Error ? err.message : "Action unavailable. Review the current claim state."); }
  }
  function snapshot() {
    return pharmacySnapshot(text, c.extracted.dispensingDate, enabled ? result ? "scripted" : "pending" : "off", result, result ? checked!.at : null);
  }
  return <section aria-label="Claim detail" className="space-y-4 rounded-xl border bg-card p-5">
    <h2 ref={heading} tabIndex={-1} className="scroll-mt-32 break-all rounded-sm text-lg font-semibold focus-visible:outline-2">Claim detail: {c.id}</h2>
    <p role="status">{LIFECYCLE_LABELS[row.state].pharmacy}</p>
    <BoundaryTag cls="human" />
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      <div><dt>Pharmacy</dt><dd>{c.pharmacy.name} (synthetic)</dd></div>
      <div><dt>Dispensing date</dt><dd>{c.extracted.dispensingDate}</dd></div>
      <div><dt>Claimed amount, not payment</dt><dd>£{c.claim.amountClaimed.toFixed(2)} (synthetic)</dd></div>
      <div><dt>Current endorsement</dt><dd>{c.extracted.endorsementText || "None"}</dd></div>
    </dl>
    {(editable || row.state === "information_requested") && <section aria-label="Operator response" className="space-y-2">
      <h3 className="font-semibold">Human decision reason</h3><p>{event?.reason ?? "No reason recorded."}</p>
      <div className="text-sm">Rule: {event?.tariffVersion ?? "Not recorded"} · Clause: {event?.clauseId ?? "Not recorded"}</div>
      {enabled && (approved ? <section aria-label="Operator-approved pharmacy note" className="space-y-2 rounded-md border p-3">
        <h3 className="font-semibold">Operator-approved note</h3><p>{approved.text}</p>
        <div className="text-xs">{approved.approvedBy} · {approved.approvedAt} · {approved.tariffVersion} · {approved.clauseId}</div>
      </section> : <p>No operator-approved draft. Enabling assistance does not approve a note.</p>)}
    </section>}
    {editable && <section aria-label="Correction and resubmission" className="space-y-3">
      <label className="grid gap-2" htmlFor="claim-endorsement">Corrected endorsement
        <textarea id="claim-endorsement" className="min-h-20 rounded-md border bg-background p-2" value={text} onChange={(e) => { setText(e.target.value); setChecked(null); }} />
      </label>
      {enabled ? <section aria-label="Claims precheck" className="space-y-2">
        <BoundaryTag cls="deterministic" /><p>Scripted typed-field check, not live capture. No payment guarantee.</p>
        <Button variant="outline" onClick={() => setChecked({ text, at: new Date().toISOString(), result: checkPharmacy(c, text) })}>Re-check endorsement</Button>
        <p role="status">{result ? result.status === "ready" ? "Ready to resubmit" : result.status === "missing" ? "Information may be missing" : "Agent unable to determine" : "Not checked for this edit"}</p>
        {result && <>
          <div>Rule: {result.version ?? "Not retrieved"} · Clause: {result.clause?.id ?? "Not retrieved"}</div>
          <p>{result.gap}</p>
          <ul aria-label="Claims precheck stages">{result.stages.map((stage, i) => <li key={i}>{["Captured", "Endorsement type", "Dispensing-date version", "Clause", "Requirements"][i]}: {stage}</li>)}</ul>
          <ul>{result.checks.map((check) => <li key={check.id}>{check.label}: {check.met === true ? "met" : check.met === false ? "not met" : "unknown"}</li>)}</ul>
        </>}
        {correction !== text && <div className="space-y-2"><p>Append dispensing date: {correction.slice(text.trimEnd().length).trim()}</p>
          <Button variant="outline" onClick={() => { setText(correction); setChecked(null); }}>Apply suggested correction</Button>
        </div>}
      </section> : <p>Manual correction. No advisory checks performed.</p>}
      <Button onClick={() => act(() => resubmit(c.id, text, snapshot()), "Resubmitted for human re-check.")}>Resubmit claim</Button>
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
    {!editable && row.state !== "information_requested" && <p>Read-only claim. Further decisions belong to NHSBSA operators.</p>}
    <details><summary className="cursor-pointer">Demonstration replay</summary>
      <p>Start a new synthetic submission with current evidence. Prior attempts and decisions remain unchanged.</p>
      <Button variant="outline" onClick={() => act(() => submit(c.id, c.extracted.endorsementText), "New demonstration attempt submitted.")}>Submit another demonstration attempt</Button>
    </details>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
  </section>;
}