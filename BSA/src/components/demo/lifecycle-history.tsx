import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "@/components/demo/labels";
import { LIFECYCLE_LABELS } from "@/lib/domain/lifecycle";
import { useAppStore } from "@/lib/store";

export function LifecycleHistory({ id, pharmacy = false }: { id: string; pharmacy?: boolean }) {
  const row = useAppStore((s) => s.lifecycles[id]);
  const revisions = useAppStore((s) => s.caseRevisions[id]);
  const enabled = useAppStore((s) => s.agentEnabled);
  const followed = useAppStore((s) => s.followedCaseId);
  const follow = useAppStore((s) => s.followCase);
  if (!row) return null;
  return <section aria-label="Shared case history" className="space-y-3 rounded-xl border bg-card p-4">
    <h2 className="font-semibold">Shared case history</h2>
    <p role="status">{pharmacy ? LIFECYCLE_LABELS[row.state].pharmacy : LIFECYCLE_LABELS[row.state].nhsbsa[enabled ? "on" : "off"]}</p>
    <div className="flex flex-wrap items-center gap-2">
      <BoundaryTag cls="human" />
      <Button variant="outline" aria-pressed={followed === id} onClick={() => follow(followed === id ? null : id)}>{followed === id ? "Stop following this case" : "Follow this case"}</Button>
      <Button asChild variant="outline"><Link to={pharmacy ? `/case/${id}` : `/pharmacy/claims?caseId=${encodeURIComponent(id)}`}>{pharmacy ? "View NHSBSA case" : "View pharmacy claim"}</Link></Button>
      <Button asChild variant="outline"><Link to="/queue">Open shared queue</Link></Button>
    </div>
    <details><summary className="cursor-pointer">History and attempts ({revisions?.length ?? 0})</summary>
      <ol aria-label="Lifecycle events" className="mt-3 space-y-3">
        {row.history.map((event, i) => <li key={i} className="rounded-md border p-3 text-sm">
          <dl className="grid gap-1 sm:grid-cols-2">
            <div><dt>Time / actor</dt><dd>{event.at} · {event.actor}</dd></div>
            <div><dt>Transition</dt><dd>{event.from ?? "New"} → {event.to}</dd></div>
            <div><dt>Attempt / record</dt><dd>{event.revision ?? "Historical"} · {event.recordId ?? "No decision record"}</dd></div>
            {event.reason && (!pharmacy || !enabled) && <div><dt>Human reason</dt><dd>{event.reason}</dd></div>}
            {event.reason && pharmacy && enabled && !event.approvedDraft && <div><dt>Pharmacy response</dt><dd>No operator-approved note recorded.</dd></div>}
            {event.tariffVersion && <div><dt>Rule / clause</dt><dd>{event.tariffVersion} · {event.clauseId ?? "Not recorded"}</dd></div>}
            {event.approvedDraft && enabled && <div><dt>Operator-approved note</dt><dd>{event.approvedDraft.text}</dd></div>}
          </dl>
          <p>{event.message}</p>
        </li>)}
      </ol>
      <ol aria-label="Immutable pharmacy attempts" className="mt-3 space-y-3">
        {revisions?.map((revision) => <li key={revision.number} className="rounded-md border p-3 text-sm">
          <h3 className="font-semibold">Attempt {revision.number} · {revision.kind}</h3>
          <dl className="grid gap-1 sm:grid-cols-2">
            <div><dt>Endorsement snapshot</dt><dd className="break-words">{revision.endorsementText || "None"}</dd></div>
            <div><dt>Confirmation</dt><dd>{revision.confirmation ?? "None"}</dd></div>
            <div><dt>Precheck / mode</dt><dd>{revision.precheck?.status ?? "Not checked"} · {revision.precheck?.mode ?? "Seed"}</dd></div>
            <div><dt>Rule / clause / checked at</dt><dd>{revision.precheck?.tariffVersion ?? "None"} · {revision.precheck?.clauseId ?? "None"} · {revision.precheck?.checkedAt ?? "Not checked"}</dd></div>
          </dl>
          {revision.precheck && <details><summary>Full advisory snapshot</summary><pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(revision.precheck, null, 2)}</pre></details>}
        </li>)}
      </ol>
    </details>
  </section>;
}