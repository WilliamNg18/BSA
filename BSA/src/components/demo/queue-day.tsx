import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BoundaryTag, SyntheticTag } from "./labels";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useQueueStore } from "@/lib/queue-store";
import { useAppStore } from "@/lib/store";
import { formatBaselineNumber as n, manualGatheringMinutes, type BaselineInputs } from "@/lib/domain/baseline";
import { dayClock, projectQueueDay, projectSeedDay } from "@/lib/domain/queue-model";
import { useBaselineScenario } from "@/hooks/use-baseline-scenario";

export function QueueDay() {
  const { input } = useBaselineScenario();
  return input ? <LegacyQueueDay input={input} /> : <p role="alert">Invalid legacy day assumptions.</p>;
}

function LegacyQueueDay({ input }: { input: BaselineInputs }) {
  const day = useQueueStore((s) => s.day), playing = useQueueStore((s) => s.playing);
  const setDay = useQueueStore((s) => s.setDay), play = useQueueStore((s) => s.play);
  const states = useAppStore((s) => s.caseStates);
  const enabled = useAppStore((s) => s.agentEnabled);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!playing || reduced) return;
    const timer = window.setInterval(() => useQueueStore.getState().tickDay(), 250);
    return () => window.clearInterval(timer);
  }, [playing, reduced]);
  useEffect(() => { if (reduced) useQueueStore.getState().play(false); }, [reduced]);
  const projection = projectQueueDay(input, day);
  const recorded = Object.keys(states).filter((id) => states[id] === "human_decision_recorded");
  return <section aria-label="Working day simulation" className="space-y-4 rounded-xl border bg-card p-4">
    <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold">Simulate a day</h2><SyntheticTag>Model assumptions · 08:00 to 17:00</SyntheticTag><BoundaryTag cls="human" /></div>
    <p className="text-sm text-muted-foreground">Legacy nine-hour model: separate raw gathering weights and built-review cost, not the new Today 12-minute assumption. Use Compare above for the current six-hour working day and shared monthly times. Projected actions never change history.{reduced ? " Reduced motion: paused step-through; Step or Jump shows the summary." : " Pause, Step or Jump to inspect progress."}</p>
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => play(!playing)} disabled={reduced || day === 540}>{playing ? "Pause day" : "Play day"}</Button>
      <Button variant="outline" disabled={day === 540} onClick={() => setDay(day + 15)}>Step 15 minutes</Button>
      <Button variant="outline" onClick={() => setDay(540)}>Jump to 17:00</Button>
      <Button variant="outline" onClick={() => setDay(0)}>Restart day</Button>
      <output aria-live="polite" aria-label="Shared day clock" className="rounded-md bg-muted px-3 py-2 text-xl font-semibold tabular-nums">{dayClock(day)}</output>
    </div>
    <details><summary className="cursor-pointer font-medium">Day assumptions and capacity</summary>
      <dl className="grid gap-3 pt-2 text-sm sm:grid-cols-2">
        {[["Gathering / built review / judging", `${n(manualGatheringMinutes(input))} / ${n(input.builtReviewMinutes)} / ${n(input.judgingMinutes)} minutes; shared calculator inputs`],
          ["Today capacity", "min(volume, floor(540 / (gathering + judging))); zero-cost work stays volume-capped"],
          ["Assisted capacity", "Built and abstained share one 540-minute budget proportionally; rounded down. Code-cleared items receive no review."],
          ["Judging comparison", "Calculator: constant full reference cohort. Day: projected operator work only. Different denominators, not an extra calculator saving."],
          ["Arrivals", "Pharmacy-caught and code-cleared cohorts arrive evenly across nine hours; no operator work."],
          ["Excluded assumptions", "Assembly latency, breaks, referral delays and concurrency. Requires validation, not measured performance."],
        ].map(([label, value]) => <div key={label}><dt className="font-medium">{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </details>
    <div className="grid gap-4 min-[1280px]:grid-cols-2" data-day-columns>
      {[false, true].map((assisted) => {
        const seeds = projectSeedDay(input, day, assisted, recorded);
        const active = assisted === enabled;
        return <section key={String(assisted)} aria-label={assisted ? "With agent day comparison" : "Today day comparison"} className={`min-w-0 space-y-3 rounded-lg border p-3 ${active ? "border-teal-600" : ""}`}>
          <h3 className="font-semibold">{assisted ? "With agent · projection" : "Today · manual projection"}{active ? " · selected" : ""}</h3>
          <p className="text-xs text-muted-foreground">Same twelve examples, same order. Independent illustration, not extra monthly volume. Existing code and historical records remain unchanged.</p>
          <ol className="space-y-2" aria-label={assisted ? "Assisted twelve examples" : "Today twelve examples"}>
            {seeds.map((seed) => <li key={seed.id} data-day-seed={seed.id} className="rounded-md bg-muted/40 p-2 text-xs">
              <div className="font-semibold">{seed.label} · {seed.id}</div>
              <div>{seed.phase}</div>
              <div>{assisted && seed.kind === "built" ? "Review" : "Gathering"}: {n(seed.gather)} min · Judging: {n(seed.judge)} min</div>
              {seed.kind === "abstained" && <div>Manual fallback; never case-ready</div>}
            </li>)}
          </ol>
          <dl className="grid grid-cols-2 gap-2 text-sm" data-day-summary={assisted ? "assisted" : "today"}>
            {(assisted ? [
              ["Projected operator actions", projection.assisted.processed], ["Built reviewed", projection.assisted.built],
              ["Abstained handled manually", projection.assisted.abstained], ["Code-cleared; no review", projection.assisted.cleared],
              ["Pharmacy-caught; outside queue", projection.assisted.pharmacy], ["Awaiting human", projection.assisted.awaiting],
              ["Gathering minutes", projection.assisted.gathering], ["Review minutes", projection.assisted.review], ["Judging minutes", projection.assisted.judging],
            ] : [["Projected operator actions", projection.today.processed], ["Gathering minutes", projection.today.gathering], ["Judging minutes", projection.today.judging]]).map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="font-semibold tabular-nums">{n(Number(value))}</dd></div>)}
          </dl>
        </section>;
      })}
    </div>
    <output aria-live="polite" className="block text-sm">{day === 540 ? "End-of-day projection" : "Day projection"} · {dayClock(day)} · No actual decisions, payments or history events written.</output>
  </section>;
}