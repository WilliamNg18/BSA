import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "@/components/demo/labels";
import { LIFECYCLE_LABELS } from "@/lib/domain/lifecycle";
import { PHARMACIES } from "@/lib/domain/reference";
import { useAppStore } from "@/lib/store";

export function QueueLifecycle() {
  const lifecycles = useAppStore((s) => s.lifecycles);
  const enabled = useAppStore((s) => s.agentEnabled);
  const arrive = useAppStore((s) => s.arriveInQueue);
  const followed = useAppStore((s) => s.followedCaseId);
  const perspective = useAppStore((s) => s.perspective);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const rows = Object.values(lifecycles).filter((row) => ["submitted", "resubmitted", "in_review", "escalated"].includes(row.state));
  return <section aria-label="Shared session queue" className="space-y-3 rounded-xl border bg-card p-4">
    <h2 className="text-lg font-semibold">Shared session queue</h2>
    <p>Actual session submissions and re-checks. Separate from the workload simulation and pinned historical examples.</p>
    <BoundaryTag cls="human" />
    {followed && perspective !== "nhsbsa" && <Button asChild variant="outline"><Link to={`/pharmacy/claims?caseId=${encodeURIComponent(followed)}`}>Followed claim: {followed}</Link></Button>}
    {error && <p role="alert">{error}</p>}
    <ul className="grid gap-3 grid-cols-2">
      {rows.map((row) => <li key={row.caseId} data-shared-case={row.caseId} className="space-y-2 rounded-md border p-3">
        <h3 className="break-all font-semibold">{row.caseId}{followed === row.caseId ? " · Following" : ""}</h3>
        <div className="text-sm">{PHARMACIES.find((p) => p.contractorCode === row.pharmacyCode)?.name} (synthetic)</div>
        <p>{LIFECYCLE_LABELS[row.state].nhsbsa[enabled ? "on" : "off"]}</p>
        <Button variant="outline" onClick={() => {
          try {
            if (row.state === "submitted" || row.state === "resubmitted") arrive(row.caseId);
            navigate(`/case/${row.caseId}`);
          } catch (err) { setError(err instanceof Error ? err.message : "Review unavailable."); }
        }}>Open for review</Button>
      </li>)}
    </ul>
    {!rows.length && <p role="status">No session claims awaiting review.</p>}
  </section>;
}