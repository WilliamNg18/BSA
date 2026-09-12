import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, FileSearch, Scale, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompactTooltip as Tooltip, CompactTooltipContent as TooltipContent, CompactTooltipTrigger as TooltipTrigger } from "@/components/ui/compact-tooltip";
import { formatBaselineNumber as n, type MonthModelResult } from "@/lib/domain/baseline";
import { QUEUE_PAGE_SIZE, QUEUE_STATUS_LABELS, queueFilters, queueTableWindow, type QueuePreviewRow, type QueueStatus } from "@/lib/domain/queue-model";
import { useAppStore } from "@/lib/store";
import { useQueueStore } from "@/lib/queue-store";

function Work({ row, enabled }: { row: QueuePreviewRow; enabled: boolean }) {
  if (row.state === "cleared_by_rules") return <span>Cleared by rules; no model call</span>;
  if (row.state === "human_decision_recorded") return <span>Human record unchanged</span>;
  if (!enabled) return <span>nothing yet, operator to gather</span>;
  if (row.blocked) return <span>No recommendation. Gate failed; open evidence.</span>;
  if (row.pending) return <span>Awaiting review; no case built yet</span>;
  if (row.status === "abstained") return <span>Abstained: no recommendation. Operator gathers evidence.</span>;
  if (row.projected || !row.canonical) return <span>Model example only; no evidence or citation</span>;
  const phases = [
    { label: "Gather", detail: "Gather the form, claim and product evidence.", Icon: FileSearch },
    { label: "Retrieve", detail: "Retrieve the dated synthetic provision; inspect the case pack for its citation.", Icon: Search },
    { label: "Reconcile", detail: "Compare sources; conflicting values remain unresolved.", Icon: Scale },
    { label: "Assess", detail: row.status === "evidence" ? "Needs evidence or validation. No decision implied." : "Evidence assessed; a human must judge the recommendation.", Icon: ShieldCheck },
  ];
  return <div className="flex flex-wrap gap-1" aria-label="Agent work phases">
    {phases.map(({ label, detail, Icon }) => <Tooltip key={label}><TooltipTrigger asChild>
      <button type="button" aria-label={label} className="rounded border p-1.5 focus-visible:outline-2"><Icon aria-hidden="true" className="size-4" /></button>
    </TooltipTrigger><TooltipContent className="max-w-xs">{detail}</TooltipContent></Tooltip>)}
  </div>;
}

export function QueueMonth({ result, seeds, openExample }: { result: MonthModelResult | null; seeds: readonly QueuePreviewRow[]; openExample: (id: string) => void }) {
  const enabled = useAppStore((s) => s.agentEnabled);
  const arrive = useAppStore((s) => s.arriveInQueue);
  const position = useQueueStore((s) => s.position);
  const jump = useQueueStore((s) => s.jump);
  const [filter, setFilter] = useState<QueueStatus | "all">("all");
  const [draft, setDraft] = useState("1");
  const [error, setError] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const window = queueTableWindow(result, seeds, enabled, filter, position);
  const freshKey = seeds.filter((row) => row.fresh).map((row) => `${row.id}:${row.submittedAt}:${row.state}:${row.pending}`).join("|");
  const previousFresh = useRef(freshKey);
  useEffect(() => {
    if (freshKey !== previousFresh.current) { previousFresh.current = freshKey; setFilter("all"); jump(0); }
  }, [freshKey, jump]);
  useEffect(() => { viewport.current?.scrollTo({ top: 0 }); }, [window.start, filter]);
  const valid = /^\d{1,10}$/.test(draft) && Number(draft) >= 1 && Number(draft) <= window.total;
  const choose = (value: QueueStatus | "all") => { setFilter(value); jump(0); };
  return <section aria-label="Queue items" className="space-y-3">
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-6" aria-label="Queue status filters">
      {[{ key: "all" as const, label: "All items", count: seeds.length + (result ? Math.max(0, result.built + result.abstained + result.cleared - 12) : 0) },
        ...queueFilters(enabled).map((key) => ({ key, label: QUEUE_STATUS_LABELS[key], count: window.counts[key] }))].map(({ key, label, count }) =>
        <button type="button" key={key} aria-pressed={filter === key} onClick={() => choose(key)}
          className={`min-h-24 rounded-lg border p-3 text-left focus-visible:outline-2 ${filter === key ? "border-teal-700 bg-teal-700 text-white" : "bg-card"}`}>
          <span className="block text-xl font-semibold tabular-nums">{n(count)}</span>
          <span className="text-sm">{label}</span>{filter === key && <span className="mt-1 flex items-center gap-1 text-xs"><Check className="size-3" />Selected</span>}
        </button>)}
    </div>
    {error && <p role="alert">{error}</p>}
    <output aria-live="polite" className="block font-medium tabular-nums" data-queue-counter>showing {window.total ? n(window.start + 1) : "0"} to {n(window.end)} of {n(window.total)} this month{filter !== "all" ? ` · ${QUEUE_STATUS_LABELS[filter]}` : ""}</output>
    {result && result.volume - result.pharmacyCaught < 12 && <p className="text-sm">The twelve examples remain available outside the smaller monthly projection. They do not increase its volume.</p>}
    <div ref={viewport} role="region" aria-label="Exception queue table" tabIndex={0} className="h-[32rem] overflow-auto rounded-lg border focus-visible:outline-2"
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "PageDown" || event.key === "PageUp") {
          event.preventDefault(); jump(Math.max(0, Math.min(window.total - 1, window.start + (event.key === "PageDown" ? QUEUE_PAGE_SIZE : -QUEUE_PAGE_SIZE))));
        }
      }}>
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">Twelve seed examples followed by a bounded synthetic monthly window. Status filters count rows, not decisions made by the agent.</caption>
        <thead className="sticky top-0 z-10 bg-card"><tr>{["Reference", "Pharmacy", "Reason", "State", enabled ? "Agent work" : "Manual work", "Open"].map((label) => <th scope="col" key={label} className="border-b p-3">{label}</th>)}</tr></thead>
        <tbody>{window.rows.map((row) => <tr key={row.id} data-queue-seed={!row.projected ? row.id : undefined} data-shared-case={row.reviewable ? row.id : undefined} data-month-row={row.projected ? row.id : undefined} className="border-b align-top">
          <th scope="row" className="max-w-48 break-words p-3 font-medium">{row.id}{row.fresh && <span className="ml-2 rounded bg-amber-100 px-1 text-xs text-amber-950">New</span>}<span className="block text-xs font-normal text-muted-foreground">{row.projected ? "Projection only" : "Synthetic example"}</span></th>
          <td className="max-w-48 p-3">{row.pharmacy}</td>
          <td className="max-w-64 p-3">{row.reason}</td>
          <td className="max-w-48 p-3" data-queue-state data-recorded-state={row.state}>{row.state === "cleared_by_rules" ? "Cleared by rules; no model call" : QUEUE_STATUS_LABELS[row.status]}{!enabled && row.state === "agent_abstained" && <span className="block text-xs">Known abstention; manual work</span>}{row.pending && <span className="block text-xs">Submitted, awaiting review</span>}</td>
          <td className="max-w-56 p-3"><Work row={row} enabled={enabled} /></td>
          <td className="p-3">{row.reviewable ? row.pending
            ? <Button size="sm" variant="outline" onClick={() => {
              try { arrive(row.id); navigate(`/case/${row.id}`); }
              catch (err) { setError(err instanceof Error ? err.message : "Review unavailable."); }
            }}>Open for review</Button>
            : <Button asChild size="sm" variant="outline"><Link to={`/case/${row.id}`}>Open</Link></Button>
            : <Button size="sm" variant="outline" disabled={!result} onClick={() => openExample(row.id)}>Open</Button>}</td>
        </tr>)}</tbody>
      </table>
      {!window.total && <p role="status" className="p-4">No items in this state. Choose another filter.</p>}
    </div>
    <div className="flex flex-wrap items-end gap-2">
      <Button variant="outline" disabled={!window.start} onClick={() => jump(0)}>First items</Button>
      <Button variant="outline" disabled={!window.start} onClick={() => jump(Math.max(0, window.start - QUEUE_PAGE_SIZE))}>Previous 50</Button>
      <Button variant="outline" disabled={window.end >= window.total} onClick={() => jump(window.end)}>Next 50</Button>
      <Button variant="outline" disabled={!window.total || window.end === window.total} onClick={() => jump(Math.max(0, window.total - QUEUE_PAGE_SIZE))}>Last items</Button>
      <div><Label htmlFor="queue-jump">Jump to item</Label><Input id="queue-jump" className="w-36" inputMode="numeric" value={draft} onChange={(event) => setDraft(event.target.value)} aria-invalid={!valid && window.total > 0} onKeyDown={(event) => { if (event.key === "Enter" && valid) jump(Number(draft) - 1); }} /></div>
      <Button variant="outline" disabled={!valid} onClick={() => jump(Number(draft) - 1)}>Jump</Button>
    </div>
  </section>;
}
