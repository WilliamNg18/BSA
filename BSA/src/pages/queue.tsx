import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactTooltip as Tooltip, CompactTooltipContent as TooltipContent, CompactTooltipTrigger as TooltipTrigger } from "@/components/ui/compact-tooltip";
import { SyntheticTag } from "@/components/demo/labels";
import { QueueMonth } from "@/components/demo/queue-month";
import { QueueDay } from "@/components/demo/queue-day";
import { QueueCompare } from "@/components/demo/queue-compare";
import { QueueTodayDialog } from "@/components/demo/queue-manual";
import { useMonthModel } from "@/hooks/use-month-model";
import { useQueueStore } from "@/lib/queue-store";
import { queueStatus, type QueuePreviewRow } from "@/lib/domain/queue-model";
import { CASES, QUEUE_FILLER } from "@/lib/domain/cases";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { runAgent } from "@/lib/domain/agent";
import { useAppStore } from "@/lib/store";
import { formatBaselineNumber as n } from "@/lib/domain/baseline";

export function QueuePage() {
  const caseStates = useAppStore((s) => s.caseStates);
  const lifecycles = useAppStore((s) => s.lifecycles);
  const revisions = useAppStore((s) => s.caseRevisions);
  const processes = useAppStore((s) => s.itemProcesses);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const followed = useAppStore((s) => s.followedCaseId);
  const perspective = useAppStore((s) => s.perspective);
  const { result } = useMonthModel();
  const revision = useQueueStore((s) => s.revision);
  const [selected, setSelected] = useState<string | null>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const openExample = (id: string) => {
    dialogTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(id);
  };
  const rows = useMemo(() => {
    const seeds: QueuePreviewRow[] = [...CASES, ...QUEUE_FILLER].map((item) => {
      const canonical = CASES.some((c) => c.id === item.id);
      const latest = revisions[item.id]?.at(-1);
      const fresh = !!latest && latest.kind !== "seed";
      const lifecycle = fresh ? lifecycles[item.id] : undefined;
      const state = caseStates[item.id] ?? ("state" in item ? item.state : item.initialState);
      const evidence = canonical && agentEnabled ? caseForLifecycle(item.id, lifecycles, revisions) : null;
      const pack = evidence ? runAgent(evidence, { agentEnabled: true }) : null;
      const status = queueStatus(state, agentEnabled, lifecycle, pack);
      return {
        id: item.id, pharmacy: typeof item.pharmacy === "string" ? item.pharmacy : item.pharmacy.name,
        reason: item.routingReason, state,
        status,
        fresh, submittedAt: fresh ? latest?.at : undefined, canonical, reviewable: canonical || fresh, blocked: pack?.gate.result === "FAIL",
        pending: lifecycle?.state === "submitted" || lifecycle?.state === "resubmitted", projected: false,
      };
    });
    for (const lifecycle of Object.values(lifecycles)) {
      if (seeds.some((row) => row.id === lifecycle.caseId) || revisions[lifecycle.caseId]?.at(-1)?.kind === "seed") continue;
      const item = caseForLifecycle(lifecycle.caseId, lifecycles, revisions);
      if (!item) continue;
      const state = caseStates[item.id] ?? item.initialState;
      const pack = agentEnabled ? runAgent(item, { agentEnabled: true }) : null;
      const status = queueStatus(state, agentEnabled, lifecycle, pack);
      const blocked = pack?.gate.result === "FAIL";
      seeds.push({ id: item.id, pharmacy: item.pharmacy.name, reason: item.routingReason, state,
        status, blocked, fresh: true, submittedAt: revisions[item.id]?.at(-1)?.at, canonical: false, reviewable: true,
        pending: lifecycle.state === "submitted" || lifecycle.state === "resubmitted", projected: false });
    }
    return seeds.filter((row) => processes[row.id]?.routing.outcome !== "auto_priced").sort((a, b) => Number(b.fresh) - Number(a.fresh) || (a.fresh && b.fresh
      ? (revisions[b.id]?.at(-1)?.at ?? "").localeCompare(revisions[a.id]?.at(-1)?.at ?? "") : 0));
  }, [caseStates, lifecycles, revisions, agentEnabled, processes]);
  return <div className="mx-auto max-w-7xl space-y-5">
    <header className="space-y-2">
      <SyntheticTag />
      <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2">NHSBSA exception queue</h1>
      <div className="flex items-start gap-2">
        <p className="max-w-3xl text-lg" data-queue-guide>{agentEnabled
          ? "With the agent: the same list. Each item arrives with its case built, its rule cited and a recommendation; the operator only decides."
          : "Today: a list of items that failed a rule. The operator sees a reference and a reason, then gathers everything else by hand."}</p>
        <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" aria-label="Queue evidence and assumptions"><Info className="size-4" /></Button></TooltipTrigger>
          <TooltipContent className="max-w-xs">Public evidence describes failed-rule referrals and operator exception work. The exact unpublished internal queue and this view are plausible assumptions, not established facts.</TooltipContent></Tooltip>
      </div>
      <p className="text-sm text-muted-foreground">Illustrative flow, not every outcome: abstentions still need manual work; rule-cleared items use no model. Generated rows have no case evidence or citations.</p>
    </header>
    <div className="flex flex-wrap items-center gap-3">
      {result ? <QueueCompare key={`compare-${revision}`} result={result} /> : <Button variant="outline" disabled>Compare</Button>}
      {followed && perspective !== "nhsbsa" && <Button asChild variant="link"><Link to={`/pharmacy/claims?caseId=${encodeURIComponent(followed)}`}>Followed claim: {followed}</Link></Button>}
    </div>
    {!result && <p role="alert">Invalid calculator assumptions. Monthly projections and comparison are unavailable; the twelve examples remain readable.</p>}
    <p className="text-sm text-muted-foreground">Actual synthetic staff items only. Monthly projections are not operator rows.</p>
    <QueueMonth key={`table-${revision}-${agentEnabled}`} result={null} seeds={rows} openExample={openExample} />
    {result && <>
      <details className="rounded-lg border p-3" data-queue-month-summary>
        <summary className="cursor-pointer font-medium">Shared monthly assumptions</summary>
        <p className="mt-2 text-sm">Public referral-subset proxy: {n(result.volume)} items, not a measured total queue. {n(result.pharmacyCaught)} pharmacy-caught items stay outside this operator table.</p>
        <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt>Monthly operator hours: Today / With agent</dt><dd>{n(result.today.operatorHours)} / {n(result.withAgent.operatorHours)}</dd></div>
          <div><dt>One-operator capacity: Today / built cases</dt><dd>{n(result.capacity.today)} / {n(result.capacity.withAgent)} items per month</dd></div>
        </dl>
        <p className="mt-2 text-sm">Capacity uses {n(result.capacity.workingMinutes)} working minutes. Built-case capacity is not mixed-cohort throughput. Twelve illustrative seed slots replace model slots, without claiming that their outcome mix represents the month.</p>
      </details>
      <details className="text-sm"><summary className="cursor-pointer underline">Show legacy full-day simulation</summary>
        <QueueDay />
      </details>
      <QueueTodayDialog key={`dialog-${revision}`} selected={selected} close={() => setSelected(null)} result={result}
        restoreFocus={() => (dialogTrigger.current?.isConnected ? dialogTrigger.current : document.querySelector<HTMLElement>("h1[data-tour-heading]"))?.focus({ preventScroll: true })} />
    </>}
  </div>;
}
