import { useState } from "react";
import { NativeChoiceGroup, NativeChoiceItem } from "@/components/ui/native-radio-group";
import { BoundaryTag, SyntheticTag } from "@/components/demo/labels";
import { EpsPharmacyCapture } from "@/components/demo/eps-pharmacy-capture";
import { PaperPharmacyCapture } from "@/components/demo/paper-pharmacy-capture";
import { PharmacyModelStrip } from "@/components/demo/manual-loop-projection";
import type { ItemChannel } from "@/lib/domain/types";
import { HILLCREST_PHARMACY } from "@/lib/domain/reference";

export function PharmacyPage() {
  const [channel, setChannel] = useState<ItemChannel>("eps");
  const [paperCaseId, setPaperCaseId] = useState("EX-24123");
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
    {channel === "eps" ? <EpsPharmacyCapture /> : <div className="space-y-4">
      <NativeChoiceGroup value={paperCaseId} onValueChange={setPaperCaseId} aria-label="Choose a paper scenario" className="flex-wrap justify-start">
        <NativeChoiceItem value="EX-24123">Unreadable form</NativeChoiceItem>
        <NativeChoiceItem value="EX-24112">Complete paper</NativeChoiceItem>
      </NativeChoiceGroup>
      <PaperPharmacyCapture key={paperCaseId} caseId={paperCaseId} />
    </div>}
    <PharmacyModelStrip />
  </div>;
}
