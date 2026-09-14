import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BoundaryTag } from "@/components/demo/labels";
import { ProcessFigure } from "@/components/demo/process-figure";
import { SceneEstimateNumber } from "@/components/demo/scene-estimate-number";
import { useLifecycleCase } from "@/hooks/use-lifecycle-case";
import { useManualLoopMonth } from "@/hooks/use-manual-loop-month";
import { formatProcessHours, formatProcessItems, PROCESS_PUBLIC_FACTS } from "@/lib/domain/baseline";
import { getDemoStep, type DemoStepDefinition } from "@/lib/domain/demo-steps";
import { itemStateLabel } from "@/lib/domain/lifecycle";
import { staffLane } from "@/lib/case-presentation";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export type DemoTaskKind = "submission" | "claim" | "operator" | "type1";
export interface DemoTaskProps {
  kind: DemoTaskKind;
  caseId: string;
  allowCorrection: boolean;
}
export type DemoTaskRenderer = (props: DemoTaskProps) => ReactNode;

const CASE_COMPARISONS: Readonly<Record<number, { today: readonly string[]; assisted: readonly string[] }>> = {
  3: {
    today: ["Pharmacy sends EPS", "priced by NHSBSA's existing rules engine, no person involved"],
    assisted: ["Gate 1: complete fields", "Gate 2: reconciled claim", "released to existing pricing, no operator action"],
  },
  4: {
    today: ["NCSO initials, missing date", "Type 2: experience only", "Referral weeks later (illustrative)"],
    assisted: ["Missing date identified before sending", "Pharmacy applies suggested correction", "Human sends the completed claim"],
  },
  5: {
    today: ["Right format, wrong pack size", "Manual judgement may miss the mismatch", "Pricing or referral is uncertain"],
    assisted: ["Gate 1: format passes", "Gate 2: pack and claimed amount mismatch", "Not released; built case for operator"],
  },
  6: {
    today: ["Readable paper scanned", "Existing rules price the item"],
    assisted: ["Gate 1: declaration checked", "Gate 2: scan reconciled", "released to existing pricing, no operator action"],
  },
  7: {
    today: ["Type 1 keys by eye", "Type 2 judges", "RB2B weeks later (illustrative)"],
    assisted: ["declared by the pharmacy, not read from the form", "Type 1 confirms", "Unreconciled evidence: abstain; never automatic release"],
  },
  8: {
    today: ["Hillcrest staff work only", "Type 1 capture; Type 2 judgement", "experience only"],
    assisted: ["Built case and recommendation", "Apply suggestion, then human decision", "rule and reason recorded"],
  },
  9: {
    today: ["Action needed", "Read RB code; edit unaided", "Resubmit without proposed checks"],
    assisted: ["Operator-approved reason", "Apply suggested correction", "Re-check, then Resubmit"],
  },
  10: {
    today: ["Same paper item throughout", "Pharmacy correction; NHSBSA judgement", "No Reset between sides"],
    assisted: ["Same paper item throughout", "Human confirmation; evidence reconciliation", "Operator decides; shared history retained"],
  },
};

export function DemoComparison({ enabled, today, assisted, activeLabel = "Current mode · Shared operational item" }: { enabled: boolean; today: ReactNode; assisted: ReactNode; activeLabel?: string }) {
  return <div className="grid grid-cols-2 items-start gap-6" data-demo-comparison>
    <section aria-labelledby="demo-today-heading" data-testid="demo-today" data-readonly={enabled} className="min-w-0 space-y-4 rounded-xl border bg-card p-5">
      <div className="border-b pb-3"><h2 id="demo-today-heading" className="text-xl font-semibold">Today</h2>
        <p className="mt-1 text-xs font-medium">{enabled ? "Read-only scenario projection" : activeLabel}</p></div>
      {today}
    </section>
    <section key={enabled ? "on" : "off"} aria-labelledby="demo-assisted-heading" data-testid="demo-assisted" data-readonly={!enabled}
      className={cn("min-w-0 space-y-4 rounded-xl border p-5", enabled
        ? "border-teal-700 bg-card ring-1 ring-teal-700 motion-safe:animate-in motion-safe:slide-in-from-bottom-[6px] motion-safe:duration-[2000ms]"
        : "border-dashed bg-muted text-muted-foreground")}>
      <div className="border-b pb-3"><h2 id="demo-assisted-heading" className="text-xl font-semibold">With the agent</h2>
        <p className="mt-1 text-xs font-medium">{enabled ? activeLabel : "Read-only scenario projection · Agent Off"}</p></div>
      {assisted}
    </section>
  </div>;
}

function ProcessPanel({ assisted }: { assisted: boolean }) {
  const stages = assisted ? [
    ["Pharmacy", "Human sends; Gate 1 checks fields", "agent"],
    ["Gate 2", "Code reconciles evidence and validates", "deterministic"],
    ["Complete", "Existing pricing; no operator action", "existing"],
    ["Uncertain", "Type 1 confirms; Type 2 decides", "human"],
    ["Insufficient", "Operator refers back; pharmacy corrects", "human"],
  ] as const : [
    ["Pharmacy", "EPS message or paper submission", "human"],
    ["Rules engine", "Complete items priced automatically", "existing"],
    ["Type 1", "Uncertain paper keyed by a person", "human"],
    ["Type 2", "Endorsement judgement by a person", "human"],
    ["Referred back", "85,000 items monthly; pharmacy corrects", "human"],
  ] as const;
  return <div className="space-y-4" data-demo-pipeline>
    <ol className="space-y-3">{stages.map(([title, text, cls], index) => <li key={title} className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{index + 1}. {title}</h3><BoundaryTag cls={cls} /></div>
      <p className="mt-2 text-sm">{text}</p>
    </li>)}</ol>
    <p className="text-xs">{assisted ? "Proposed checks, not a live execution." : "Owner-supplied public context; not independently verified here."}</p>
  </div>;
}

function MonthPanel({ assisted, active }: { assisted: boolean; active: boolean }) {
  const { result } = useManualLoopMonth();
  if (!result) return <p role="alert">Estimate unavailable. Exit demo to correct the monthly assumptions.</p>;
  const column = assisted ? result.withAgent : result.today;
  return <div className="space-y-4" data-demo-month>
    <dl className="grid grid-cols-2 gap-3">{([
      ["Referred-back items", column.referredBackItems, formatProcessItems],
      ["Referral-loop operator hours", column.operatorHours, formatProcessHours],
    ] as const).map(([label, value, format]) => <div key={label} className="rounded-lg border bg-background p-4">
      <dt className="text-sm font-medium">{label}{assisted && " (estimate)"}</dt>
      <dd className="mt-3 text-3xl font-semibold tabular-nums"><SceneEstimateNumber value={value} enabled={assisted && active} scenario={result} format={format} /></dd>
    </div>)}</dl>
    <p className="text-sm">Synthetic assumptions, not measured savings. Judgement stays human; only evidence gathering and avoidable referrals change.</p>
    {active ? <details data-demo-control="month-detail" className="rounded-lg border p-3">
      <summary className="cursor-pointer font-medium">Estimate detail and assumptions</summary>
      <MonthDetail />
    </details> : <p className="text-xs">Same monthly assumptions. Detail is available in the current mode.</p>}
  </div>;
}

function MonthDetail() {
  const { input } = useManualLoopMonth();
  return <div className="mt-3 space-y-3 text-sm">
    <ProcessFigure source="Public" label="Monthly referral context" explanation="Owner-supplied public context, not independently verified.">
      {formatProcessItems(PROCESS_PUBLIC_FACTS.monthlyReferrals)} monthly referrals
    </ProcessFigure>
    <p>Assumptions are editable in the ordinary monthly calculator after Exit demo.</p>
    {input && <p>Pharmacy prevention assumption: {input.preventionPercent}%.</p>}
  </div>;
}

function ClosingPanel({ assisted }: { assisted: boolean }) {
  const { input } = useManualLoopMonth();
  return <div className="space-y-4">
    <section className="space-y-2 rounded-lg border p-4"><h3 className="font-semibold">{assisted ? "The principle" : "What stays the same"}</h3>
      <p className="text-sm">{assisted ? "the agent verifies and advises; a person decides. Deterministic code validates. No payment is calculated or approved." : "Existing pricing, payment schedules and human judgement stay unchanged."}</p></section>
    <section className="space-y-2 rounded-lg border p-4"><h3 className="font-semibold">{assisted ? "The central bet" : "The problem"}</h3>
      <p className="text-sm">{assisted ? input ? `Prevent ${input.preventionPercent}% of would-be referrals (assumption). This estimate fails if measured prevention is substantially lower.` : "Estimate unavailable. Correct the monthly assumptions outside demo mode." : "People gather uncertain evidence. Pharmacies correct referred items; only that item's payment is delayed."}</p></section>
    <section className="space-y-2 rounded-lg border p-4"><h3 className="font-semibold">First test</h3>
      <p className="text-sm">{assisted ? "Test referral-reason concentration using two years of item-level history. Proceed, reshape or stop." : "Establish why items return, before proposing a change."}</p></section>
  </div>;
}

function ScenarioProjection({ step, caseId, assisted }: { step: DemoStepDefinition; caseId: string | null; assisted: boolean }) {
  const content = CASE_COMPARISONS[step.number];
  if (!content) return <p role="alert">Scenario comparison unavailable.</p>;
  return <div className="space-y-3" data-demo-projection>
    <p className="text-sm font-semibold">{caseId} · Synthetic scenario, not recorded history</p>
    <ol className="space-y-3">{(assisted ? content.assisted : content.today).map((line) => <li key={line} className="rounded-lg border bg-background p-3 text-sm">{line}</li>)}</ol>
  </div>;
}

function DemoQueue({ caseId, children }: { caseId: string; children: ReactNode }) {
  const lifecycles = useAppStore((s) => s.lifecycles);
  const processes = useAppStore((s) => s.itemProcesses);
  const enabled = useAppStore((s) => s.agentEnabled);
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const rows = Object.values(lifecycles).flatMap((row) => {
    const process = processes[row.caseId];
    const lane = process ? staffLane(row, process) : null;
    return lane ? [{ row, process, lane }] : [];
  });
  return <div className="space-y-4" data-demo-queue>
    <h3 className="font-semibold">Hillcrest · Actual session work</h3>
    <dl className="grid grid-cols-3 gap-2 text-sm">{(["type1", "type2", "referred"] as const).map((lane) => <div key={lane} className="rounded-md border p-2">
      <dt>{lane === "type1" ? "Type 1" : lane === "type2" ? "Type 2" : "Referred back"}</dt><dd className="text-xl font-semibold">{rows.filter((item) => item.lane === lane).length}</dd>
    </div>)}</dl>
    <label className="flex items-center gap-3 text-sm font-medium">Queue filter
      <select data-demo-control="queue-filter" className="rounded-md border bg-background p-2" value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="all">All staff items</option><option value="type1">Type 1</option><option value="type2">Type 2</option><option value="referred">Referred back</option>
      </select>
    </label>
    <div className="max-h-56 overflow-auto rounded-lg border">
      <table className="w-full text-left text-sm"><caption className="sr-only">Hillcrest queue, choose one item</caption>
        <thead className="bg-muted"><tr><th scope="col" className="p-2">Reference</th><th scope="col">State</th><th scope="col" className="p-2">Open</th></tr></thead>
        <tbody>{rows.filter((item) => filter === "all" || item.lane === filter).map(({ row }) => <tr key={row.caseId} className={cn("border-t", row.caseId === caseId && "bg-muted")}>
          <td className="p-2 font-mono text-xs">{row.caseId}</td><td className="py-2">{itemStateLabel(row, "nhsbsa", enabled)}</td>
          <td className="p-2"><Button variant="outline" size="sm" data-demo-control="queue-row" aria-label={`Open ${row.caseId}`} aria-pressed={row.caseId === caseId} onClick={() => {
            useAppStore.getState().followCase(row.caseId);
            navigate(`/case/${encodeURIComponent(row.caseId)}`);
          }}>Open</Button></td>
        </tr>)}</tbody>
      </table>
      {!rows.some((item) => filter === "all" || item.lane === filter) && <p className="p-3 text-sm" role="status">No items match this filter.</p>}
    </div>
    {children}
  </div>;
}

function LiveItem({ step, caseId, kind, renderTask }: { step: DemoStepDefinition; caseId: string; kind: DemoTaskKind; renderTask: DemoTaskRenderer }) {
  const item = useLifecycleCase(caseId);
  const lifecycle = useAppStore((s) => s.lifecycles[caseId]);
  const verification = useAppStore((s) => s.itemVerification[caseId]);
  const process = useAppStore((s) => s.itemProcesses[caseId]);
  const enabled = useAppStore((s) => s.agentEnabled);
  if (!item || !lifecycle || !process) return <p role="alert">Operational item unavailable: {caseId}. No replacement case has been selected.</p>;
  const task = kind === "operator" && process.routing.outcome === "type1_capture" && process.routing.requiresHuman ? "type1" : kind;
  const content = <div className="space-y-4" data-demo-live-case={caseId} data-demo-live-kind={task}>
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{caseId}</h3>
      <p className="text-sm" data-item-state>{itemStateLabel(lifecycle, kind === "operator" ? "nhsbsa" : "pharmacy", enabled)}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="font-medium">Channel</dt><dd>{process.channel === "eps" ? "EPS" : "Paper"}</dd></div>
        <div><dt className="font-medium">Current endorsement</dt><dd>{item.extracted.endorsementText || "None"}</dd></div>
      </dl>
    </div>
    {enabled && verification && <dl aria-label="Recorded verification, not a scenario forecast" className="grid grid-cols-3 gap-2 rounded-lg border p-3 text-sm">
      <div><dt>Gate 1</dt><dd>{verification.gate1 === "none" ? "Not performed" : verification.gate1}</dd></div>
      <div><dt>Gate 2</dt><dd>{verification.gate2 === "none" ? "Not performed" : verification.gate2}</dd></div>
      <div><dt>Reconciliation</dt><dd>{verification.reconciled ? "Agrees" : "Not established"}</dd></div>
    </dl>}
    <div data-demo-control={task === "operator" ? "operator" : task === "type1" ? "type1-capture" : undefined}>
      {renderTask({ kind: task, caseId, allowCorrection: step.number === 4 || step.number === 10 })}
    </div>
    {step.number === 10 && <details data-demo-control="history" className="rounded-lg border p-3">
      <summary className="cursor-pointer font-medium">Same-item history</summary>
      <ol className="mt-3 space-y-2 text-sm">{lifecycle.history.map((event, index) => <li key={`${event.at}-${index}`}>
        <span className="font-medium">{event.actor}</span> · {event.message}
      </li>)}</ol>
    </details>}
  </div>;
  return step.number === 8 ? <DemoQueue caseId={caseId}>{content}</DemoQueue> : content;
}

export function DemoStepLayout({ renderTask }: { renderTask: DemoTaskRenderer }) {
  const number = useAppStore((s) => s.demoStep);
  const enabled = useAppStore((s) => s.agentEnabled);
  const followedId = useAppStore((s) => s.followedCaseId);
  const { pathname, search, hash } = useLocation();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [number, pathname, search, hash]);
  if (number === null) return null;
  const step = getDemoStep(number);
  const routeCase = pathname.startsWith("/case/") ? decodeURIComponent(pathname.slice("/case/".length)) : new URLSearchParams(search).get("case");
  const explicitSide = pathname.startsWith("/case/") ? "operator" : pathname === "/pharmacy/claims" ? "claim" : null;
  const caseId = routeCase && (step.number === 8 || step.number === 10 || routeCase === followedId) ? routeCase : step.caseId;
  const kind: DemoTaskKind = explicitSide ?? (step.number === 8 ? "operator" : step.number === 9 ? "claim" : "submission");
  function panel(assisted: boolean) {
    const active = assisted === enabled;
    if (step.number === 1) return <ProcessPanel assisted={assisted} />;
    if (step.number === 2) return <MonthPanel assisted={assisted} active={active} />;
    if (step.number === 11) return <ClosingPanel assisted={assisted} />;
    return active && caseId
      ? <LiveItem step={step} caseId={caseId} kind={kind} renderTask={renderTask} />
      : <ScenarioProjection step={step} caseId={caseId} assisted={assisted} />;
  }
  return <div className="mx-auto w-full max-w-7xl space-y-5" data-testid="demo-step-screen" data-demo-step={step.number} data-demo-case={caseId ?? undefined}>
    <h1 ref={heading} tabIndex={-1} className="rounded-sm text-3xl font-semibold tracking-tight focus-visible:outline-2">{step.number}. {step.title}</h1>
    <DemoComparison enabled={enabled} today={panel(false)} assisted={panel(true)}
      activeLabel={step.caseId ? undefined : step.number === 2 ? "Current mode · Shared assumptions" : "Current mode · Process illustration"} />
  </div>;
}
