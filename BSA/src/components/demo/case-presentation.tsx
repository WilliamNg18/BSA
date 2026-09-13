import { FastForward, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/page-section";
import { BoundaryTag, KeyValue } from "./labels";
import { PainMarker } from "./pain-marker";
import { PrescriptionForm } from "./prescription-form";
import { EpsPrescriptionMessage } from "./eps-prescription-message";
import type { useCasePresentation } from "@/hooks/use-case-presentation";
import { useManualLoopMonth } from "@/hooks/use-manual-loop-month";
import { formatBaselineNumber, GATHERING_STEPS } from "@/lib/domain/baseline";
import { TARIFF_VERSIONS } from "@/lib/domain/tariff";
import { ASSISTED_SLOTS } from "@/lib/case-presentation";
import type { ExceptionCase } from "@/lib/domain/types";
import type { Type1Capture as CaptureReceipt } from "@/lib/domain/lifecycle";
import { paperImageEvidence } from "@/lib/domain/capture-evidence";
import { useAppStore } from "@/lib/store";

export function CasePlayback({ clock, total }: { clock: ReturnType<typeof useCasePresentation>; total: number }) {
  return <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Presentation controls">
    <Button type="button" onClick={clock.replay}><Play aria-hidden="true" />Replay step by step</Button>
    <Button type="button" variant="outline" onClick={clock.toggle} disabled={clock.reduced || clock.revealed >= total}>{clock.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{clock.playing ? "Pause" : "Play"}</Button>
    <Button type="button" variant="outline" onClick={clock.step} disabled={clock.revealed >= total}>Next step</Button>
    <Button type="button" variant="outline" onClick={clock.all}><FastForward aria-hidden="true" />Show all</Button>
    <Button type="button" variant="ghost" onClick={clock.clear}><RotateCcw aria-hidden="true" />Clear</Button>
    <p className="text-xs text-muted-foreground" role="status">{clock.revealed} / {total} · Presentation only · {clock.reduced ? "Step-through" : "Two-second sequence"}</p>
  </div>;
}

export function MissingAssistedSlots({ markers = false }: { markers?: boolean }) {
  return <section className="rounded-xl border bg-muted/30 p-4" aria-label="Assisted fields not recorded">
    <h2 className="mb-2 text-base font-semibold">Assisted fields</h2>
    <p className="mb-3 text-xs text-muted-foreground">Not recorded in this synthetic manual comparison; this does not describe real NHSBSA records.</p>
    <dl className="grid gap-2 sm:grid-cols-2">{ASSISTED_SLOTS.map((slot) => <div key={slot} className="rounded-md border p-3" data-assisted-slot={slot}>
      <dt className="text-sm font-medium">{slot}</dt><dd className="space-y-2 text-sm text-muted-foreground"><span className="block">Not recorded</span>
      {markers && <PainMarker resolved={false} pain={`${slot} not recorded`} resolution="" />}</dd>
    </div>)}</dl>
  </section>;
}

export function ManualCaseTrace() {
  const { input } = useManualLoopMonth();
  return <PageSection title="Manual gathering trace" description="Synthetic manual workflow assumptions, not observed NHSBSA steps or measured timings.">
    <ol aria-label="Manual gathering trace" className="grid gap-3 sm:grid-cols-2">
      {GATHERING_STEPS.map(({ key, label }, index) => <li key={key} className="space-y-2 rounded-xl border p-4" data-manual-step={key}>
        <h3 className="text-sm font-semibold">{index + 1}. {label.replace(" minutes / item", "")}</h3>
        <BoundaryTag cls="human" />
        <p className="flex items-center gap-2 text-sm"><Timer aria-hidden="true" className="size-4" />Part of the referral investigation; not additional time</p>
        <PainMarker resolved={false} pain="Human evidence gathering required" resolution="" />
      </li>)}
    </ol>
    <p className="mt-3 text-sm" data-manual-total>Referral gathering: {input ? `${formatBaselineNumber(input.gatheringMinutesToday)} min / referred-back item` : "Unavailable: correct process inputs"} · Assumption</p>
    <p className="mt-2 text-sm">First judgement: {input ? `${formatBaselineNumber(input.judgingMinutesToday)} minutes / referral-loop item` : "Unavailable"} · Assumption, not the whole-service Type 2 average.</p>
  </PageSection>;
}

export function ManualTariffLookup() {
  return <section className="space-y-2 rounded-xl border p-4" aria-label="Manual Tariff lookup">
    <h2 className="font-semibold">Tariff to look up unaided</h2>
    <BoundaryTag cls="human" />
    <p className="text-sm">Experience only: choose the dispensing-month rule yourself. These synthetic clauses are not an automatically selected recommendation.</p>
    {TARIFF_VERSIONS.map((version) => <details key={version.version} className="rounded-md border p-3">
      <summary className="cursor-pointer font-medium">{version.label} ({version.version})</summary>
      {version.clauses.map((clause) => <section key={clause.id} className="mt-3 space-y-1 text-sm">
        <h3 className="font-semibold">{clause.part}: {clause.title}</h3>
        <p>{clause.text}</p>
      </section>)}
    </details>)}
  </section>;
}

export function CaseSourceEvidence({ c }: { c: ExceptionCase }) {
  const templateCaseId = useAppStore((s) => s.caseRevisions[c.id]?.at(-1)?.templateCaseId);
  if (c.claim.submittedVia === "EPS claim message") return <PageSection title="EPS claim message" description="Electronic claim evidence, synthetic. EPS has no image and never needs Type 1 capture.">
    {c.epsPrescription ? <EpsPrescriptionMessage prescription={c.epsPrescription} /> : <>
    <p className="mb-3 text-sm text-muted-foreground">Original digital prescription not recorded. Only the retained claim fields are shown.</p>
    <dl className="grid gap-2">
      <KeyValue k="Product code in claim" v={c.claim.productCode ?? "Not recorded"} />
      <KeyValue k="Claim quantity" v={c.claim.quantity} />
      <KeyValue k="Claim amount" v={`£${c.claim.amountClaimed.toFixed(2)}`} />
      <KeyValue k="Dispenser endorsement in claim" v={c.claim.endorsementText || "None recorded"} />
    </dl>
    </>}
  </PageSection>;
  return <PageSection title="Prescription image" description={c.imageStyle === "handwritten_poor"
    ? "Image cannot be read. A declaration is not a reading of this form."
    : "Synthetic form evidence. Original image remains unchanged."}>
    <PrescriptionForm c={paperImageEvidence(c, templateCaseId)} highlight={[]} />
  </PageSection>;
}

export function ConfirmedCaptureEvidence({ capture }: { capture: CaptureReceipt }) {
  const provenance = capture.provenance === "pharmacy_declaration"
    ? "declared by the pharmacy, not read from the form"
    : "captured by a person";
  return <PageSection title="Type 1 human confirmation" description="Recorded capture evidence, not a new agent reading or Type 2 decision.">
    <BoundaryTag cls="human" />
    <p className="my-2 text-sm">Revision {capture.revision}: {capture.operator}, <time dateTime={capture.confirmedAt}>{capture.confirmedAt}</time>.</p>
    <dl className="grid gap-2">
      {[
        ["Product code", capture.fields.productCode ?? "Not established"],
        ["Quantity", capture.fields.quantity ?? "Not established"],
        ["Endorsement", capture.fields.endorsementText || "Not established"],
        ["Prescriber", capture.fields.prescriber || "Not established"],
      ].map(([label, value]) => <KeyValue key={label} k={String(label)} v={<>{value}<span className="block text-xs text-muted-foreground">{provenance}</span></>} />)}
      <KeyValue k="Declaration confirmation" v={capture.declarationReconciled ? "Explicitly confirmed by a person; not proof the image was read" : "Not established"} />
    </dl>
  </PageSection>;
}

export function RawCaseFields({ c }: { c: ExceptionCase }) {
  const templateCaseId = useAppStore((s) => s.caseRevisions[c.id]?.at(-1)?.templateCaseId);
  const original = paperImageEvidence(c, templateCaseId).extracted;
  return <div className="grid gap-4 md:grid-cols-2" data-manual-pack>
    <CaseSourceEvidence c={c} />
    <PageSection title="Original machine-captured fields">
      <dl className="grid gap-2">
        <KeyValue k="Product (capture)" v={original.productText} />
        <KeyValue k="Quantity (capture)" v={original.quantity ?? "Unreadable"} />
        <KeyValue k="Endorsement (capture)" v={original.endorsementText || "None"} />
        <KeyValue k="Dispensing date (capture)" v={original.dispensingDate} />
        <KeyValue k="Prescriber (capture)" v={original.prescriber} />
        {c.paperDeclaration && <KeyValue k="Declared dispensing date" v={<>{c.paperDeclaration.dispensingDate}<span className="block text-xs text-muted-foreground">declared by the pharmacy, not read from the form</span></>} />}
        <KeyValue k="Claim quantity" v={c.claim.quantity} />
        <KeyValue k="Claim amount" v={`£${c.claim.amountClaimed.toFixed(2)}`} />
        <KeyValue k="Claim endorsement" v={c.claim.endorsementText || "None"} />
      </dl>
    </PageSection>
  </div>;
}