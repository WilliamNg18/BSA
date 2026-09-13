import { FastForward, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/page-section";
import { BoundaryTag, KeyValue } from "./labels";
import { PainMarker } from "./pain-marker";
import { PrescriptionForm } from "./prescription-form";
import type { useCasePresentation } from "@/hooks/use-case-presentation";
import { useProcessMonth } from "@/hooks/use-process-month";
import { formatBaselineNumber, GATHERING_STEPS } from "@/lib/domain/baseline";
import { TARIFF_VERSIONS } from "@/lib/domain/tariff";
import { ASSISTED_SLOTS } from "@/lib/case-presentation";
import type { ExceptionCase } from "@/lib/domain/types";

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
  const { input } = useProcessMonth();
  return <PageSection title="Manual gathering trace" description="Synthetic manual workflow assumptions, not observed NHSBSA steps or measured timings.">
    <ol aria-label="Manual gathering trace" className="grid gap-3 sm:grid-cols-2">
      {GATHERING_STEPS.map(({ key, label }, index) => <li key={key} className="space-y-2 rounded-xl border p-4" data-manual-step={key}>
        <h3 className="text-sm font-semibold">{index + 1}. {label.replace(" minutes / item", "")}</h3>
        <BoundaryTag cls="human" />
        <p className="flex items-center gap-2 text-sm"><Timer aria-hidden="true" className="size-4" />Part of the referral investigation; not additional time</p>
        <PainMarker resolved={false} pain="Human evidence gathering required" resolution="" />
      </li>)}
    </ol>
    <p className="mt-3 text-sm" data-manual-total>Referral investigation: {input ? `${formatBaselineNumber(input.investigationMinutesToday)} min / referred-back item` : "Unavailable: correct process inputs"} · Assumption</p>
    <p className="mt-2 text-sm">Type 2 stream average: {input ? `${formatBaselineNumber(input.type2SecondsToday)} seconds / item` : "Unavailable"} · Public, separate from the investigation tail.</p>
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

export function RawCaseFields({ c }: { c: ExceptionCase }) {
  return <div className="grid gap-4 md:grid-cols-2" data-manual-pack>
    <PageSection title="Prescription image" description="Synthetic form and existing capture only; no assisted reading."><PrescriptionForm c={c} highlight={[]} /></PageSection>
    <PageSection title="Raw captured fields">
      <dl className="grid gap-2">
        <KeyValue k="Product (capture)" v={c.extracted.productText} />
        <KeyValue k="Quantity (capture)" v={c.extracted.quantity ?? "Unreadable"} />
        <KeyValue k="Endorsement (capture)" v={c.extracted.endorsementText || "None"} />
        <KeyValue k="Dispensing date" v={c.extracted.dispensingDate} />
        <KeyValue k="Prescriber (capture)" v={c.extracted.prescriber} />
        <KeyValue k="Claim quantity" v={c.claim.quantity} />
        <KeyValue k="Claim amount" v={`£${c.claim.amountClaimed.toFixed(2)}`} />
        <KeyValue k="Claim endorsement" v={c.claim.endorsementText || "None"} />
      </dl>
    </PageSection>
  </div>;
}