import { useSearchParams } from "react-router-dom";
import { NativeChoiceGroup, NativeChoiceItem } from "@/components/ui/native-radio-group";
import { BoundaryTag, SyntheticTag } from "@/components/demo/labels";
import { EpsPharmacyCapture } from "@/components/demo/eps-pharmacy-capture";
import { PaperPharmacyCapture } from "@/components/demo/paper-pharmacy-capture";
import { PharmacyModelStrip } from "@/components/demo/manual-loop-projection";
import type { ItemChannel } from "@/lib/domain/types";
import { HILLCREST_PHARMACY } from "@/lib/domain/reference";
import { PharmacyReleasedCount } from "./pharmacy-submission-receipt";
import { useLifecycleCase } from "@/hooks/use-lifecycle-case";
import { isPlayableCase, playableCaseChannel, PLAYABLE_CASES } from "@/lib/domain/cases";
import { EPS_STRENGTH_CASE_ID } from "@/lib/domain/eps-strength";

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
  const [params, setParams] = useSearchParams();
  const requestedCase = params.get("caseId") ?? params.get("case");
  const requestedChannel = params.get("channel");
  const channel = requestedChannel === "eps" || requestedChannel === "paper" ? requestedChannel
    : playableCaseChannel(requestedCase ?? "") ?? "eps";
  const caseId = requestedCase ?? (channel === "paper" ? "EX-24123" : EPS_STRENGTH_CASE_ID);
  const invalidSelection = !isPlayableCase(caseId) || playableCaseChannel(caseId) !== channel ||
    requestedChannel !== null && requestedChannel !== "eps" && requestedChannel !== "paper";
  function select(caseId: string, channel: ItemChannel) {
    const next = new URLSearchParams(params);
    next.delete("caseId");
    next.set("case", caseId);
    next.set("channel", channel);
    setParams(next);
  }
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
    <NativeChoiceGroup value={invalidSelection ? "" : channel} onValueChange={(value) => {
      if (value === "eps" || value === "paper") {
        select(playableCaseChannel(caseId) === value ? caseId : value === "eps" ? EPS_STRENGTH_CASE_ID : "EX-24123", value);
      }
    }} aria-label="Submission channel" className="justify-start">
      <NativeChoiceItem value="eps">EPS</NativeChoiceItem>
      <NativeChoiceItem value="paper">Paper</NativeChoiceItem>
    </NativeChoiceGroup>
    {invalidSelection ? <p role="alert">Unknown or mismatched example. Choose a submission channel to continue.</p>
      : channel === "eps" ? <EpsPharmacyCapture caseId={caseId} onCaseChange={(id) => select(id, "eps")} />
        : <>
          <NativeChoiceGroup value={caseId} onValueChange={(id) => select(id, "paper")} aria-label="Choose a paper scenario" className="justify-start">
            {PLAYABLE_CASES.filter((c) => playableCaseChannel(c.id) === "paper").map((c) =>
              <NativeChoiceItem key={c.id} value={c.id}>{c.id === "EX-24123" ? "Unreadable paper" : "Brand missing on readable paper"}</NativeChoiceItem>)}
          </NativeChoiceGroup>
          <PaperPharmacyCapture key={caseId} caseId={caseId} />
        </>}
    <PharmacyReleasedCount />
    <PharmacyModelStrip />
  </div>;
}
