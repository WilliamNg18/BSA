import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { BoundaryTag, KeyValue } from "./labels";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAppStore } from "@/lib/store";

export function PharmacyTimeline({ caseId, revision }: { caseId: string; revision: number }) {
  const history = useAppStore((state) => state.lifecycles[caseId]?.history);
  const stages = useMemo(() => history?.filter((event) => event.revision === revision) ?? [], [history, revision]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!playing || reduced || index >= stages.length - 1) return;
    const timer = setTimeout(() => setIndex((current) => Math.min(stages.length - 1, current + 1)), 1000);
    return () => clearTimeout(timer);
  }, [playing, reduced, index, stages.length]);
  // A preference change must also discard the play request, not silently resume later.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => { if (media.matches) setPlaying(false); };
    media.addEventListener("change", stop);
    return () => media.removeEventListener("change", stop);
  }, []);
  if (!stages.length) return null;
  const current = stages[Math.min(index, stages.length - 1)];
  return <section aria-labelledby="pharmacy-timeline-title" className="space-y-4 rounded-xl border bg-card p-5" data-pharmacy-timeline>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="pharmacy-timeline-title" className="font-semibold">After submission</h2>
      <BoundaryTag cls="existing" />
    </div>
    <p className="text-sm text-muted-foreground">Recorded synthetic process events only. Playback never advances the claim, creates a referral or calculates a payment.</p>
    <div role="status" aria-live="polite" className="rounded-lg bg-muted p-3 font-medium">{current.at} · {current.message}</div>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => { setPlaying(false); setIndex((current) => Math.min(stages.length - 1, current + 1)); }} disabled={index === stages.length - 1}>Step timeline</Button>
      <Button variant="outline" disabled={reduced || index === stages.length - 1} onClick={() => setPlaying((value) => !value)}>{playing && !reduced && index < stages.length - 1 ? "Pause timeline" : "Play timeline"}</Button>
      <Button variant="outline" disabled={index === stages.length - 1} onClick={() => { setPlaying(false); setIndex(stages.length - 1); }}>Jump to end</Button>
      <Button variant="ghost" disabled={index === 0 && !playing} onClick={() => { setPlaying(false); setIndex(0); }}>Restart timeline</Button>
    </div>
    <ol aria-label="Submission timeline" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {stages.map((stage, position) => <li key={position} aria-current={position === index ? "step" : undefined} className={`rounded-lg border p-3 ${position === index ? "border-teal-700 ring-1 ring-teal-700" : "border-border"}`}>
        <h3 className="font-semibold">{stage.processStep?.replaceAll("_", " ") ?? stage.to.replaceAll("_", " ")}</h3>
        <dl className="mt-2 space-y-1 text-sm"><KeyValue k="Recorded at" v={stage.at} /><KeyValue k="Actor" v={stage.actor} /><KeyValue k="Outcome" v={stage.message} /><KeyValue k="Playback" v={position <= index ? "Shown" : "Pending"} /></dl>
      </li>)}
    </ol>
    <p className="text-sm">Referrals require a human Type 2 decision. MYS Unpaid items and NHSmail are public process context, not connected services here.</p>
  </section>;
}