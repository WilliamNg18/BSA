import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileText, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SyntheticTag } from "@/components/demo/labels";
import { Type1Capture } from "@/components/demo/type1-capture";
import { AutomaticPricingCount, ManualLoopProjection } from "@/components/demo/manual-loop-projection";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { runAgent } from "@/lib/domain/agent";
import { BACKGROUND_CASES, isPlayableCase } from "@/lib/domain/cases";
import { permitsProposal, recordHasRuleAndReason, staffLane, type StaffLane } from "@/lib/case-presentation";
import { itemStateLabel } from "@/lib/domain/lifecycle";
import { useAppStore } from "@/lib/store";
import { AutomatedCaseRecords } from "@/components/demo/release-record";

type WorkFilter = "all" | StaffLane | "new";

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
  const followedCaseId = useAppStore((s) => s.followedCaseId);
  const [search] = useSearchParams();
  const requestedCaseId = search.get("case") ?? search.get("caseId");
  const targetCaseId = requestedCaseId !== null
    ? isPlayableCase(requestedCaseId) ? requestedCaseId : null
    : isPlayableCase(followedCaseId) ? followedCaseId : null;
  const targetLane = targetCaseId && lifecycles[targetCaseId] && processes[targetCaseId]
    ? staffLane(lifecycles[targetCaseId], processes[targetCaseId]) : null;
  const [filter, setFilter] = useState<WorkFilter>(() => targetLane ?? "all");
  const [handoff, setHandoff] = useState<string | null>(null);
  const focusedCapture = useRef<string | null>(null);
  const worklistHeading = useRef<HTMLHeadingElement>(null);
  const stateElements = useRef(new Map<string, HTMLElement>());
  const lastFocused = useRef("");
  const rows = useMemo(() => Object.values(lifecycles).flatMap((lifecycle) => {
    const id = lifecycle.caseId;
    if (!isPlayableCase(id)) return [];
    const revision = revisions[id]?.at(-1);
    const process = processes[id];
    if (!revision || !process || process.revision !== revision.number) return [];
    const record = records.filter((entry) => entry.caseId === id && (entry.revision ?? 1) === revision.number).at(-1);
    const category = staffLane(lifecycle, process);
    if (!category) return [];
    const c = caseForLifecycle(id, lifecycles, revisions, processes);
    if (!c) return [];
    const pack = agentEnabled ? runAgent(c, { agentEnabled: true }) : null;
    const type1 = category === "type1";
    const captureCompleted = process.routing.outcome === "type1_capture" && !process.routing.requiresHuman && Boolean(process.capture);
    const referred = category === "referred";
    const decided = category === "decided";
    const agentWork = record ? recordHasRuleAndReason(record) ? "rule and reason recorded" : "Human reason retained; no rule and reason recorded together"
      : !agentEnabled ? "Today comparison: experience only; no new agent advice"
      : type1 ? "Declaration pre-fill where available; human confirmation required"
      : referred ? "No decision record available; inspect the retained history"
      : captureCompleted ? "Human capture complete; existing pricing follows"
      : decided ? "Human work complete; existing pricing follows"
      : pack?.recommendation === "ABSTAIN" ? "Abstained; worked as today"
      : pack && (!permitsProposal(pack) || pack.recommendation === "REQUEST_INFORMATION") ? "Evidence assembled; unresolved facts remain"
      : "Case built; dated clause and requirements checked";
    return [{ id, c, process, lifecycle, category, type1, captureCompleted, agentWork, fresh: revision.kind !== "seed", at: revision.at }];
  }).sort((a, b) => Number(b.fresh) - Number(a.fresh) || b.at.localeCompare(a.at)),
  [lifecycles, revisions, processes, records, agentEnabled]);
  useEffect(() => {
    if (focusedCapture.current && !rows.some((row) => row.id === focusedCapture.current && row.type1)) {
      setHandoff(focusedCapture.current);
      setFilter("all");
      focusedCapture.current = null;
      worklistHeading.current?.focus();
    }
  }, [rows]);
  const invalid = Object.values(lifecycles).some(({ caseId }) => !processes[caseId] || processes[caseId].revision !== revisions[caseId]?.at(-1)?.number);
  const tiles: { key: WorkFilter; label: string; count: number }[] = [
    { key: "type1", label: "Type 1 capture lane", count: rows.filter((r) => r.type1).length },
    { key: "type2", label: "Type 2 worklist", count: rows.filter((r) => r.category === "type2").length },
    { key: "referred", label: "Referred back", count: rows.filter((r) => r.category === "referred").length },
    { key: "decided", label: "Decided", count: rows.filter((r) => r.category === "decided").length },
  ];
  const active = tiles.some((tile) => tile.key === filter) || filter === "new" ? filter : "all";
  const visible = rows.filter((row) => active === "all" || active === "new" && row.fresh
    || row.category === active);
  const type1 = visible.filter((row) => row.type1);
  const targetRevision = targetCaseId ? revisions[targetCaseId]?.at(-1)?.number : undefined;
  const targetState = targetCaseId ? lifecycles[targetCaseId]?.state : undefined;
  useLayoutEffect(() => {
    if (!targetCaseId) return;
    const signature = `${targetCaseId}:${targetRevision}:${targetState}:${active}`;
    if (lastFocused.current === signature) return;
    const element = stateElements.current.get(targetCaseId);
    if (!element) return;
    lastFocused.current = signature;
    element.focus({ preventScroll: true });
    const bounds = element.getBoundingClientRect();
    if (bounds.bottom > window.innerHeight || bounds.top < 0) {
      element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    }
  }, [targetCaseId, targetRevision, targetState, active]);
  function stateRef(id: string, element: HTMLElement | null) {
    if (element) stateElements.current.set(id, element);
    else stateElements.current.delete(id);
  }
  const captureFirst = active === "type1" || active === "all" && targetLane === "type1";
  const captureLane = <section aria-label="Type 1 capture lane" className="space-y-3">
    <h2 className="text-lg font-semibold">Type 1 capture lane</h2>
    <p className="text-sm text-muted-foreground">Separate capture work. A person confirms the fields before code routes the item onward.</p>
    {type1.map((row) => <details key={row.id} open={active === "type1" || row.id === targetCaseId}
      className="rounded-xl border p-4" data-type1-case={row.id}
      onFocusCapture={() => { focusedCapture.current = row.id; }}
      onBlurCapture={(event) => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) focusedCapture.current = null; }}>
      <summary className="cursor-pointer font-semibold">{row.id} · {row.c.pharmacy.name} · <span className="inline-flex items-center gap-1"><FileText aria-hidden="true" className="size-4" />Paper</span> · <span
        ref={(element) => stateRef(row.id, element)} tabIndex={-1} data-item-state
        className="rounded-sm focus-visible:outline-2">{itemStateLabel(row.lifecycle, "nhsbsa", agentEnabled)}</span></summary>
      <div className="mt-3 space-y-3">
        <Type1Capture caseId={row.id} />
        <Button asChild variant="outline"><Link to={`/case/${encodeURIComponent(row.id)}`}>Open {row.id}</Link></Button>
      </div>
    </details>)}
    {!type1.length && <p role="status">No items awaiting Type 1 capture in this filter.</p>}
  </section>;

  return <div className="mx-auto max-w-7xl space-y-5">
    <header className="space-y-2">
      <SyntheticTag />
      <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2">NHSBSA exception queue</h1>
      <p className="text-lg" data-queue-guide>{agentEnabled
        ? "Type 2 worklist: the agent verifies and advises; a person decides."
        : "Type 2 worklist: review captured evidence, look up the Tariff and record your judgement."}</p>
      <AutomaticPricingCount />
      <AutomatedCaseRecords />
    </header>
    {invalid && <p role="alert">Some items lack current routing metadata. Their work rows are withheld until the shared state is consistent.</p>}
    <section aria-label="Actual session work counts" className="space-y-3">
      <h2 className="font-semibold">Actual synthetic session items</h2>
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
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
    {handoff && <p role="status" className="text-sm">{handoff}: capture recorded. Follow the current routing; no Type 2 decision was made.</p>}
    {captureFirst && captureLane}
    {(["type2", "referred", "decided"] as const).map((lane) => <section key={lane} aria-label={tiles.find((tile) => tile.key === lane)!.label} className="space-y-3">
      <h2 ref={lane === "type2" ? worklistHeading : undefined} tabIndex={-1} className="rounded-sm text-lg font-semibold focus-visible:outline-2">{tiles.find((tile) => tile.key === lane)!.label}</h2>
      <div role="region" aria-label={`${tiles.find((tile) => tile.key === lane)!.label} items`} tabIndex={0} className="overflow-x-auto rounded-xl border [&_[data-slot=table-container]]:overflow-visible">
        <Table data-type2-worklist={lane === "type2" ? "" : undefined} data-staff-lane={lane}>
          <TableHeader><TableRow>{["Reference", "Pharmacy", "Channel", "State", "Reason it is here", "Advice and record", "Open"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{visible.filter((row) => row.category === lane).map((row) => <TableRow key={row.id} data-case-id={row.id}>
            <TableCell className="font-mono">{row.id}{row.fresh && <span className="block text-xs">New submission</span>}</TableCell>
            <TableCell className="whitespace-normal">{row.c.pharmacy.name}</TableCell>
            <TableCell><span className="inline-flex items-center gap-1">{row.process.channel === "eps" ? <Monitor aria-hidden="true" className="size-4" /> : <FileText aria-hidden="true" className="size-4" />}{row.process.channel === "eps" ? "EPS" : "Paper"}</span></TableCell>
            <TableCell ref={(element) => stateRef(row.id, element)} tabIndex={-1}
              className="whitespace-normal focus-visible:outline-2" data-item-state>{itemStateLabel(row.lifecycle, "nhsbsa", agentEnabled)}</TableCell>
            <TableCell className="max-w-72 whitespace-normal">{row.process.routing.reason}{row.process.rbCode && <span className="block font-semibold">{row.process.rbCode}</span>}</TableCell>
            <TableCell className="max-w-64 whitespace-normal">{row.agentWork}</TableCell>
            <TableCell><Button asChild variant="outline" size="sm"><Link to={`/case/${encodeURIComponent(row.id)}`} aria-label={`Open ${row.id}`}>Open</Link></Button></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </div>
      {!visible.some((row) => row.category === lane) && <p role="status">No {tiles.find((tile) => tile.key === lane)!.label.toLowerCase()} items match this filter.</p>}
    </section>)}
    {!captureFirst && captureLane}
    {visible.some((row) => row.captureCompleted) && <section aria-label="Completed Type 1 captures" className="space-y-3">
      <h2 className="text-lg font-semibold">Completed Type 1 captures</h2>
      <p className="text-sm">Human capture is complete. These items are not awaiting Type 2 judgement.</p>
      {visible.filter((row) => row.captureCompleted).map((row) => <Type1Capture key={row.id} caseId={row.id} />)}
    </section>}
    <section aria-label="Background cases" className="rounded-xl border bg-muted/30 p-4 text-sm">
      <h2 className="font-semibold">Background cases</h2>
      <p>Fixed historical context, excluded from playable items and counts.</p>
      <ul className="mt-2 grid gap-2 grid-cols-2">
        {BACKGROUND_CASES.map((c) => <li key={c.id}>{c.id} · {c.title} · Background only</li>)}
      </ul>
    </section>
    <div data-queue-month-summary><ManualLoopProjection /></div>
  </div>;
}
