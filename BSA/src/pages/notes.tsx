import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageSection } from "@/components/page-section";
import { CHALLENGE_CARDS, DELIVERY_SEQUENCE, DISCUSSION_PROMPTS, FAILURE_POINTS, NOT_BUILT, SETUP_NOTES, WALKTHROUGH } from "@/lib/domain/content";
import { useAppStore } from "@/lib/store";

export function NotesPage() {
  const setPresenterMode = useAppStore((s) => s.setPresenterMode);
  const setBeat = useAppStore((s) => s.setPresenterBeat);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Presenter notes</h1>
        <p className="max-w-3xl text-muted-foreground">
          The ten-minute walkthrough, the questions and challenge cards for the discussion, the delivery approach, what could go wrong in the room and how to recover, and how to run the prototype.
        </p>
      </div>

      <Tabs defaultValue="walkthrough">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="walkthrough" className="data-[state=active]:bg-teal-700 data-[state=active]:text-white">Ten-minute walkthrough</TabsTrigger>
          <TabsTrigger value="questions" className="data-[state=active]:bg-teal-700 data-[state=active]:text-white">Questions and challenge cards</TabsTrigger>
          <TabsTrigger value="delivery" className="data-[state=active]:bg-teal-700 data-[state=active]:text-white">Delivery approach</TabsTrigger>
          <TabsTrigger value="failure" className="data-[state=active]:bg-teal-700 data-[state=active]:text-white">Failure points and recovery</TabsTrigger>
          <TabsTrigger value="setup" className="data-[state=active]:bg-teal-700 data-[state=active]:text-white">Setup and what is not built</TabsTrigger>
        </TabsList>

        <TabsContent value="walkthrough" className="pt-4">
          <PageSection
            title="Ten minutes, seven beats"
            description="End on the decisions and the evidence needed next, not on 'any questions?'."
            action={
              <Button type="button" className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => { setBeat(0); setPresenterMode(true); }}>
                Start presenter mode
              </Button>
            }
          >
            <ol className="space-y-3">
              {WALKTHROUGH.map((b, i) => (
                <li key={b.time} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-teal-800 dark:text-teal-300">Beat {i + 1} · {b.time}</p>
                    <Button asChild size="sm" variant="outline"><Link to={b.route}>Go to screen</Link></Button>
                  </div>
                  <p className="mt-1 font-semibold">{b.title}</p>
                  <p className="mt-2 text-sm"><span className="font-medium">Say: </span>{b.say}</p>
                  <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Show: </span>{b.show}</p>
                </li>
              ))}
            </ol>
            <div className="rounded-md border-l-4 border-rose-600 bg-rose-50 p-3 text-sm dark:bg-rose-950">
              <p className="font-medium">If the prototype fails live</p>
              <p>"That is the fail-open path you are watching. In production the queue runs exactly as it did before this existed, and nothing is blocked." Switch to the recorded run or continue from the one-pager's build panel. Do not debug live.</p>
            </div>
          </PageSection>
        </TabsContent>

        <TabsContent value="questions" className="pt-4 space-y-8">
          <PageSection title="What to ask in the first fifteen minutes after the demonstration" description="As they would be asked across a table. Each validates the problem, tests an assumption, exposes a constraint, establishes value or moves towards a decision.">
            <ol className="grid gap-2 md:grid-cols-2">
              {DISCUSSION_PROMPTS.map((p, i) => (
                <li key={p.text} className="rounded-md border-l-4 border-teal-600 bg-muted/40 p-3 text-sm"><span className="mr-2 font-semibold text-teal-800 dark:text-teal-300">{i + 1}</span>{p.text}</li>
              ))}
            </ol>
          </PageSection>
          <PageSection title="Challenge cards" description="Likely challenges in the thirty to forty minutes, with a concise, defensible answer.">
            <Accordion type="single" collapsible className="w-full">
              {CHALLENGE_CARDS.map((card, i) => (
                <AccordionItem key={card.q} value={`c-${i}`}>
                  <AccordionTrigger className="text-left">{card.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{card.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </PageSection>
        </TabsContent>

        <TabsContent value="delivery" className="pt-4">
          <PageSection title="Startup speed inside a regulated body" description="Speed comes from testing the highest-risk assumption early, not from skipping security, evaluation or human oversight.">
            <ol className="space-y-2">
              {DELIVERY_SEQUENCE.map((d) => (
                <li key={d.step} className="flex gap-3 rounded-lg border p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-700 font-semibold text-white" aria-hidden="true">{d.step}</span>
                  <div>
                    <p className="font-medium">{d.title} <span className="ml-1 text-xs font-normal text-muted-foreground">{d.weeks}</span></p>
                    <p className="text-sm text-muted-foreground">{d.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="max-w-3xl text-sm text-muted-foreground">
              What NHSBSA owns at the end: the versioned corpus and its ingestion pipeline; the evaluation set and evaluators in their CI; the gate, requirement resolver and pricing tests; infrastructure as code in their landing zone; the runbook and the monthly fail-open drill; operators who labelled the set and can challenge the agent.
            </p>
          </PageSection>
        </TabsContent>

        <TabsContent value="failure" className="pt-4">
          <PageSection title="Likely failure points in the interview, and how to recover">
            <ul className="space-y-2">
              {FAILURE_POINTS.map((f) => (
                <li key={f.risk} className="rounded-lg border p-3">
                  <p className="font-medium">{f.risk}</p>
                  <p className="text-sm text-muted-foreground">{f.recovery}</p>
                </li>
              ))}
            </ul>
          </PageSection>
        </TabsContent>

        <TabsContent value="setup" className="pt-4 space-y-8">
          <PageSection title="Setup and run">
            <ul className="space-y-1.5">
              {SETUP_NOTES.map((n) => <li key={n} className="rounded-md border p-2.5 text-sm">{n}</li>)}
            </ul>
          </PageSection>
          <PageSection title="Deliberately not built">
            <ul className="space-y-1.5">
              {NOT_BUILT.map((n) => <li key={n} className="rounded-md border p-2.5 text-sm">{n}</li>)}
            </ul>
          </PageSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
