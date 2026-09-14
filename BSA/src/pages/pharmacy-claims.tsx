import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CompactTooltip, CompactTooltipContent, CompactTooltipTrigger } from "@/components/ui/compact-tooltip";
import { SyntheticTag } from "@/components/demo/labels";
import { ClaimDetail } from "@/components/demo/claim-detail";
import { PharmacyModelStrip } from "@/components/demo/manual-loop-projection";
import { formatProcessItems } from "@/lib/domain/baseline";
import { itemStateLabel, type CaseLifecycle } from "@/lib/domain/lifecycle";
import { BACKGROUND_CASES } from "@/lib/domain/cases";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { HILLCREST_PHARMACY } from "@/lib/domain/reference";
import { useAppStore } from "@/lib/store";

const filters = ["Action needed", "Waiting on NHSBSA", "Paid this month", "All"] as const;
type ClaimFilter = typeof filters[number];
const money = (amount: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);

function matchesFilter(row: CaseLifecycle, filter: ClaimFilter, month: string) {
  if (filter === "Action needed") return row.state === "referred_back" || row.state === "information_requested";
  if (filter === "Waiting on NHSBSA") return ["submitted", "in_review", "resubmitted", "escalated"].includes(row.state);
  if (filter === "Paid this month") return ["paid", "released_to_pricing"].includes(row.state) &&
    row.history.some((event) => ["paid", "released_to_pricing"].includes(event.to) && event.at.startsWith(month));
  return true;
}

export function PharmacyClaimsPage() {
  const [params, setParams] = useSearchParams();
  const id = params.get("caseId") ?? params.get("case");
  const lifecycles = useAppStore((s) => s.lifecycles);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const revisions = useAppStore((s) => s.caseRevisions);
  const processes = useAppStore((s) => s.itemProcesses);
  const corrections = useAppStore((s) => s.pharmacyCorrections);
  const pharmacy = HILLCREST_PHARMACY.contractorCode;
  const [filter, setFilter] = useState<ClaimFilter>("Action needed");
  const month = new Date().toISOString().slice(0, 7);
  const rows = useMemo(() => Object.values(lifecycles).filter((row) => row.pharmacyCode === pharmacy).map((row) => ({
    ...row, c: caseForLifecycle(row.caseId, lifecycles, revisions, processes),
  })), [lifecycles, revisions, processes, pharmacy]);
  const shown = rows.filter((row) => matchesFilter(row, filter, month));
  const selected = rows.find((row) => row.caseId === id);
  const caught = new Set(corrections.filter((event) => event.pharmacyCode === pharmacy && event.at.startsWith(month))
    .map((event) => `${event.caseId}:${event.revision}`)).size;
  const totals = [
    ["Submitted this month", rows.filter((row) => row.history.some((event) => event.to === "submitted" && event.at.startsWith(month))).length],
    ["Referred back", rows.filter((row) => row.history.some((event) => event.to === "referred_back" && event.at.startsWith(month))).length],
    ["Corrected/resubmitted", rows.filter((row) => revisions[row.caseId]?.some((revision) => revision.kind === "resubmission" && revision.at.startsWith(month))).length],
    ["Paid", rows.filter((row) => row.history.some((event) => ["paid", "released_to_pricing"].includes(event.to) && event.at.startsWith(month))).length],
  ] as const;
  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="space-y-2"><SyntheticTag /><h1 className="text-2xl font-semibold">Pharmacy claims</h1>
      <section aria-label="Referral cycle guide" className="space-y-2">
        <p>{agentEnabled
          ? "Read the operator-approved fix, correct the endorsement, then explicitly resubmit. The agent verifies the submission and advises; a person decides."
          : "Today: referred-back items appear in MYS Unpaid items with an RB code and the operator's reason. The pharmacy corrects and resubmits."}</p>
        <CompactTooltip><CompactTooltipTrigger asChild><Button variant="link" className="h-auto whitespace-normal p-0">What is assumed?</Button></CompactTooltipTrigger>
          <CompactTooltipContent>Owner-supplied public context: MYS Unpaid items and NHSmail notification; expiry after 18 months. Weeks of delay are illustrative. No notification is sent here.</CompactTooltipContent>
        </CompactTooltip>
      </section>
      <Button asChild variant="outline"><Link to="/pharmacy">Open pharmacy submission</Link></Button>
    </header>
    <p data-pharmacy-identity>{HILLCREST_PHARMACY.name} ({pharmacy}) · Synthetic pharmacy</p>
    <section aria-label="Selected pharmacy this month" className="space-y-2 rounded-xl border p-4">
      <h2 className="font-semibold">This pharmacy · {month}</h2>
      <p className="text-sm">Paid on the normal schedule includes recorded release to existing pricing. Synthetic categories overlap; no payments calculated.</p>
      <dl className="grid gap-3 grid-cols-5">
        {totals.map(([label, total]) => <div key={label}><dt className="text-sm">{label}</dt><dd className="text-xl font-semibold">{formatProcessItems(total)}</dd></div>)}
        {agentEnabled && <div><dt className="text-sm">Caught before submission</dt><dd className="text-xl font-semibold">{formatProcessItems(caught)}</dd></div>}
      </dl>
      {agentEnabled && <p className="text-sm">Catches count checked, human-applied corrections once per attempt.</p>}
      <PharmacyModelStrip />
    </section>
    <section aria-label="Historical cases, background" className="rounded-xl border p-4 text-sm">
      <h2 className="font-semibold">Historical cases, background</h2>
      <ul>{BACKGROUND_CASES.map((c) => <li key={c.id}>{c.id} · Case {c.scenario} · Background only, not playable</li>)}</ul>
    </section>
    <section aria-label="MYS Unpaid items" className="space-y-1 rounded-xl border p-4 text-sm">
      <h2 className="font-semibold">MYS Unpaid items</h2>
      <p>NHSmail prompts resubmission within 18 months; only affected items wait. Advance: 80%; balance when priced. Demonstration sends nothing and calculates no payments.</p>
    </section>
    <div role="group" aria-label="Claim filters" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {filters.map((name) => {
        const matching = rows.filter((row) => matchesFilter(row, name, month));
        return <button key={name} type="button" aria-pressed={filter === name} onClick={() => setFilter(name)}
          className="rounded-xl border bg-card p-4 text-left focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary">
          <span className="block font-semibold">{name}</span>
          <span className="block">{matching.length} items</span>
          <span className="block text-sm">{money(matching.reduce((sum, row) => sum + (row.c?.claim.amountClaimed ?? 0), 0))} claimed (synthetic)</span>
        </button>;
      })}
    </div>
    <div className="overflow-x-auto rounded-xl border">
      <table aria-label="Pharmacy claims" className="w-full text-left text-sm">
        <caption className="p-3 text-left">{filter}. Claimed amounts are synthetic, not calculated payments.</caption>
        <thead><tr className="border-b"><th scope="col" className="p-3">Item</th><th scope="col" className="p-3">Dispensed</th><th scope="col" className="p-3">Amount</th><th scope="col" className="p-3">State</th><th scope="col" className="p-3">Action</th></tr></thead>
        <tbody>{shown.map((row) => <tr key={row.caseId} className="border-b last:border-0">
          <th scope="row" className="break-words p-3 font-medium">{row.caseId}</th>
          <td className="p-3">{row.c?.extracted.dispensingDate ?? "Not recorded"}</td>
          <td className="p-3">{row.c ? money(row.c.claim.amountClaimed) : "Not recorded"}</td>
          <td className="p-3">{itemStateLabel(row, "pharmacy")}</td>
          <td className="p-3"><Button variant="outline" className="relative h-auto whitespace-normal" onClick={() => { setParams({ caseId: row.caseId }); }}>
            {row.state === "referred_back" ? "Correct and resubmit" : row.state === "information_requested" ? "Send confirmation" : "View"}
            <span className="sr-only"> {row.caseId}</span>
          </Button></td>
        </tr>)}</tbody>
      </table>
    </div>
    {!shown.length && <p role="status">No claims match this filter.</p>}
    {id && !selected && <p role="alert">Unknown synthetic claim. Choose a claim from this pharmacy.</p>}
    {selected?.c && <ClaimDetail key={selected.caseId} c={selected.c} row={selected} />}
  </div>;
}
