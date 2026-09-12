import { ArrowDown, FileSearch, Store, UserCheck } from "lucide-react";
import { BoundaryTag } from "@/components/demo/labels";
import type { BoundaryClass } from "@/lib/domain/types";
import { PainMarker } from "./pain-marker";

function Flow({ title, steps }: { title: string; steps: readonly { label: string; cls: BoundaryClass }[] }) {
  return <section className="rounded-xl border bg-card p-5" aria-label={title}>
    <h2 className="mb-4 flex items-center gap-2 font-semibold">{title.includes("Pharmacy") ? <Store className="size-5" aria-hidden="true" /> : <FileSearch className="size-5" aria-hidden="true" />}{title}</h2>
    <ol aria-label={`${title} flow`} className="space-y-2">
      {steps.map((step, index) => <li key={step.label}>
        {index > 0 && <ArrowDown className="mx-auto mb-2 size-4 text-muted-foreground" aria-hidden="true" />}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-3 text-sm"><span>{step.label}</span><BoundaryTag cls={step.cls} /></div>
      </li>)}
    </ol>
  </section>;
}

export function SceneDiagram() {
  return <section className="rounded-xl border bg-card p-5" aria-label="Existing process context">
    <h2 className="mb-4 font-semibold">Existing process context</h2>
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"><span>Capture and field extraction</span><BoundaryTag cls="existing" /></div>
    <ArrowDown className="mx-auto my-3 size-4 text-muted-foreground" aria-hidden="true" />
    <ul aria-label="Alternative processing paths" className="grid gap-3 sm:grid-cols-2">
      <li className="space-y-3 rounded-lg border bg-muted/30 p-3 text-sm"><p className="font-medium">Straightforward items</p><p>Automatic pricing</p><BoundaryTag cls="existing" /></li>
      <li className="space-y-3 rounded-lg border bg-muted/30 p-3 text-sm"><p className="font-medium">Uncertain items</p><p>Operator routing</p><BoundaryTag cls="existing" /><ArrowDown className="size-4" aria-hidden="true" /><p>Unresolved: refer back before payment</p><BoundaryTag cls="human" /></li>
    </ul>
  </section>;
}

export function TwoPlacesDiagram({ enabled }: { enabled: boolean }) {
  return <div className="space-y-4" data-two-places>
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-3 text-sm font-medium">
      <span>Proposed shared service · Agent {enabled ? "On" : "Off"}</span>
      <span className="flex items-center gap-2"><UserCheck className="size-4" aria-hidden="true" />Human decision at both ends</span>
    </div>
    <PainMarker resolved={enabled} pain="Manual evidence gathering" resolution="Proposed shared evidence; human review retained" />
    <div className="grid gap-4 lg:grid-cols-2">
      <Flow title="Pharmacy · Before submission" steps={[
        { label: "Endorsement entry", cls: "human" },
        { label: "Required-field checks", cls: "deterministic" },
        ...(enabled ? [{ label: "Optional sufficiency guidance", cls: "agent" as const }, { label: "Recommendation gate", cls: "deterministic" as const }] : [
          { label: "Locate the relevant monthly rule", cls: "human" as const },
          { label: "Compare each endorsement requirement", cls: "human" as const },
          { label: "Find missing evidence and review uncertainty", cls: "human" as const },
          { label: "Manual review · no agent guidance", cls: "human" as const },
        ]),
        { label: "Correct or continue · never blocked", cls: "human" },
      ]} />
      <Flow title="NHSBSA · After exception routing" steps={[
        { label: "Existing capture and queue", cls: "existing" },
        { label: "Evidence lookups and checks", cls: "deterministic" },
        ...(enabled ? [{ label: "Interpret, recommend or abstain", cls: "agent" as const }, { label: "Compliance gate", cls: "deterministic" as const }] : [
          { label: "Locate the image, claim and product", cls: "human" as const },
          { label: "Find the date-specific rule and history", cls: "human" as const },
          { label: "Compare sources and inspect uncertainty", cls: "human" as const },
          { label: "Manual evidence review · no recommendation", cls: "human" as const },
        ]),
        { label: "Operator decides", cls: "human" },
      ]} />
      <p className="text-sm text-muted-foreground">Fewer gathering steps are proposed, not measured delays. Case D still needs manual review; assistance never removes human judgement or existing pricing.</p>
    </div>
    <Flow title={enabled ? "Assisted referral loop · Less repeat gathering proposed" : "Today referral loop · Repeated manual gathering"} steps={enabled ? [
      { label: "Assemble evidence and propose a specific correction", cls: "agent" },
      { label: "Validate recommendation and draft", cls: "deterministic" },
      { label: "Operator decides and approves the pharmacy note", cls: "human" },
      { label: "Pharmacy reviews, corrects and resubmits", cls: "human" },
      { label: "Validate revised evidence", cls: "deterministic" },
      { label: "Operator re-checks and decides", cls: "human" },
    ] : [
      { label: "Find the image and claim", cls: "human" },
      { label: "Find the product, rule and previous evidence", cls: "human" },
      { label: "Compare evidence and record a referral reason", cls: "human" },
      { label: "Pharmacy reads the reason and finds the rule", cls: "human" },
      { label: "Pharmacy corrects and resubmits", cls: "human" },
      { label: "Gather the revised evidence again", cls: "human" },
      { label: "Validate revised evidence", cls: "deterministic" },
      { label: "Operator re-checks and decides", cls: "human" },
    ]} />
    <details className="rounded-lg border p-3 text-sm">
      <summary className="cursor-pointer font-medium">Implementation and current-state assumptions</summary>
      <p className="mt-3 text-muted-foreground">Shared service: proposed, not deployed. Both screens use local mocks, not models. Existing pharmacy checks and manual practice need validation.</p>
    </details>
  </div>;
}