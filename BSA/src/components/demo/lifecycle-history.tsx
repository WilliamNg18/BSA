import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "@/components/demo/labels";
import { LIFECYCLE_LABELS } from "@/lib/domain/lifecycle";
import { useAppStore } from "@/lib/store";

export function LifecycleHistory({ id, pharmacy = false }: { id: string; pharmacy?: boolean }) {
  const row = useAppStore((s) => s.lifecycles[id]);
  const revisions = useAppStore((s) => s.caseRevisions[id]);
  const enabled = useAppStore((s) => s.agentEnabled);
  const perspective = useAppStore((s) => s.perspective);
  const followed = useAppStore((s) => s.followedCaseId);
  const follow = useAppStore((s) => s.followCase);
  if (!row) return null;
  const actor = row.history.at(-1)?.actor;
  return <section aria-label="Shared case history" className={pharmacy ? "space-y-3 border-t pt-4" : "space-y-3 rounded-xl border bg-card p-4"}>
    <h2 className="font-semibold">Shared case history</h2>
    <p role="status">{pharmacy ? LIFECYCLE_LABELS[row.state].pharmacy : LIFECYCLE_LABELS[row.state].nhsbsa[enabled ? "on" : "off"]}</p>
    <div className="flex flex-wrap items-center gap-2">
      <BoundaryTag cls={actor === "code" ? "deterministic" : actor === "agent" ? "agent" : "human"} />
      {perspective === "both" && <Button variant="outline" aria-pressed={followed === id} onClick={() => follow(followed === id ? null : id)}>{followed === id ? "Stop following this case" : "Follow this case"}</Button>}
      {(pharmacy ? perspective !== "pharmacy" : perspective !== "nhsbsa") && <Button asChild variant="outline"><Link to={pharmacy ? `/case/${id}` : `/pharmacy/claims?caseId=${encodeURIComponent(id)}`}>{pharmacy ? "View NHSBSA case" : "View pharmacy claim"}</Link></Button>}
      {perspective !== "pharmacy" && <Button asChild variant="outline"><Link to="/queue">Open shared queue</Link></Button>}
    </div>
    <details><summary className="cursor-pointer">History and attempts ({revisions?.length ?? 0})</summary>
      <ol aria-label="Lifecycle events" className="mt-3 space-y-3">
        {row.history.map((event, i) => <li key={i} className="rounded-md border p-3 text-sm">
          <dl className="grid gap-1 grid-cols-2">
            <div><dt>Time / actor</dt><dd>{event.at} · {event.actor}</dd></div>
            <div><dt>Transition</dt><dd>{event.from ? pharmacy ? LIFECYCLE_LABELS[event.from].pharmacy : LIFECYCLE_LABELS[event.from].nhsbsa[enabled ? "on" : "off"] : "New"} → {pharmacy ? LIFECYCLE_LABELS[event.to].pharmacy : LIFECYCLE_LABELS[event.to].nhsbsa[enabled ? "on" : "off"]}</dd></div>
            <div><dt>Attempt / record</dt><dd>{event.revision ?? "Historical"} · {event.recordId ?? "No decision record"}</dd></div>
            {event.channel && <div><dt>Channel</dt><dd>{event.channel === "eps" ? "EPS" : "Paper"}</dd></div>}
            {event.rbCode && <div><dt>RB code</dt><dd>{event.rbCode}</dd></div>}
            {event.actor === "operator" && event.recommendation === "NONE" && !event.clauseId && (!pharmacy || !enabled) && <div><dt>Rule record</dt><dd>experience only, no rule recorded in this synthetic judgement.</dd></div>}
            {event.reason && (!pharmacy || !enabled) && <div><dt>Human reason</dt><dd>{event.reason}</dd></div>}
            {event.reason && pharmacy && enabled && !event.approvedDraft && <div><dt>Pharmacy response</dt><dd>No operator-approved note recorded.</dd></div>}
            {event.tariffVersion && (!pharmacy || !enabled || event.approvedDraft) && <div><dt>Rule / clause</dt><dd>{event.approvedDraft && pharmacy && enabled ? event.approvedDraft.tariffVersion : event.tariffVersion} · {event.approvedDraft && pharmacy && enabled ? event.approvedDraft.clauseId : event.clauseId ?? "Not recorded"}</dd></div>}
            {event.approvedDraft && enabled && <div><dt>Operator-approved note</dt><dd>{event.approvedDraft.text}</dd></div>}
            {event.approvedDraft && enabled && event.exactFix && <div><dt>Exact fix approved by operator</dt><dd>{event.exactFix}</dd></div>}
          </dl>
          <p>{event.message}</p>
          {event.capture && <section aria-label={`Type 1 capture for attempt ${event.capture.revision}`} className="mt-2 space-y-1 border-t pt-2">
            <h3 className="font-semibold">Recorded human Type 1 capture</h3>
            <p>{event.capture.provenance === "pharmacy_declaration" ? "declared by the pharmacy, not read from the form" : "Keyed by a human operator, not read automatically."}</p>
            <dl className="grid gap-1 grid-cols-2">
              <div><dt>Product code</dt><dd>{event.capture.fields.productCode ?? "Unresolved"}</dd></div>
              <div><dt>Quantity</dt><dd>{event.capture.fields.quantity ?? "Unresolved"}</dd></div>
              <div><dt>Prescriber</dt><dd>{event.capture.fields.prescriber ?? "Not captured"}</dd></div>
              <div><dt>Endorsement</dt><dd>{event.capture.fields.endorsementText || "None"}</dd></div>
              <div><dt>Confirmed by</dt><dd>{event.capture.operator} · {event.capture.confirmedAt}</dd></div>
              <div><dt>Declaration reconciled by operator</dt><dd>{event.capture.declarationReconciled ? "Yes" : "No"}</dd></div>
            </dl>
          </section>}
        </li>)}
      </ol>
      <ol aria-label="Immutable pharmacy attempts" className="mt-3 space-y-3">
        {revisions?.map((revision) => <li key={revision.number} className="rounded-md border p-3 text-sm">
          <h3 className="font-semibold">Attempt {revision.number} · {revision.kind}</h3>
          <dl className="grid gap-1 grid-cols-2">
            <div><dt>Endorsement snapshot</dt><dd className="break-words">{revision.endorsementText || "None"}</dd></div>
            <div><dt>Channel</dt><dd>{revision.channel === "eps" ? "EPS" : revision.channel === "paper" ? "Paper" : "Not recorded (legacy attempt)"}</dd></div>
            <div><dt>Confirmation</dt><dd>{revision.confirmation ?? "None"}</dd></div>
            <div><dt>Precheck / mode</dt><dd>{revision.precheck?.status ?? "Not checked"} · {revision.precheck?.mode ?? "Seed"}</dd></div>
            <div><dt>Rule / clause / checked at</dt><dd>{revision.precheck?.tariffVersion ?? "None"} · {revision.precheck?.clauseId ?? "None"} · {revision.precheck?.checkedAt ?? "Not checked"}</dd></div>
          </dl>
          {revision.declaration && <section aria-label={`Declaration for attempt ${revision.number}`} className="mt-2 space-y-1">
            <h4 className="font-semibold">Immutable pharmacy declaration</h4>
            <p>Every field: declared by the pharmacy, not read from the form.</p>
            <dl className="grid gap-1 grid-cols-2">
              <div><dt>Product code</dt><dd>{revision.declaration.fields.productCode ?? "Not declared"}</dd></div>
              <div><dt>Quantity</dt><dd>{revision.declaration.fields.quantity ?? "Not declared"}</dd></div>
              <div><dt>Prescriber</dt><dd>{revision.declaration.fields.prescriber ?? "Not declared"}</dd></div>
              <div><dt>Endorsement</dt><dd>{revision.declaration.fields.endorsementText || "Not declared"}</dd></div>
              <div><dt>Declared at</dt><dd>{revision.declaration.declaredAt}</dd></div>
            </dl>
          </section>}
          {revision.precheck && <details><summary>Full advisory snapshot</summary><pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(revision.precheck, null, 2)}</pre></details>}
        </li>)}
      </ol>
    </details>
  </section>;
}