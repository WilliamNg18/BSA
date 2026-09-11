import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BoundaryTag, SyntheticTag } from "@/components/demo/labels";
import { LifecycleHistory } from "@/components/demo/lifecycle-history";
import { ClaimDetail } from "@/components/demo/claim-detail";
import { LIFECYCLE_LABELS, type LifecycleState } from "@/lib/domain/lifecycle";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { PHARMACIES } from "@/lib/domain/reference";
import { useAppStore } from "@/lib/store";

export function PharmacyClaimsPage() {
  const [params, setParams] = useSearchParams();
  const id = params.get("caseId") ?? params.get("case");
  const lifecycles = useAppStore((s) => s.lifecycles);
  const revisions = useAppStore((s) => s.caseRevisions);
  const [selectedPharmacy, setPharmacy] = useState("FQ123");
  const pharmacy = id && lifecycles[id] ? lifecycles[id].pharmacyCode : selectedPharmacy;
  const [filter, setFilter] = useState<LifecycleState | "all">("all");
  const rows = useMemo(() => Object.values(lifecycles).filter((row) => row.pharmacyCode === pharmacy).map((row) => ({
    ...row, c: caseForLifecycle(row.caseId, lifecycles, revisions),
  })), [lifecycles, revisions, pharmacy]);
  const shown = rows.filter((row) => filter === "all" || row.state === filter);
  const selected = rows.find((row) => row.caseId === id);
  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="space-y-2"><SyntheticTag /><h1 className="text-2xl font-semibold">Pharmacy claims</h1>
      <p>Synthetic claimed amounts, not calculated payments. Shared session history survives navigation, not reloads.</p><BoundaryTag cls="existing" />
      <Button asChild variant="outline"><Link to="/pharmacy">Open pharmacy submission</Link></Button>
    </header>
    <div className="flex flex-wrap gap-4">
      <label className="grid gap-1">Pharmacy (synthetic)
        <select className="rounded-md border bg-background p-2" value={pharmacy} onChange={(e) => { setPharmacy(e.target.value); setParams({}); }}>
          {PHARMACIES.map((p) => <option key={p.contractorCode} value={p.contractorCode}>{p.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1">Claim state
        <select className="max-w-full rounded-md border bg-background p-2" value={filter} onChange={(e) => setFilter(e.target.value as LifecycleState | "all")}>
          <option value="all">All states ({rows.length})</option>
          {(Object.keys(LIFECYCLE_LABELS) as LifecycleState[]).map((state) => <option key={state} value={state}>{state.replaceAll("_", " ")} ({rows.filter((row) => row.state === state).length})</option>)}
        </select>
      </label>
    </div>
    <dl className="grid gap-3 sm:grid-cols-2" aria-label="Synthetic claim totals">
      <div><dt>Matching claims</dt><dd>{shown.length}</dd></div>
      <div><dt>Claimed amount (synthetic, not payments)</dt><dd>£{shown.reduce((sum, row) => sum + (row.c?.claim.amountClaimed ?? 0), 0).toFixed(2)}</dd></div>
    </dl>
    <ul aria-label="Pharmacy claims" className="grid gap-3 md:grid-cols-2">
      {shown.map((row) => <li key={row.caseId} className="space-y-2 rounded-xl border bg-card p-4">
        <h2 className="break-all font-semibold">{row.caseId}</h2>
        <p className="text-sm">{LIFECYCLE_LABELS[row.state].pharmacy}</p>
        <div className="text-sm">Claimed: £{row.c?.claim.amountClaimed.toFixed(2) ?? "Not available"} (synthetic)</div>
        <Button variant="outline" onClick={() => setParams({ caseId: row.caseId })}>Open claim {row.caseId}</Button>
      </li>)}
    </ul>
    {!shown.length && <p role="status">No claims match this filter.</p>}
    {id && !selected && <p role="alert">Unknown synthetic claim. Choose a claim from this pharmacy.</p>}
    {selected?.c && <>
      <ClaimDetail key={`${id}-${revisions[selected.caseId].at(-1)?.number}`} c={selected.c} row={selected} />
      <LifecycleHistory id={selected.caseId} pharmacy />
    </>}
  </div>;
}