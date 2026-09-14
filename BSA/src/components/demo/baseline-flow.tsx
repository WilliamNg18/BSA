import { useId } from "react";
import { formatBaselineNumber as n, type BaselineResult } from "@/lib/domain/baseline";

export function BaselineFlow({ result }: { result: BaselineResult }) {
  const id = useId();
  const cohorts = [
    { key: "pharmacy", label: "Pharmacy-caught", count: result.pharmacyCaught, colour: "fill-primary" },
    { key: "cleared", label: "Rule-cleared", count: result.cleared, colour: "fill-foreground" },
    { key: "abstained", label: "Abstained", count: result.abstained, colour: "fill-muted-foreground" },
    { key: "built", label: "Built for human review", count: result.built, colour: "fill-primary" },
  ];
  let offset = 0;
  return <figure data-prose="cohort flow" className="min-w-0 rounded-xl border bg-card p-4" aria-labelledby={`${id}-caption`}>
    <figcaption id={`${id}-caption`} className="font-semibold">Scenario flow · Four disjoint cohorts</figcaption>
    <svg viewBox="0 0 640 360" className="mt-3 block h-auto w-full" role="img" aria-labelledby={`${id}-title ${id}-description`} data-baseline-flow>
      <title id={`${id}-title`}>Proportional monthly scenario flow</title>
      <desc id={`${id}-description`}>{n(result.volume)} items split into {cohorts.map((cohort) => `${n(cohort.count)} ${cohort.label}`).join(", ")}. Ribbon thickness represents item count; zero cohorts have no ribbon. Exact counts are listed below.</desc>
      {cohorts.map((cohort, index) => {
        const height = result.volume === 0 ? 0 : cohort.count / result.volume * 240;
        const source = 60 + offset;
        const target = 24 + offset + index * 24;
        offset += height;
        const path = height === 0 ? "" : `M 0 ${source} C 280 ${source} 360 ${target} 640 ${target} L 640 ${target + height} C 360 ${target + height} 280 ${source + height} 0 ${source + height} Z`;
        return <path key={cohort.key} d={path} className={cohort.colour} opacity={index === 0 ? 0.55 : 0.85}
          data-flow={cohort.key} data-count={cohort.count} data-thickness={height} />;
      })}
    </svg>
    <ol className="grid gap-3 text-sm grid-cols-2 lg:grid-cols-4" aria-label="Flow counts in top-to-bottom order">
      {cohorts.map((cohort, index) => <li key={cohort.key} className="min-w-0 rounded-md border p-3"><span className="font-medium">{index + 1}. {cohort.label}</span><p className="mt-1 tabular-nums">{n(cohort.count)} items</p></li>)}
    </ol>
    <p className="mt-3 text-xs text-muted-foreground">Counts sum exactly to {n(result.volume)}. Pharmacy avoidance is count-only; this flow does not measure operator savings.</p>
  </figure>;
}