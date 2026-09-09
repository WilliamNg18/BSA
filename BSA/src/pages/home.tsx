import { Link } from "react-router-dom";
import { ArrowRight, Ban, ClipboardCheck, FileSearch, Inbox, ListChecks, Scale, Store, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSection } from "@/components/page-section";
import { BoundaryTag, SyntheticTag } from "@/components/demo/labels";
import { runAgent } from "@/lib/domain/agent";
import { CASES, QUEUE_FILLER } from "@/lib/domain/cases";
import { useAppStore } from "@/lib/store";

export function HomePage() {
  const caseStates = useAppStore((s) => s.caseStates);
  const records = useAppStore((s) => s.records);
  const agentEnabled = useAppStore((s) => s.agentEnabled);

  const states = [...CASES.map((c) => caseStates[c.id]), ...QUEUE_FILLER.map((f) => f.state)];
  const count = (k: string) => states.filter((s) => s === k).length;
  const total = states.length;
  const ready = count("agent_review_complete") + count("operator_review_required");
  const moreEvidence = count("additional_evidence_required");
  const abstained = count("agent_abstained");
  const cleared = count("cleared_by_rules");
  const packs = CASES.filter((c) => c.scenario !== "E").map((c) => runAgent(c, { agentEnabled }));
  const avgAssembly = Math.round((packs.reduce((a, p) => a + p.assemblySeconds, 0) / packs.length) * 10) / 10;
  const overrides = records.filter((r) => r.isOverride).length;
  const overrideRate = records.length ? Math.round((overrides / records.length) * 100) : 0;

  const kpis = [
    { label: "Cases in the exception queue", value: String(total), note: "One synthetic working day", icon: Inbox },
    { label: "Ready for operator review", value: String(ready), note: "Case pack built; a person decides", icon: ClipboardCheck },
    { label: "Requiring more evidence", value: String(moreEvidence), note: "Sources disagree; confirmation needed", icon: FileSearch },
    { label: "Agent abstained", value: String(abstained), note: "Handed to the operator as today", icon: Ban },
    { label: "Cleared by rules, no model call", value: String(cleared), note: "Deterministic pre-checks only", icon: ListChecks },
    { label: "Average evidence-assembly time", value: `${avgAssembly}s`, note: "Agent, per case, synthetic. Manual baseline: NHSBSA input needed", icon: Scale },
    { label: "Human override rate", value: `${overrideRate}%`, note: `${overrides} of ${records.length} recorded decisions`, icon: UserCheck },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-3">
        <SyntheticTag>Synthetic demonstration data · an interview navigation surface, not a claim about NHSBSA</SyntheticTag>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">85,000 times a month, a person decides what the machine could not</h1>
        <p className="max-w-3xl text-muted-foreground">
          NHSBSA already reads and prices almost every prescription item automatically. The items it cannot price go to a person, who gathers the
          evidence by hand and judges a pharmacy's note against a rulebook that changes every month. This prototype tests whether a governed agent
          can assemble that case, cite the rule and recommend, while a person still decides.
        </p>
        <p className="rounded-md border-l-4 border-teal-700 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-950 dark:bg-teal-950 dark:text-teal-100">
          The agent gathers evidence and recommends. Deterministic code validates and calculates. A human decides. This prototype does not calculate or approve payments.
        </p>
      </div>

      <PageSection title="Operating overview" description="Counts update as you work cases in the queue. All figures are synthetic and labelled.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <li key={k.label}>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <k.icon className="size-4 text-teal-700" aria-hidden="true" />
                    {k.label}
                  </CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{k.value}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{k.note}</CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection title="Two connected experiences, one agent" description="The same kernel runs at the pharmacy before submission and at NHSBSA after an item enters the exception queue.">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="size-5 text-teal-700" aria-hidden="true" /> Pharmacy pre-submission check
              </CardTitle>
              <CardDescription>
                Before a claim leaves the pharmacy: is an endorsement required, is it complete, and what exactly is missing? Advisory only; it never blocks a submission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-teal-700 text-white hover:bg-teal-800">
                <Link to="/pharmacy">Open the pharmacy check <ArrowRight aria-hidden="true" /></Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Inbox className="size-5 text-teal-700" aria-hidden="true" /> NHSBSA exception queue
              </CardTitle>
              <CardDescription>
                After an item enters the queue: the agent plans, gathers, retrieves the rule for the dispensing date, reconciles, recommends or abstains, and hands a complete case pack to the operator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-teal-700 text-white hover:bg-teal-800">
                <Link to="/queue">Open the exception queue <ArrowRight aria-hidden="true" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageSection>

      <PageSection title="Four demonstration cases" description="Each is constructed to show one behaviour. Case D is built to fail on purpose.">
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {CASES.filter((c) => ["A", "B", "C", "D"].includes(c.scenario)).map((c) => (
            <li key={c.id}>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardDescription>Case {c.scenario} · {c.id}</CardDescription>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{c.purpose}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/case/${c.id}`}>Open case pack</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection title="Who does what" description="Every action in this prototype is classified as one of four things. The full list is on the Boundary page.">
        <div className="flex flex-wrap gap-2">
          <BoundaryTag cls="existing" />
          <BoundaryTag cls="deterministic" />
          <BoundaryTag cls="agent" />
          <BoundaryTag cls="human" />
        </div>
      </PageSection>
    </div>
  );
}
