import { Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageSection } from "@/components/page-section";
import { StatusDot, SyntheticTag } from "@/components/demo/labels";
import { DELIVERY_SEQUENCE, EVAL_BY_CATEGORY, EVAL_METRICS } from "@/lib/domain/content";
import { useAppStore } from "@/lib/store";

export function EvaluationPage() {
  const records = useAppStore((s) => s.records);
  const overrides = records.filter((r) => r.isOverride).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-2">
        <SyntheticTag>Illustrative results on synthetic cases. Not measured against NHSBSA data.</SyntheticTag>
        <h1 className="text-2xl font-semibold tracking-tight">Evaluation and guardrails</h1>
        <p className="max-w-3xl text-muted-foreground">
          How the prototype would be judged before it influenced any live work. The scoreboard below shows the shape of the evidence, with synthetic values.
          In shadow mode every figure is measured against operators' own decisions, per exception category and per print or handwritten slice.
        </p>
      </div>

      <PageSection title="Scoreboard" description="What would be measured, the threshold that gates progress, and where the synthetic run stands.">
        <div className="overflow-x-auto rounded-lg border" role="region" aria-label="Evaluation scoreboard" tabIndex={0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Measure</TableHead>
                <TableHead>Synthetic result</TableHead>
                <TableHead>Threshold to progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EVAL_METRICS.map((m) => (
                <TableRow key={m.metric}>
                  <TableCell className="whitespace-normal align-top font-medium">{m.metric}</TableCell>
                  <TableCell className="whitespace-normal align-top tabular-nums">{m.metric === "Human override rate" ? `${records.length ? Math.round((overrides / records.length) * 100) : 0}% in this session (${overrides} of ${records.length})` : m.value}</TableCell>
                  <TableCell className="whitespace-normal align-top text-sm text-muted-foreground">{m.target}</TableCell>
                  <TableCell className="align-top"><StatusDot status={m.status} label={m.status === "ok" ? "Within threshold" : m.status === "warn" ? "Needs NHSBSA data" : "Below threshold"} /></TableCell>
                  <TableCell className="whitespace-normal align-top text-sm text-muted-foreground">{m.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageSection>

      <PageSection title="Performance by exception category" description="Aggregate numbers hide the slices that matter. Handwritten items abstain more, by design.">
        <div className="overflow-x-auto rounded-lg border" role="region" aria-label="Performance by category" tabIndex={0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Synthetic cases</TableHead>
                <TableHead className="text-right">Agreement with adjudication</TableHead>
                <TableHead className="text-right">Abstention</TableHead>
                <TableHead>Reading</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EVAL_BY_CATEGORY.map((r) => (
                <TableRow key={r.category}>
                  <TableCell className="whitespace-normal font-medium">{r.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.cases}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.agreement}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.abstention}</TableCell>
                  <TableCell className="whitespace-normal text-sm text-muted-foreground">{r.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <PageSection title="Payment-accuracy guardrail" description="Held by design, measured by NHSBSA's existing regime.">
          <Card className="border-emerald-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">PPIA, PPPA, ACV and NCV do not move</CardTitle>
              <CardDescription>The agent never prices and never disposes; the gate withholds any outcome the rule does not permit; a human decides every case. NHSBSA's monthly re-processing sample measures accuracy exactly as it does today. Any deterioration in assisted mode is a stop condition.</CardDescription>
            </CardHeader>
          </Card>
        </PageSection>
        <PageSection title="Go, reshape or stop (illustrative)" description="What these synthetic results would mean if they were real.">
          <Card className="border-amber-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recommendation: reshape, then proceed to shadow mode on one pattern</CardTitle>
              <CardDescription>
                Printed NCSO endorsements would be the first pattern: high agreement, low abstention. Handwritten NCSO items proceed only because the agent abstains rather than guesses. Specials and out-of-pocket expenses fall outside validated coverage and are excluded until the evaluation set covers them. Two NHSBSA inputs are still missing before any go decision: the inter-operator agreement ceiling and the timed handling baseline.
              </CardDescription>
            </CardHeader>
          </Card>
        </PageSection>
      </div>

      <PageSection title="How this becomes evidence, in order" description="Startup speed means testing the highest-risk assumption first, not skipping evaluation or oversight.">
        <ol className="grid gap-2 md:grid-cols-3">
          {DELIVERY_SEQUENCE.map((d) => (
            <li key={d.step} className="rounded-lg border p-3">
              <p className="text-xs font-medium text-teal-800 dark:text-teal-300">Step {d.step} · {d.weeks}</p>
              <p className="font-medium">{d.title}</p>
              <p className="text-sm text-muted-foreground">{d.detail}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-teal-700 text-white hover:bg-teal-800"><Link to="/assumptions">The assumptions this tests</Link></Button>
          <Button asChild variant="outline"><Link to="/notes">Presenter notes and challenge cards</Link></Button>
        </div>
      </PageSection>
    </div>
  );
}
