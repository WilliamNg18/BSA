import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSection } from "@/components/page-section";
import { EvidenceClassTag } from "@/components/demo/labels";
import { BaselineAssumptions } from "@/components/demo/baseline-assumptions";
import { ProcessAssumptions } from "@/components/demo/process-assumptions";
import { ASSUMPTIONS } from "@/lib/domain/content";
import { cn } from "@/lib/utils";

const EFFECT: Record<string, string> = {
  Kills: "bg-rose-700 text-white",
  Reshapes: "bg-amber-700 text-white",
  Intact: "bg-emerald-700 text-white",
};

export function AssumptionsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">The assumptions that decide whether an agent is needed</h1>
        <p className="max-w-3xl text-muted-foreground">
          Validate the premises, evidence access and operational value. Comparable-estate experience is an assumption, not proof of current NHSBSA practice.
        </p>
        <div className="flex flex-wrap gap-2">
          <EvidenceClassTag kind="Publicly supported" />
          <EvidenceClassTag kind="Reasoned assumption" />
          <EvidenceClassTag kind="Synthetic demonstration" />
          <EvidenceClassTag kind="Proposed design decision" />
          <EvidenceClassTag kind="Requires customer validation" />
        </div>
      </div>

      <PageSection title="Shared process assumptions" description="These are the same editable inputs used by the month, process summary and operational views.">
        <ProcessAssumptions />
      </PageSection>
      <details className="space-y-4 rounded-xl border p-5" data-legacy-assumptions>
        <summary className="cursor-pointer font-semibold">Historical referral-only comparison</summary>
        <p className="text-sm text-muted-foreground">Legacy assumptions are retained for the historical comparison only. They do not supply the current whole-process figures.</p>
        <BaselineAssumptions register />
      </details>

      <PageSection title="Register" description="The first four decide whether an agent is genuinely required. The rest decide how it would be built.">
        <ol className="grid gap-4 lg:grid-cols-2">
          {ASSUMPTIONS.map((a) => (
            <li key={a.id}>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold">A{a.id}</span>
                    <Badge className={cn("border-transparent", EFFECT[a.effect])}>If wrong: {a.effect.toLowerCase()}</Badge>
                    <Badge variant="outline">{a.basis}</Badge>
                  </div>
                  <CardTitle className="text-base">{a.statement}</CardTitle>
                  <CardDescription>{a.why}</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-2 text-sm">
                    <div className="rounded-md bg-muted/50 p-2.5">
                      <dt className="text-xs font-medium text-muted-foreground">What supports it</dt>
                      <dd>{a.evidence}</dd>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2.5">
                      <dt className="text-xs font-medium text-muted-foreground">How NHSBSA would validate it</dt>
                      <dd>{a.validate}</dd>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2.5">
                      <dt className="text-xs font-medium text-muted-foreground">If it is wrong</dt>
                      <dd>{a.ifWrong}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection title="How the prototype's own claims are classified" description="Used throughout the interface.">
        <ul className="grid gap-2 grid-cols-2 lg:grid-cols-3">
          {[
            ["Publicly supported", "Published processing context and approximate referral figures. Targets are not achieved performance; submission channels and implementation details need validation."],
            ["Reasoned assumption", "Manual assembly, separate systems, accessible history and integration feasibility require observation and validation."],
            ["Synthetic demonstration", "Every case, prescription, pharmacy, product code, price, reading, confidence signal, metric and record shown here."],
            ["Proposed design decision", "Agent recommends, code validates and calculates, human decides; deterministic gate; structural confidence; abstain below threshold; fail open; one kernel for both surfaces."],
            ["Requires customer validation", "Cost per operator touch; assembly-versus-judgement time split; inter-operator agreement; second-referral rate; the claim-amendment window; what may reach a model."],
          ].map(([k, v]) => (
            <li key={k} className="rounded-md border p-3">
              <EvidenceClassTag kind={k as "Publicly supported"} />
              <p className="mt-2 text-sm text-muted-foreground">{v}</p>
            </li>
          ))}
        </ul>
      </PageSection>
    </div>
  );
}
