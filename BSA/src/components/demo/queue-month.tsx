import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BoundaryTag } from "./labels";
import { formatBaselineNumber as n, type BaselineResult } from "@/lib/domain/baseline";
import { COHORT_LABELS, QUEUE_ROW_HEIGHT, QUEUE_SEGMENT_SIZE, QUEUE_VIEW_HEIGHT, queueCohort, queueWindow, SWEEP_PHASES } from "@/lib/domain/queue-model";
import { useQueueStore } from "@/lib/queue-store";
import { useAppStore } from "@/lib/store";

export function QueueMonth({ result, openToday, runVisible }: { result: BaselineResult; openToday: (id: string) => void; runVisible: () => void }) {
  const position = useQueueStore((s) => s.position);
  const jump = useQueueStore((s) => s.jump);
  const phase = useQueueStore((s) => s.phase);
  const sweep = useQueueStore((s) => s.sweep);
  const sweeping = useQueueStore((s) => s.sweeping);
  const enabled = useAppStore((s) => s.agentEnabled);
  const [draft, setDraft] = useState("1");
  const viewport = useRef<HTMLDivElement>(null);
  const window = queueWindow(result.volume, position);
  const { current, segmentStart, segmentLength, height, indices } = window;
  // Position is logical, never a billion-row physical spacer. A short trailing
  // viewport lets the last row reach the top so the counter can really show N/N.
  useLayoutEffect(() => {
    const el = viewport.current;
    if (el && Math.floor(el.scrollTop / QUEUE_ROW_HEIGHT) !== current - segmentStart) el.scrollTop = (current - segmentStart) * QUEUE_ROW_HEIGHT;
  }, [current, segmentStart]);
  const valid = /^\d{1,10}$/.test(draft) && Number(draft) >= 1 && Number(draft) <= result.volume;
  return <section aria-label="Virtual month" className="space-y-3 rounded-xl border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">Virtual month</h2><BoundaryTag cls="deterministic" />
    </div>
    <p className="text-sm text-muted-foreground">Synthetic model slots follow calculator assumptions. Pinned examples excluded. No citations or automatic decisions.</p>
    <dl className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
      {[["Volume", result.volume], ["Pharmacy-caught", result.pharmacyCaught], ["Code-cleared", result.cleared], ["Abstained", result.abstained], ["Cases built", result.built], ["Awaiting human", result.built + result.abstained]].map(([label, value]) => <div key={label} className="rounded-lg bg-muted/40 p-3"><dt>{label} · projection</dt><dd className="text-xl font-semibold tabular-nums">{n(Number(value))}</dd></div>)}
    </dl>
    <div className="flex flex-wrap items-end gap-2">
      <div><Label htmlFor="queue-jump">Jump to item</Label><Input id="queue-jump" className="w-40" inputMode="numeric" value={draft} onChange={(e) => setDraft(e.target.value)} aria-invalid={!valid && result.volume > 0} onKeyDown={(e) => { if (e.key === "Enter" && valid) jump(Number(draft) - 1); }} /></div>
      <Button variant="outline" disabled={!valid} onClick={() => jump(Number(draft) - 1)}>Jump to item</Button>
      <Button variant="outline" disabled={!result.volume} onClick={() => jump(0)}>First item</Button>
      <Button variant="outline" disabled={!result.volume} onClick={() => jump(result.volume - 1)}>Last item</Button>
      <Button variant="outline" disabled={segmentStart === 0} onClick={() => jump(segmentStart - QUEUE_SEGMENT_SIZE)}>Previous segment</Button>
      <Button variant="outline" disabled={segmentStart + segmentLength >= result.volume} onClick={() => jump(segmentStart + segmentLength)}>Next segment</Button>
    </div>
    <output aria-live="polite" className="block font-medium tabular-nums" data-queue-counter>{result.volume ? n(current + 1) : "0"} of {n(result.volume)} items</output>
    <dl className="flex flex-wrap gap-4 text-xs text-muted-foreground"><div><dt>Segment</dt><dd>{n(Math.floor(segmentStart / QUEUE_SEGMENT_SIZE) + 1)}</dd></div><div><dt>Positions per segment</dt><dd>1,000 maximum</dd></div><div><dt>Keyboard</dt><dd>Arrows, Page Up/Down, Home/End; jump controls</dd></div></dl>
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled={!enabled || sweeping || !result.volume} onClick={runVisible}>Run visible month sweep</Button>
      <Button variant="outline" disabled={!sweeping} onClick={() => useQueueStore.getState().stepSweep()}>Step month sweep</Button>
      <span role="status">{phase < 0 ? "No sweep" : `${SWEEP_PHASES[phase]} · projection only`}</span>
    </div>
    <div ref={viewport} role="region" aria-label="Month scroll window" tabIndex={0} className="overflow-y-auto rounded-lg border focus-visible:outline-2" style={{ height: QUEUE_VIEW_HEIGHT }}
      onScroll={(e) => jump(segmentStart + Math.min(segmentLength - 1, Math.floor(e.currentTarget.scrollTop / QUEUE_ROW_HEIGHT)))}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        const moves: Record<string, number> = { ArrowDown: current + 1, ArrowUp: current - 1, PageDown: current + 4, PageUp: current - 4, Home: 0, End: result.volume - 1 };
        if (e.key in moves) { e.preventDefault(); jump(Math.max(0, Math.min(result.volume - 1, moves[e.key]))); }
      }}>
      {result.volume === 0 ? <p className="p-4">Zero volume. Pinned examples remain outside projection.</p> :
        <div role="list" aria-label="Month projection rows" className="relative" data-segment-height={height} style={{ height: height + QUEUE_VIEW_HEIGHT - QUEUE_ROW_HEIGHT }}>
          {indices.map((index) => {
            const id = `SYN-Q-${String(index + 1).padStart(10, "0")}`;
            const kind = queueCohort(index, result);
            const selected = enabled && sweep.some((s) => s.key === `month:${index}`);
            return <div key={index} role="listitem" aria-posinset={index + 1} aria-setsize={result.volume} data-month-index={index} data-sweep-kind={kind}
              className="absolute inset-x-0 flex items-center justify-between gap-2 border-b bg-card px-3 text-sm" style={{ top: (index - segmentStart) * QUEUE_ROW_HEIGHT, height: QUEUE_ROW_HEIGHT }}>
              <div className="min-w-0 space-y-1"><div className="font-medium">{n(index + 1)} · {id}</div>
                <div>Generated model example</div>
                <div className="text-xs">{enabled ? COHORT_LABELS[kind] : "Manual evidence work assumed"}</div>
                {selected && <div className="text-xs font-semibold">{SWEEP_PHASES[phase]} · projection only</div>}
              </div>
              <Button size="sm" variant="outline" onClick={() => openToday(id)}>Today</Button>
            </div>;
          })}
        </div>}
    </div>
  </section>;
}