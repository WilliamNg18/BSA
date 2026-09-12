import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeChoiceGroup as ToggleGroup, NativeChoiceItem as ToggleGroupItem } from "@/components/ui/native-radio-group";
import { PageSection } from "@/components/page-section";
import { EmptyState } from "@/components/states";
import { BoundaryTag, RecommendationBadge, StateBadge, SyntheticTag } from "@/components/demo/labels";
import { NativeSwitch as Switch } from "@/components/ui/native-switch";
import { QueueMonth } from "@/components/demo/queue-month";
import { QueueDay } from "@/components/demo/queue-day";
import { QueueCompare } from "@/components/demo/queue-compare";
import { QueueManualSteps, QueueTodayDialog } from "@/components/demo/queue-manual";
import { useBaselineScenario } from "@/hooks/use-baseline-scenario";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useQueueStore, type SweepItem } from "@/lib/queue-store";
import { QUEUE_SEEDS, SWEEP_PHASES, sweepCounts } from "@/lib/domain/queue-model";
import { STATE_META } from "@/components/demo/label-meta";
import { CompositeBadge, SignalList } from "@/components/demo/signals";
import { runAgent } from "@/lib/domain/agent";
import { CASES, QUEUE_FILLER } from "@/lib/domain/cases";
import type { CaseState } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store";
import { QueueLifecycle } from "@/components/demo/queue-lifecycle";

const FILTERS: { value: CaseState | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "agent_review_complete", label: STATE_META.agent_review_complete.label },
  { value: "operator_review_required", label: STATE_META.operator_review_required.label },
  { value: "additional_evidence_required", label: STATE_META.additional_evidence_required.label },
  { value: "agent_abstained", label: STATE_META.agent_abstained.label },
  { value: "cleared_by_rules", label: STATE_META.cleared_by_rules.label },
  { value: "human_decision_recorded", label: STATE_META.human_decision_recorded.label },
];

function minutes(m: number) {
  if (m === 0) return "Done";
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}

export function QueuePage() {
  const [filter, setFilter] = useState<CaseState | "all">("all");
  const caseStates = useAppStore((s) => s.caseStates);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const setAgentEnabled = useAppStore((s) => s.setAgentEnabled);
  const { input, result } = useBaselineScenario();
  const reduced = useReducedMotion();
  const sweeping = useQueueStore((s) => s.sweeping);
  const phase = useQueueStore((s) => s.phase);
  const sweep = useQueueStore((s) => s.sweep);
  const revision = useQueueStore((s) => s.revision);
  const [selected, setSelected] = useState<{ id: string; revision: number } | null>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const openToday = (id: string) => {
    dialogTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected({ id, revision });
  };
  const restoreFocus = () => {
    const target = dialogTrigger.current?.isConnected ? dialogTrigger.current : document.querySelector<HTMLElement>("h1[data-tour-heading]");
    target?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!sweeping || reduced) return;
    const timer = window.setInterval(() => useQueueStore.getState().stepSweep(), 400);
    return () => window.clearInterval(timer);
  }, [sweeping, reduced]);
  useEffect(() => () => useQueueStore.getState().cancel(), []);
  function runVisible() {
    const items: SweepItem[] = [];
    const month = document.querySelector('[aria-label="Month scroll window"]')?.getBoundingClientRect();
    document.querySelectorAll<HTMLElement>('[data-queue-seed], [data-month-index]').forEach((element) => {
      const rect = element.getBoundingClientRect();
      const generated = element.dataset.monthIndex !== undefined;
      const top = generated && month ? Math.max(0, month.top) : 0;
      const bottom = generated && month ? Math.min(window.innerHeight, month.bottom) : window.innerHeight;
      if (rect.bottom <= top || rect.top >= bottom) return;
      const seed = QUEUE_SEEDS.find((s) => s.id === element.dataset.queueSeed);
      if (generated) items.push({ key: `month:${element.dataset.monthIndex}`, kind: element.dataset.sweepKind as SweepItem["kind"] });
      else if (seed) items.push({ key: seed.id, kind: caseStates[seed.id] === "human_decision_recorded" ? "recorded" : seed.kind });
    });
    useQueueStore.getState().startSweep(items);
  }
  const complete = phase === SWEEP_PHASES.length - 1;
  const counts = sweepCounts(complete ? sweep.map((s) => s.kind) : []);

  const rows = useMemo(() => {
    const live = CASES.map((c) => {
      const pack = runAgent(c, { agentEnabled });
      return {
        id: c.id,
        reason: c.routingReason,
        pharmacy: c.pharmacy.name,
        state: caseStates[c.id],
        pack,
        minutes: caseStates[c.id] === "human_decision_recorded" ? 0 : c.minutesInQueue,
        openable: true,
      };
    });
    const filler = QUEUE_FILLER.map((f) => ({
      id: f.id,
      reason: f.routingReason,
      pharmacy: f.pharmacy,
      state: f.state,
      pack: null,
      minutes: f.minutesInQueue,
      openable: false,
      recommendation: f.recommendation,
    }));
    return [...live, ...filler].filter((r) => filter === "all" || r.state === filter);
  }, [caseStates, agentEnabled, filter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <SyntheticTag />
        <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2">NHSBSA exception queue</h1>
        <p className="max-w-3xl text-muted-foreground">
          Synthetic operator queue. Open evidence or trace; assistance adds recommendations, never decisions. Confidence uses structural signals, not a correctness percentage.
        </p>
      </div>

      <QueueLifecycle />
      <section aria-label="Queue controls" className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Switch aria-label={`Queue assistance: ${agentEnabled ? "On" : "Off"}`} checked={agentEnabled} onCheckedChange={setAgentEnabled} />
          <span>Agent {agentEnabled ? "On" : "Off"}</span><BoundaryTag cls="agent" />
          <Button disabled={!agentEnabled || !input || sweeping} onClick={runVisible}>Run agent on visible rows</Button>
          <Button variant="outline" disabled={!sweeping} onClick={() => useQueueStore.getState().stepSweep()}>Step sweep</Button>
          <Button variant="outline" disabled={!sweep.length} onClick={() => useQueueStore.getState().cancel()}>Cancel sweep</Button>
          {input && result ? <QueueCompare key={`compare-${revision}`} input={input} result={result} /> : <Button variant="outline" disabled>Compare</Button>}
        </div>
        <p className="text-sm text-muted-foreground">Visible-row projection only. Seed evidence and recorded states stay unchanged.{reduced ? " Reduced motion: use Step sweep to inspect phases." : " Two seconds illustrates assembly, not actual processing time."}</p>
        <output aria-live="polite" className="block" data-sweep-status>{phase < 0 ? "No sweep" : `${SWEEP_PHASES[phase]} · ${sweep.length} visible rows · projection only`}</output>
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4" data-sweep-counts>
          {[["Cases built", counts.built], ["Code-cleared", counts.cleared], ["Abstained", counts.abstained], ["Awaiting human", counts.awaiting]].map(([label, count]) => <div key={label}><dt>{label} · sweep projection</dt><dd>{count}</dd></div>)}
        </dl>
      </section>

      <PageSection
        title="Queue"
        description={`${rows.length} pinned examples. Filter recorded states, not simulation. Independent references never increase projected volume.`}
        action={null}
      >
        {result && result.volume < 12 && <p role="status">{12 - result.volume} examples outside projection · Monthly volume remains {result.volume}.</p>}
        <ToggleGroup value={filter} onValueChange={(v) => v && setFilter(v as CaseState | "all")} aria-label="Filter by state" className="flex-wrap justify-start">
          {FILTERS.map((f) => (
            <ToggleGroupItem key={f.value} value={f.value} className="h-8 whitespace-normal text-xs data-[state=on]:bg-teal-700 data-[state=on]:text-white">
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title="No items in this state" description="Choose another filter, or reset the demo from the header." action={<Button variant="outline" size="sm" onClick={() => setFilter("all")}>Show all</Button>} />
        ) : (
          <div className="relative overflow-x-auto rounded-lg border" role="region" aria-label="Exception queue table" tabIndex={0}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Exception reason</TableHead>
                  <TableHead>Evidence status</TableHead>
                  <TableHead>Agent recommendation</TableHead>
                  <TableHead>Confidence signals</TableHead>
                  <TableHead>Recorded seed state</TableHead>
                  <TableHead className="text-right">In queue</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} data-queue-seed={r.id} className={r.openable ? "" : "text-muted-foreground"}>
                    <TableCell className="whitespace-normal align-top">
                      <p className="font-medium">{r.id}</p>
                      <p className="text-xs text-muted-foreground">{r.pharmacy}</p>
                      <p className="text-xs">Pinned · {QUEUE_SEEDS.find((s) => s.id === r.id)?.label}</p>
                      {result && QUEUE_SEEDS.findIndex((s) => s.id === r.id) >= result.volume && <p className="text-xs">Example outside projection</p>}
                      {input && <details className="mt-2 min-w-40"><summary className="cursor-pointer text-xs">Manual evidence work · 7 steps</summary>
                        <div className="mt-2 w-64"><QueueManualSteps input={input} assisted={agentEnabled && complete && sweep.some((s) => s.key === r.id && s.kind === "built")} /></div>
                      </details>}
                      <Button className="mt-2 whitespace-normal text-xs" size="sm" variant="outline" disabled={!agentEnabled || !input}
                        onClick={() => sweeping ? useQueueStore.getState().stepSweep() : runVisible()}>{sweeping ? "Step visible sweep" : "Sweep visible rows"}</Button>
                      {agentEnabled && sweep.some((s) => s.key === r.id) && <div className="mt-1 text-xs">{SWEEP_PHASES[phase]} · {sweep.find((s) => s.key === r.id)?.kind === "abstained" ? "Manual fallback; never ready" : sweep.find((s) => s.key === r.id)?.kind === "cleared" ? "Code only; no agent" : "Projection only"}</div>}
                    </TableCell>
                    <TableCell className="max-w-56 whitespace-normal align-top text-sm">{r.reason}</TableCell>
                    <TableCell className="whitespace-normal align-top text-sm">
                      {r.pack
                        ? r.pack.agentInvoked
                          ? `${r.pack.evidence.length} findings; ${r.pack.conflicts.length ? `${r.pack.conflicts.length} conflict${r.pack.conflicts.length === 1 ? "" : "s"}` : "sources agree"}`
                          : "Pre-checks only"
                        : "Synthetic row"}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {!agentEnabled || r.pack ? <RecommendationBadge rec={agentEnabled && r.pack ? r.pack.recommendation : "NONE"} className="text-xs" /> : <span className="text-sm">{"recommendation" in r ? r.recommendation : ""}</span>}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {r.pack && r.pack.agentInvoked ? (
                        <details>
                          <summary className="cursor-pointer text-sm">
                            <CompositeBadge composite={r.pack.composite} className="text-xs" />
                          </summary>
                          <div className="mt-2 w-72 max-w-full">
                            <SignalList signals={r.pack.signals} compact />
                          </div>
                        </details>
                      ) : (
                        <span className="text-sm">{r.pack ? "Not applicable" : "See case"}</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top"><StateBadge state={r.state} /></TableCell>
                    <TableCell className="whitespace-nowrap align-top text-right tabular-nums">{minutes(r.minutes)}</TableCell>
                    <TableCell className="align-top">
                      {r.openable ? (
                        <div className="flex flex-col gap-1">
                          <Button asChild size="sm" className="bg-teal-700 text-white hover:bg-teal-800">
                            <Link to={`/case/${r.id}`}>Case pack</Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/case/${r.id}/trace`}>Trace</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1"><span className="text-xs">Filler row</span><Button size="sm" variant="outline" disabled={!input} onClick={() => openToday(r.id)}>Today</Button></div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PageSection>
      {input && result ? <>
        <QueueMonth key={`month-${revision}`} result={result} openToday={openToday} runVisible={runVisible} />
        <QueueDay input={input} />
        <QueueTodayDialog key={`dialog-${revision}`} selected={selected?.revision === revision ? selected.id : null} close={() => setSelected(null)} input={input} restoreFocus={restoreFocus} />
      </> : <p role="alert">Invalid calculator assumptions. Month and day projections are unavailable; pinned evidence remains readable.</p>}
    </div>
  );
}
