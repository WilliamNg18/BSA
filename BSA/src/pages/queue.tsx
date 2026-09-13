import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BoundaryTag, SyntheticTag } from "@/components/demo/labels";
import { Type1Capture } from "@/components/demo/type1-capture";
import { useProcessMonth } from "@/hooks/use-process-month";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { runAgent } from "@/lib/domain/agent";
import { permitsProposal } from "@/lib/case-presentation";
import { useAppStore } from "@/lib/store";
import { formatBaselineNumber as n } from "@/lib/domain/baseline";

type WorkFilter = "all" | "type1" | "type2" | "built" | "evidence" | "abstained" | "referred" | "decided" | "new";

export function QueuePage() {
  const resetRevision = useAppStore((s) => s.queue.revision);
  return <QueueWorklist key={resetRevision} />;
}

function QueueWorklist() {
  const lifecycles = useAppStore((s) => s.lifecycles);
  const revisions = useAppStore((s) => s.caseRevisions);
  const processes = useAppStore((s) => s.itemProcesses);
  const records = useAppStore((s) => s.records);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const { result } = useProcessMonth();
  const [filter, setFilter] = useState<WorkFilter>("all");
  const focusedCapture = useRef<string | null>(null);
  const worklistHeading = useRef<HTMLHeadingElement>(null);
  const rows = useMemo(() => Object.values(lifecycles).flatMap((lifecycle) => {
    const id = lifecycle.caseId;
    const revision = revisions[id]?.at(-1);
    const process = processes[id];
    if (!revision || !process || process.revision !== revision.number) return [];
    const record = records.filter((entry) => entry.caseId === id && (entry.revision ?? 1) === revision.number).at(-1);
    if (process.routing.outcome === "auto_priced") return [];
    const c = caseForLifecycle(id, lifecycles, revisions, processes);
    if (!c) return [];
    const pack = agentEnabled ? runAgent(c, { agentEnabled: true }) : null;
    const type1 = process.routing.outcome === "type1_capture" && process.routing.requiresHuman;
    const captureCompleted = process.routing.outcome === "type1_capture" && !process.routing.requiresHuman && Boolean(process.capture);
    const referred = process.routing.outcome === "referred_back" && !(revision.kind === "seed" && c.scenario === "F");
    const decided = !referred && (Boolean(record) || captureCompleted);
    const category: WorkFilter = type1 ? "type1" : referred ? "referred" : decided ? "decided"
      : pack?.recommendation === "ABSTAIN" ? "abstained"
      : pack && (!permitsProposal(pack) || pack.recommendation === "REQUEST_INFORMATION") ? "evidence" : "built";
    const agentWork = !agentEnabled ? "Not invoked; experience only"
      : type1 ? "Declaration pre-fill where available; human confirmation required"
      : referred ? record?.approvedDraft ? "Operator-approved exact fix recorded" : "No approved draft; human reason retained"
      : captureCompleted ? "Human capture complete; existing pricing follows"
      : decided ? record && record.tariffVersion !== "n/a" ? "Original rule version retained in the human record" : "No rule recorded for this decision"
      : category === "abstained" ? "Abstained; worked as today"
      : category === "evidence" ? "Evidence assembled; unresolved facts remain"
      : "Case built; dated clause and requirements checked";
    return [{ id, c, process, category, type1, captureCompleted, agentWork, fresh: revision.kind !== "seed", at: revision.at }];
  }).sort((a, b) => Number(b.fresh) - Number(a.fresh) || b.at.localeCompare(a.at)),
  [lifecycles, revisions, processes, records, agentEnabled]);
  useEffect(() => {
    if (focusedCapture.current && !rows.some((row) => row.id === focusedCapture.current && row.type1)) {
      focusedCapture.current = null;
      worklistHeading.current?.focus();
    }
  }, [rows]);
  const invalid = Object.values(lifecycles).some(({ caseId }) => !processes[caseId] || processes[caseId].revision !== revisions[caseId]?.at(-1)?.number);
  const tiles: { key: WorkFilter; label: string; count: number }[] = agentEnabled ? [
    { key: "built", label: "Case built, ready to judge", count: rows.filter((r) => r.category === "built").length },
    { key: "type1", label: "Awaiting confirmation (Type 1)", count: rows.filter((r) => r.type1).length },
    { key: "evidence", label: "Needs more evidence", count: rows.filter((r) => r.category === "evidence").length },
    { key: "abstained", label: "Abstained, worked as today", count: rows.filter((r) => r.category === "abstained").length },
    { key: "referred", label: "Referred back with the exact fix", count: rows.filter((r) => r.category === "referred").length },
    { key: "decided", label: "Decided", count: rows.filter((r) => r.category === "decided").length },
  ] : [
    { key: "type1", label: "Awaiting Type 1 capture", count: rows.filter((r) => r.type1).length },
    { key: "type2", label: "Awaiting Type 2 judgement", count: rows.filter((r) => !["type1", "referred", "decided"].includes(r.category)).length },
    { key: "referred", label: "Referred back", count: rows.filter((r) => r.category === "referred").length },
    { key: "decided", label: "Decided", count: rows.filter((r) => r.category === "decided").length },
  ];
  const active = tiles.some((tile) => tile.key === filter) || filter === "new" ? filter : "all";
  const visible = rows.filter((row) => active === "all" || active === "new" && row.fresh
    || active === "type2" && !["type1", "referred", "decided"].includes(row.category) || row.category === active);
  const type2 = visible.filter((row) => !row.type1 && !row.captureCompleted);
  const type1 = visible.filter((row) => row.type1);

  return <div className="mx-auto max-w-7xl space-y-5">
    <header className="space-y-2">
      <SyntheticTag />
      <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2">NHSBSA exception queue</h1>
      <p className="text-lg" data-queue-guide>{agentEnabled
        ? "Type 2 worklist: the agent verifies the submission and advises; a person decides."
        : "Type 2 worklist: review captured evidence, look up the Tariff and record your judgement."}</p>
      <section aria-label="Automatic pricing monthly aggregate" className="rounded-xl border bg-muted/30 p-4">
        <BoundaryTag cls="deterministic" />
        <p className="mt-2 font-semibold" data-auto-priced-count>{result ? n(result.counts.autoPricedItems) : "Unavailable"} priced automatically this month, no person involved</p>
        <p className="text-sm text-muted-foreground">Shared monthly model, not session completions. Items are priced by NHSBSA's existing rules engine.</p>
      </section>
    </header>
    {invalid && <p role="alert">Some items lack current routing metadata. Their work rows are withheld until the shared state is consistent.</p>}
    {!result && <p role="alert">Invalid process assumptions. Monthly figures are unavailable; actual session work remains visible.</p>}
    <section aria-label="Actual session work counts" className="space-y-3">
      <h2 className="font-semibold">Actual synthetic session items</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => <Button key={tile.key} variant="outline" aria-pressed={active === tile.key}
          className="h-auto justify-between gap-3 whitespace-normal p-4 text-left" onClick={() => setFilter(tile.key)}>
          <span>{tile.label}</span><span className="text-xl tabular-nums">{tile.count}</span>
        </Button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" aria-pressed={active === "all"} onClick={() => setFilter("all")}>All staff items ({rows.length})</Button>
        <Button variant="outline" aria-pressed={active === "new"} onClick={() => setFilter("new")}>New submissions ({rows.filter((r) => r.fresh).length})</Button>
      </div>
    </section>
    <section aria-label="Type 2 worklist" className="space-y-3">
      <h2 ref={worklistHeading} tabIndex={-1} className="rounded-sm text-lg font-semibold focus-visible:outline-2">Type 2 worklist</h2>
      <div role="region" aria-label="Type 2 items" tabIndex={0} className="overflow-x-auto rounded-xl border [&_[data-slot=table-container]]:overflow-visible">
        <Table data-type2-worklist>
          <TableHeader><TableRow>{["Reference", "Pharmacy", "Channel", "Reason it is here", "What the agent did", "Open"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{type2.map((row) => <TableRow key={row.id} data-case-id={row.id}>
            <TableCell className="font-mono">{row.id}{row.fresh && <span className="block text-xs">New submission</span>}</TableCell>
            <TableCell className="whitespace-normal">{row.c.pharmacy.name}</TableCell>
            <TableCell>{row.process.channel === "eps" ? "EPS" : "Paper"}</TableCell>
            <TableCell className="max-w-72 whitespace-normal">{row.process.routing.reason}{row.process.rbCode && <span className="block font-semibold">{row.process.rbCode}</span>}</TableCell>
            <TableCell className="max-w-64 whitespace-normal">{row.agentWork}</TableCell>
            <TableCell><Button asChild variant="outline" size="sm"><Link to={`/case/${encodeURIComponent(row.id)}`} aria-label={`Open ${row.id}`}>Open</Link></Button></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </div>
      {!type2.length && <p role="status">No Type 2 items match this filter.</p>}
    </section>
    <section aria-label="Type 1 capture lane" className="space-y-3">
      <h2 className="text-lg font-semibold">Type 1 capture lane</h2>
      <p className="text-sm text-muted-foreground">Separate capture work. A person confirms the fields before code routes the item onward.</p>
      {type1.map((row) => <article key={row.id} className="space-y-3 rounded-xl border p-4" data-type1-case={row.id}
        onFocusCapture={() => { focusedCapture.current = row.id; }}
        onBlurCapture={(event) => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) focusedCapture.current = null; }}>
        <h3 className="font-semibold">{row.id} · {row.c.pharmacy.name} · {row.process.channel === "eps" ? "EPS" : "Paper"}</h3>
        <Type1Capture caseId={row.id} />
        <Button asChild variant="outline"><Link to={`/case/${encodeURIComponent(row.id)}`}>Open {row.id}</Link></Button>
      </article>)}
      {!type1.length && <p role="status">No items awaiting Type 1 capture in this filter.</p>}
    </section>
    {visible.some((row) => row.captureCompleted) && <section aria-label="Completed Type 1 captures" className="space-y-3">
      <h2 className="text-lg font-semibold">Completed Type 1 captures</h2>
      <p className="text-sm">Human capture is complete. These items are not awaiting Type 2 judgement.</p>
      {visible.filter((row) => row.captureCompleted).map((row) => <Type1Capture key={row.id} caseId={row.id} />)}
    </section>}
    {result && <section className="space-y-3 rounded-xl border p-4" data-queue-month-summary>
      <h2 className="font-semibold">Shared monthly model: Today / With the agent</h2>
      <p className="text-sm text-muted-foreground">Public stream volumes with assumed handling effort; these projections are not actual session decisions.</p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt>Type 2 operator hours</dt><dd>{n(result.today.type2OperatorHours)} / {n(result.withAgent.type2OperatorHours)}</dd></div>
        <div><dt>Referred-back operator hours</dt><dd>{n(result.today.referralOperatorHours)} / {n(result.withAgent.referralOperatorHours)}</dd></div>
        <div><dt>Pharmacy completion hours</dt><dd>{n(result.today.pharmacyCompletionHours)} / {n(result.withAgent.pharmacyCompletionHours)}</dd></div>
        <div><dt>Items referred back</dt><dd>{n(result.today.referredBackItems)} / {n(result.withAgent.referredBackItems)}</dd></div>
      </dl>
    </section>}
  </div>;
}
