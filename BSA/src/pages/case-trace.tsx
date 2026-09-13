import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageSection } from "@/components/page-section";
import { ErrorState } from "@/components/states";
import { CaseHeader } from "@/components/demo/case-header";
import { BoundaryTag, StatusDot } from "@/components/demo/labels";
import { runAgent } from "@/lib/domain/agent";
import { useLifecycleCase } from "@/hooks/use-lifecycle-case";
import { LifecycleHistory } from "@/components/demo/lifecycle-history";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { agentVersionLabel, productionServiceLabel } from "@/lib/service-display";
import { CasePlayback, ManualCaseTrace, MissingAssistedSlots } from "@/components/demo/case-presentation";
import { useCasePresentation } from "@/hooks/use-case-presentation";
import { ASSISTED_SLOTS, caseViewState, traceSlotReady } from "@/lib/case-presentation";
import { SignalList } from "@/components/demo/signals";
import { REC_META } from "@/components/demo/label-meta";

// The key agentic screen: the observable workflow. Evidence, actions, tool
// results and decision boundaries are shown. No private model reasoning is
// exposed; there is none to expose in this prototype, and in production the
// trace would carry tool calls and structured outputs, not free-text thinking.

export function CaseTracePage() {
  const { id } = useParams();
  const c = useLifecycleCase(id);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const process = useAppStore((s) => id ? s.itemProcesses[id] : undefined);
  const revision = useAppStore((s) => id ? s.caseRevisions[id]?.at(-1)?.number : undefined);
  const records = useAppStore((s) => s.records);
  const pack = useMemo(() => (c ? runAgent(c, { agentEnabled }) : null), [c, agentEnabled]);
  const state = caseViewState(pack, process?.revision === revision ? process : undefined,
    records.some((record) => record.caseId === id && (record.revision ?? 1) === revision));
  const clock = useCasePresentation(pack?.trace.length ?? 1, false, pack);
  const { revealed } = clock;

  if (!c || !pack || !state) {
    return <ErrorState title="Case not found" description="Choose a case from the exception queue." action={<Button asChild variant="outline"><Link to="/queue">Go to the queue</Link></Button>} />;
  }

  const shown = pack.trace.slice(0, revealed);
  const totalCalls = pack.trace.reduce((a, s) => a + s.toolCalls.length, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <CaseHeader
        c={c}
        state={state}
        title={`How the case was built: ${c.title}`}
        intro="Inspect planned actions, evidence, tool results, deterministic checks and stop conditions. Interpretation is scripted; this trace exposes no private model reasoning."
      />
      <LifecycleHistory id={c.id} />

      {!agentEnabled && <><ManualCaseTrace /><MissingAssistedSlots />
        <Button disabled type="button">Replay unavailable in manual comparison</Button>
      </>}
      {agentEnabled && pack.agentInvoked && <>
        <CasePlayback clock={clock} total={pack.trace.length} />
        <p className="text-sm text-muted-foreground">
          {pack.trace.length} steps · {totalCalls} scripted tool calls · Tariff {pack.tariffLabel} · {pack.agentInvoked ? "agent invoked" : "agent not invoked"} · Current submission evidence
        </p>
        <section aria-label="Case assembly slots" className="grid gap-3 sm:grid-cols-2" aria-live="polite">
          {ASSISTED_SLOTS.map((slot) => <div key={slot} className="rounded-xl border p-4" data-assisted-slot={slot} data-prose={`assembly ${slot}`}>
            <h2 className="mb-2 font-semibold">{slot}</h2>
            {!traceSlotReady(pack, revealed, slot) ? <p className="text-sm text-muted-foreground">{pack.gate.result === "FAIL" ? "Withheld: gate FAIL" : pack.recommendation === "ABSTAIN" ? "Unavailable: abstained" : pack.agentInvoked ? "Not yet assembled" : "Not applicable: no agent call"}</p>
              : slot === "Clause" ? <blockquote className="text-sm">{pack.clause?.text}</blockquote>
              : slot === "Requirements" ? <ul className="space-y-1 text-sm">{pack.requirementResults.map((r) => <li key={r.requirement.id}>{r.requirement.label}: {r.met === true ? "met" : r.met === false ? "not met" : "unknown"}</li>)}</ul>
              : slot === "Alternative" ? <><h3 className="text-sm font-medium">{pack.alternative ? REC_META[pack.alternative.outcome].label : "None"}</h3><p className="text-sm">{pack.alternative?.note}</p></>
              : <SignalList signals={pack.signals} />}
          </div>)}
        </section>
        {pack.recommendation === "ABSTAIN" && <PageSection title="Abstention signals" description="No recommendation. Gate NOT RUN; the unresolved evidence remains visible."><SignalList signals={pack.signals} /></PageSection>}
      </>}
      {agentEnabled && <section data-prose="scripted playback boundary"><p className="text-xs text-muted-foreground">Scripted tool results are illustrative. Playback writes no decision; only the operator's Record decision action changes session history.</p></section>}

      {(agentEnabled || pack.state === "cleared_by_rules") && <ol className="space-y-3" aria-label={pack.agentInvoked ? "Agent trace" : "Deterministic clearance trace"} aria-live="polite">
        {(pack.agentInvoked ? shown : pack.trace).map((step, i) => (
          <li key={`${step.phase}-${i}`}>
            <Card className={cn("border-l-4", step.cls === "agent" ? "border-l-teal-600" : step.cls === "deterministic" ? "border-l-sky-600" : step.cls === "human" ? "border-l-orange-600" : "border-l-slate-500")}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold">{String(i + 1).padStart(2, "0")} {step.phase.replace("_", " ")}</span>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                  <BoundaryTag cls={step.cls} />
                  <StatusDot status={step.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{step.summary}</p>
                {step.items.length > 0 && (
                  <dl className="grid gap-2 text-sm text-muted-foreground" aria-label="Trace evidence and checks">
                    {step.items.map((it, k) => {
                      const text = it.replace(pack.agentVersion, agentVersionLabel(pack.agentVersion));
                      const colon = text.indexOf(":");
                      return <div key={k} className="rounded-md border p-2"><dt className="font-medium">{colon < 0 ? `Finding ${k + 1}` : `${text.slice(0, colon)}: `}</dt><dd>{colon < 0 ? text : text.slice(colon + 1).trim()}</dd></div>;
                    })}
                  </dl>
                )}
                {step.toolCalls.length > 0 && (
                  <div className="overflow-x-auto rounded-md border" role="region" aria-label={`Tool calls in step ${i + 1}`} tabIndex={0}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tool</TableHead>
                          <TableHead>Input</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Evidence</TableHead>
                          <TableHead>Production service</TableHead>
                            <TableHead className="text-right">Synthetic ms</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {step.toolCalls.map((tc, k) => (
                          <TableRow key={k}>
                            <TableCell className="whitespace-normal align-top font-mono text-xs">
                              <div className="flex flex-col gap-1">
                                <span>{tc.tool}</span>
                                <StatusDot status={tc.status} />
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-normal align-top font-mono text-xs text-muted-foreground">
                              {Object.entries(tc.input).map(([k2, v]) => `${k2}=${v ?? "null"}`).join(", ")}
                            </TableCell>
                            <TableCell className="max-w-72 whitespace-normal align-top text-sm">{tc.outputSummary}</TableCell>
                            <TableCell className="whitespace-normal align-top text-xs">{tc.sourceLabel}</TableCell>
                            <TableCell className="whitespace-normal align-top text-xs">
                              <div className="flex flex-col gap-1">
                                <span>{productionServiceLabel(tc.productionService)}</span>
                                <BoundaryTag cls={tc.cls} short className="w-fit" />
                              </div>
                            </TableCell>
                            <TableCell className="align-top text-right tabular-nums text-xs">{tc.durationMs}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>}

      {(!pack.agentInvoked || revealed >= pack.trace.length) && (
        <PageSection title="Where it ends" description="The agent's part is over. The rest is a person.">
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-teal-700 text-white hover:bg-teal-800"><Link to={`/case/${c.id}`}>Open the operator case pack</Link></Button>
            <Button asChild variant="outline"><Link to="/boundary">Why each step is classified as it is</Link></Button>
          </div>
        </PageSection>
      )}
    </div>
  );
}
