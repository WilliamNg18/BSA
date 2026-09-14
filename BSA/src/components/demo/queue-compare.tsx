import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "./labels";
import { formatBaselineNumber as n, type MonthModelResult } from "@/lib/domain/baseline";
import { projectQueueComparison, queueCitationAvailable } from "@/lib/domain/queue-model";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAppStore } from "@/lib/store";
import { PLAYABLE_CASE_IDS } from "@/lib/domain/cases";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { CompactTooltip as Tooltip, CompactTooltipContent as TooltipContent, CompactTooltipTrigger as TooltipTrigger } from "@/components/ui/compact-tooltip";

export function QueueComparison({ result, elapsed }: { result: MonthModelResult; elapsed: number }) {
  const states = useAppStore((s) => s.caseStates);
  const lifecycles = useAppStore((s) => s.lifecycles);
  const revisions = useAppStore((s) => s.caseRevisions);
  const recorded = Object.keys(states).filter((id) => states[id] === "human_decision_recorded");
  const citedIds = useMemo(() => PLAYABLE_CASE_IDS.filter((id) => {
    const current = caseForLifecycle(id, lifecycles, revisions);
    return current !== null && queueCitationAvailable(current);
  }), [lifecycles, revisions]);
  return <div className="grid gap-4 grid-cols-2" data-comparison-columns>
    {[false, true].map((assisted) => {
      const projection = projectQueueComparison(result, elapsed, assisted, recorded, citedIds);
      return <section key={String(assisted)} aria-label={assisted ? "With agent comparison" : "Today comparison"} className="min-w-0 space-y-3 rounded-lg border bg-card p-3">
        <h3 className="text-lg font-semibold">{assisted ? "With agent" : "Today"}</h3>
        <dl className="grid grid-cols-3 gap-2 text-sm" data-comparison-summary={assisted ? "assisted" : "today"}>
          {[["Projected operator minutes", n(projection.operatorMinutes)], ["Projected items decided", n(projection.decided)], ["Projected decisions with rule cited", n(projection.cited)]].map(([label, value]) =>
            <div key={label}><dt>{label}</dt><dd className="text-xl font-semibold tabular-nums">{value}</dd></div>)}
        </dl>
        <ol aria-label={assisted ? "With agent twelve examples" : "Today twelve examples"} className="space-y-2">
          {projection.rows.map((row) => <li key={row.id} data-compare-seed={row.id} className={`rounded border p-2 text-sm ${row.done ? "border-teal-700" : ""}`}>
            <span className="font-medium">{row.label} · {row.id}</span>
            <p>{row.phase}</p>
            {row.kind === "abstained" && <p className="text-xs">Manual fallback; never case-ready</p>}
            <p className="text-xs text-muted-foreground">Gathering {n(row.gathering)} min · Judging {n(row.judging)} min</p>
            {row.cited && <p className="text-xs">Validated synthetic rule available; citation use projected</p>}
          </li>)}
        </ol>
      </section>;
    })}
  </div>;
}

export function QueueCompare({ result }: { result: MonthModelResult }) {
  const [open, setOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (open) heading.current?.focus(); }, [open]);
  useEffect(() => {
    if (target === null || reduced || !open) return;
    const timer = window.setInterval(() => setElapsed((value) => Math.min(target, value + 3)), 500);
    return () => window.clearInterval(timer);
  }, [target, reduced, open]);
  useEffect(() => { if (target !== null && elapsed >= target || reduced) setTarget(null); }, [elapsed, target, reduced]);
  const close = () => { setOpen(false); setTarget(null); trigger.current?.focus(); };
  const run = (end: number) => {
    if (reduced) { setElapsed(end); setTarget(null); }
    else setTarget(end);
  };
  return <>
    <Button ref={trigger} variant="outline" aria-expanded={open} aria-controls={id} onClick={() => open ? close() : setOpen(true)}>Compare</Button>
    <section id={id} hidden={!open} aria-labelledby={`${id}-title`} className="w-full space-y-4 rounded-lg border p-3"
      onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
      <h2 id={`${id}-title`} ref={heading} tabIndex={-1} className="rounded-sm text-xl font-semibold focus-visible:outline-2">Today versus With agent</h2>
      {open && <>
        <BoundaryTag cls="human" />
        <p className="text-sm">Same twelve examples, one operator on each side. Every decision and citation-use counter is a projection, never a lifecycle write. Historical records and code-only clearances are not new human decisions.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={elapsed >= 360 || target !== null} onClick={() => run(Math.min(360, elapsed + 60))}>Run one hour</Button>
          <Button variant="outline" disabled={elapsed >= 360 || target !== null} onClick={() => run(360)}>Run to end of day</Button>
          <Button variant="outline" disabled={target === null} onClick={() => setTarget(null)}>Pause</Button>
          <Button variant="outline" onClick={() => { setTarget(null); setElapsed(0); }}>Restart</Button>
        </div>
        <output aria-live="polite" data-comparison-clock className="block font-semibold">{n(elapsed)} synthetic minutes · {target === null ? "Stopped" : "Running"}</output>
        <p className="text-sm text-muted-foreground">{reduced ? "Reduced motion: controls show the result immediately, without playback." : "One hour plays in ten seconds then stops. The end of day is six working hours."} Today {n(result.perItem.today.gatheringMinutes + result.perItem.today.judgingMinutes)} minutes per item; built-case judging {n(result.perItem.withAgent.judgingMinutes)} minutes. Abstentions keep the full Today cost.</p>
        <QueueComparison result={result} elapsed={elapsed} />
        <Tooltip><TooltipTrigger asChild><Button variant="link" className="h-auto whitespace-normal p-0 text-left">How projected citations are counted</Button></TooltipTrigger>
          <TooltipContent className="max-w-xs">Citation use is an assumption for both operators, not measured current practice. Count a canonical validated rule only after gathering and judging finish. No citations for fillers, abstentions, rule-clear rows or historical decisions.</TooltipContent></Tooltip>
        <p className="text-sm text-muted-foreground">Both operators can cite the same validated synthetic rules after completing their work. This twelve-item illustration is not monthly throughput.</p>
      </>}
      <Button variant="outline" onClick={close}>Close comparison</Button>
    </section>
  </>;
}
