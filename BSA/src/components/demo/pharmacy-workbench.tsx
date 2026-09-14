import { useState } from "react";
import { NativeChoiceGroup, NativeChoiceItem } from "@/components/ui/native-radio-group";
import { BoundaryTag, SyntheticTag } from "@/components/demo/labels";
import { EpsPharmacyCapture } from "@/components/demo/eps-pharmacy-capture";
import { PaperPharmacyCapture } from "@/components/demo/paper-pharmacy-capture";
import { PharmacyModelStrip } from "@/components/demo/manual-loop-projection";
import type { ItemChannel } from "@/lib/domain/types";
import { HILLCREST_PHARMACY } from "@/lib/domain/reference";
import { PharmacyReleasedCount } from "./pharmacy-submission-receipt";
import { useLifecycleCase } from "@/hooks/use-lifecycle-case";
import { isPlayableCase } from "@/lib/domain/cases";

export function PharmacySubmissionPanel({ caseId, channel, controls = "correct-and-submit" }: {
  caseId: string; channel?: ItemChannel; controls?: "submit" | "correct-and-submit";
}) {
  const c = useLifecycleCase(caseId);
  if (!isPlayableCase(caseId)) return <p role="status">Background only, not playable.</p>;
  if (!c) return <p role="alert">Unknown pharmacy submission.</p>;
  return (channel ?? (c.channel === "Electronic (EPS)" ? "eps" : "paper")) === "eps"
    ? <EpsPharmacyCapture caseId={caseId} compact controls={controls} />
    : <PaperPharmacyCapture caseId={caseId} compact controls={controls} />;
}

export function PharmacyPage() {
  const [channel, setChannel] = useState<ItemChannel>("eps");
  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="space-y-2">
      <SyntheticTag>Synthetic pharmacy, synthetic prescription, synthetic claim</SyntheticTag>
      <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2">Pharmacy pre-submission check</h1>
      <p className="text-sm font-medium">{HILLCREST_PHARMACY.name} ({HILLCREST_PHARMACY.contractorCode})</p>
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-md border px-2 py-1">Advisory only</span>
        <span className="rounded-md border px-2 py-1" data-scripted-badge>Scripted signal · Not live</span>
        <BoundaryTag cls="human" />
      </div>
    </header>
    <NativeChoiceGroup value={channel} onValueChange={(value) => {
      if (value === "eps" || value === "paper") setChannel(value);
    }} aria-label="Submission channel" className="justify-start">
      <NativeChoiceItem value="eps">EPS</NativeChoiceItem>
      <NativeChoiceItem value="paper">Paper</NativeChoiceItem>
    </NativeChoiceGroup>
    {channel === "eps" ? <EpsPharmacyCapture /> : <PaperPharmacyCapture caseId="EX-24123" />}
    <PharmacyReleasedCount />
    <PharmacyModelStrip />
  </div>;
}
