import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FastForward, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageSection } from "@/components/page-section";
import { ErrorState } from "@/components/states";
import { CaseHeader } from "@/components/demo/case-header";
import { BoundaryTag, StatusDot } from "@/components/demo/labels";
import { runAgent } from "@/lib/domain/agent";
import { caseById } from "@/lib/domain/cases";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { agentVersionLabel, productionServiceLabel } from "@/lib/service-display";
import { useReducedMotion } from "motion/react";

// The key agentic screen: the observable workflow. Evidence, actions, tool
// results and decision boundaries are shown. No private model reasoning is
// exposed; there is none to expose in this prototype, and in production the
// trace would carry tool calls and structured outputs, not free-text thinking.

export function CaseTracePage() {
  const { id } = useParams();
  const c = caseById(id);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const state = useAppStore((s) => (id ? s.caseStates[id] : undefined));
  const pack = useMemo(() => (c ? runAgent(c, { agentEnabled }) : null), [c, agentEnabled]);
  const [revealed, setRevealed] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    setRevealed(pack ? pack.trace.length : 0);
    setPlaying(false);
  }, [pack]);

  useEffect(() => {
    if (!playing || !pack) return;
    if (revealed >= pack.trace.length) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setRevealed((n) => n + 1), 900);
    return () => window.clearTimeout(t);
  }, [playing, revealed, pack]);

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

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => { setRevealed(reduced ? 1 : 0); setPlaying(!reduced); }}>
          <Play aria-hidden="true" /> Replay step by step
        </Button>
        {reduced && revealed < pack.trace.length && <Button type="button" variant="outline" onClick={() => setRevealed((n) => Math.min(n + 1, pack.trace.length))}>Next step</Button>}
        <Button type="button" variant="outline" onClick={() => { setPlaying(false); setRevealed(pack.trace.length); }}>
          <FastForward aria-hidden="true" /> Show all
        </Button>
        <Button type="button" variant="ghost" onClick={() => { setPlaying(false); setRevealed(0); }}>
          <RotateCcw aria-hidden="true" /> Clear
        </Button>
        <p className="text-sm text-muted-foreground">
          {pack.trace.length} steps · {totalCalls} tool calls · Tariff {pack.tariffLabel} · {pack.agentInvoked ? "agent invoked" : "agent not invoked"}
        </p>
      </div>

      <ol className="space-y-3" aria-label="Agent trace" aria-live="polite">
        {shown.map((step, i) => (
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
                          <TableHead className="text-right">ms</TableHead>
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
      </ol>

      {revealed >= pack.trace.length && (
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
