import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { BoundaryTag } from "@/components/demo/labels";
import { useAppStore } from "@/lib/store";
import { itemStateLabel } from "@/lib/domain/lifecycle";

export function ReleaseRecord({ caseId }: { caseId: string }) {
  const lifecycle = useAppStore((s) => s.lifecycles[caseId]);
  const revision = useAppStore((s) => s.caseRevisions[caseId]?.at(-1)?.number);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (lifecycle?.state === "released_to_pricing") heading.current?.focus(); }, [lifecycle?.state]);
  if (lifecycle?.state !== "released_to_pricing") return null;
  const event = lifecycle.history.filter((entry) => entry.revision === revision && entry.processStep === "release_to_pricing").at(-1);
  if (!event) return <p role="alert">Release evidence unavailable for this revision.</p>;
  const automatic = event.actor === "code" && event.releaseOrigin === "automatic_verification"
    && event.verification?.gate1 === "pass" && event.verification.gate2 === "pass"
    && event.verification.reconciled && event.verification.released;
  if (!automatic && event.releaseOrigin !== "human_decision") {
    return <p role="alert">Release attribution or verification incomplete.</p>;
  }
  return <section aria-label="Release record" data-release-record={caseId} data-automatic-case={automatic ? "" : undefined}
    className="space-y-3 rounded-xl border p-4">
    <h2 ref={heading} tabIndex={-1} className="font-semibold focus-visible:outline-2">{automatic
      ? "Verified and released to existing pricing, no operator action"
      : itemStateLabel(lifecycle, "nhsbsa", true)}</h2>
    <BoundaryTag cls={automatic ? "deterministic" : "human"} />
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <div><dt className="font-medium">Revision</dt><dd>{event.revision}</dd></div>
      <div><dt className="font-medium">Released by</dt><dd>{event.actor}</dd></div>
      <div><dt className="font-medium">Gate 1</dt><dd>{event.verification?.gate1 ?? "Not recorded"}</dd></div>
      <div><dt className="font-medium">Gate 2</dt><dd>{event.verification?.gate2 ?? "Not recorded"}</dd></div>
      <div><dt className="font-medium">Reconciliation</dt><dd>{event.verification?.reconciled ? "Confirmed" : "Not established"}</dd></div>
      <div><dt className="font-medium">Timestamp</dt><dd><time dateTime={event.at}>{event.at}</time></dd></div>
      {event.reason && <div className="col-span-2"><dt className="font-medium">Human reason</dt><dd>{event.reason}</dd></div>}
    </dl>
    <p className="text-sm">Read-only release record. No payment calculated.</p>
  </section>;
}

export function AutomatedCaseRecords() {
  const lifecycles = useAppStore((s) => s.lifecycles);
  const processes = useAppStore((s) => s.itemProcesses);
  const revisions = useAppStore((s) => s.caseRevisions);
  const automatic = Object.values(lifecycles).filter((row) => {
    const process = processes[row.caseId];
    return process?.revision === revisions[row.caseId]?.at(-1)?.number
      && process.routing.outcome === "auto_priced"
      && process.releaseOrigin !== "human_decision";
  });
  return <details className="rounded-xl border p-3" data-automated-records>
    <summary className="cursor-pointer font-semibold focus-visible:outline-2">Automated session items ({automatic.length})</summary>
    <ul className="mt-3 space-y-2 text-sm">{automatic.map((row) =>
      <li key={row.caseId}><Link className="underline focus-visible:outline-2" to={`/case/${encodeURIComponent(row.caseId)}`}>
        {row.caseId}: read-only record
      </Link></li>)}</ul>
    {!automatic.length && <p>No automated session items.</p>}
  </details>;
}
