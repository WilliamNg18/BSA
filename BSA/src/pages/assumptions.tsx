import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSection } from "@/components/page-section";
import { EvidenceClassTag } from "@/components/demo/labels";
import { BaselineAssumptions } from "@/components/demo/baseline-assumptions";
import { ASSUMPTIONS } from "@/lib/domain/content";
import { cn } from "@/lib/utils";

const EFFECT: Record<string, string> = {
  Kills: "bg-rose-700 text-white",
  Reshapes: "bg-amber-600 text-white",
  Intact: "bg-emerald-700 text-white",
};

export function AssumptionsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">The assumptions that decide whether an agent is needed</h1>
        <p className="max-w-3xl text-muted-foreground">
          Each assumption states why it was made, what supports it, how NHSBSA would validate it, what changes if it is wrong, and whether being wrong kills, reshapes or
          leaves the proposition intact. Public means supported by public sources; Experience means my judgement from comparable estates, which stays an assumption until
          NHSBSA's data confirms it.
        </p>
        <div className="flex flex-wrap gap-2">
          <EvidenceClassTag kind="Publicly supported" />
          <EvidenceClassTag kind="Reasoned assumption" />
          <EvidenceClassTag kind="Synthetic demonstration" />
          <EvidenceClassTag kind="Proposed design decision" />
          <EvidenceClassTag kind="Requires customer validation" />
        </div>
      </div>

      <BaselineAssumptions register />

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
        <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["Publicly supported", "NHSBSA processes about 1.1 billion items a year, already scans, reads and prices automatically, routes endorsement and handwritten items to an operator, and samples accuracy monthly against a 99.85 per cent target. Around one million items were referred back in 2024/25 (Community Pharmacy England). Manage Your Service is mandatory for month-end submission and returns referred-back items digitally."],
            ["Reasoned assumption", "Operators assemble evidence by hand from separate systems; the queue tool can surface a recommendation; item-level history exists; the Drug Tariff can be ingested monthly."],
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
