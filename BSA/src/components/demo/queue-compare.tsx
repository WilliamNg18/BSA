import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BoundaryTag, SyntheticTag } from "./labels";
import { formatBaselineNumber as n, manualGatheringMinutes, type BaselineInputs, type BaselineResult } from "@/lib/domain/baseline";
import { dayClock, projectQueueDay } from "@/lib/domain/queue-model";
import { useQueueStore } from "@/lib/queue-store";

type ComparisonProps = { input: BaselineInputs; result: BaselineResult; day: number };

export function QueueComparison({ input, result, day }: ComparisonProps) {
  const projection = projectQueueDay(input, day);
  const rows = [
    ["Projected operator actions", n(projection.today.processed), n(projection.assisted.processed)],
    ["Gathering minutes", n(projection.today.gathering), n(projection.assisted.gathering)],
    ["Built review minutes", "Included in manual gathering", n(projection.assisted.review)],
    ["Judging minutes", n(projection.today.judging), n(projection.assisted.judging)],
  ];
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2"><SyntheticTag>Model assumptions</SyntheticTag><BoundaryTag cls="deterministic" /><BoundaryTag cls="human" /></div>
    <p className="text-sm">Same scenario, same clock: <strong>{dayClock(day)}</strong>. One operator per projection; opening Compare does not pause or advance the simulation.</p>
    <table className="w-full table-fixed text-left text-sm">
      <caption className="pb-2 text-left text-muted-foreground">Synthetic day projections, not actual decisions or measured performance.</caption>
      <thead><tr>
        <th scope="col" className="p-2">Operator work</th>
        <th scope="col" className="p-2">Today</th>
        <th scope="col" className="p-2">With agent</th>
      </tr></thead>
      <tbody>{rows.map(([label, today, assisted]) => <tr key={label} className="border-t">
        <th scope="row" className="p-2 font-medium">{label}</th>
        <td className="p-2 tabular-nums">{today}</td><td className="p-2 tabular-nums">{assisted}</td>
      </tr>)}</tbody>
    </table>
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div><dt className="font-medium">Shared monthly source volume</dt><dd>{n(result.volume)} items; pinned examples add no volume.</dd></div>
      <div><dt className="font-medium">Operator source cohorts</dt><dd>Today: {n(result.volume)} items. With agent: {n(result.built)} built + {n(result.abstained)} abstained.</dd></div>
      <div><dt className="font-medium">Outside assisted operator work</dt><dd>{n(result.pharmacyCaught)} pharmacy-caught + {n(result.cleared)} code-cleared items in the monthly projection; no operator review.</dd></div>
      <div><dt className="font-medium">With agent at {dayClock(day)}</dt><dd>{n(projection.assisted.built)} built reviewed; {n(projection.assisted.abstained)} handled manually; {n(projection.assisted.awaiting)} awaiting human.</dd></div>
      <div><dt className="font-medium">Shared per-item assumptions</dt><dd>Gathering {n(manualGatheringMinutes(input))} min; built review {n(input.builtReviewMinutes)} min; judging {n(input.judgingMinutes)} min.</dd></div>
      <div><dt className="font-medium">Day capacity assumptions</dt><dd>One 540-minute budget each. Built and abstained share assisted capacity proportionally, rounded down; assembly latency, breaks and referral delays excluded.</dd></div>
    </dl>
    <p className="text-sm text-muted-foreground">Day judging covers projected operator work, not the calculator's fixed reference cohort. Differences are not an additional judging saving.</p>
    <p className="text-sm">Agent gathers evidence and recommends; humans decide. Abstentions stay manual. No decisions, payments or history events are written.</p>
  </div>;
}

export function QueueCompare({ input, result }: Omit<ComparisonProps, "day">) {
  const [open, setOpen] = useState(false);
  const day = useQueueStore((s) => s.day);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (open) heading.current?.focus(); }, [open]);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <>
    <Button ref={trigger} variant="outline" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>Compare</Button>
    <section id={id} hidden={!open} aria-labelledby={`${id}-title`} className="w-full space-y-4 rounded-lg border p-3"
      onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
      <h2 id={`${id}-title`} ref={heading} tabIndex={-1} className="rounded-sm text-xl font-semibold focus-visible:outline-2">Today versus With agent</h2>
      {open && <QueueComparison input={input} result={result} day={day} />}
      <Button variant="outline" onClick={close}>Close comparison</Button>
    </section>
  </>;
}
