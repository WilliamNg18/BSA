import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeRadioGroup, NativeRadioItem } from "@/components/ui/native-radio-group";
import { BoundaryTag } from "@/components/demo/labels";
import { RecommendationCard } from "@/components/demo/recommendation-card";
import { PharmacyConfirmation } from "@/components/demo/pharmacy-confirmation";
import { RawCaseFields } from "@/components/demo/case-presentation";
import { ReleaseRecord } from "@/components/demo/release-record";
import { useLifecycleCase } from "@/hooks/use-lifecycle-case";
import { useItemRecommendation } from "@/hooks/use-item-recommendation";
import { runAgent } from "@/lib/domain/agent";
import { itemStateLabel, type OperatorDecisionDraft } from "@/lib/domain/lifecycle";
import { RB_CODE_CATALOG } from "@/lib/domain/routing";
import type { HumanDecision } from "@/lib/domain/types";
import { getReleaseEligibility, useAppStore } from "@/lib/store";

const OUTCOMES: { value: HumanDecision; label: string }[] = [
  { value: "ACCEPT", label: "Sufficient (human choice)" },
  { value: "REFER_BACK", label: "Refer back" },
  { value: "REQUEST_INFORMATION", label: "Request information" },
  { value: "ESCALATE", label: "Escalate" },
];

export function OperatorActionPanel({ caseId, compact = false, showConfirmation = true }: { caseId: string; compact?: boolean; showConfirmation?: boolean }) {
  const revision = useAppStore((s) => s.caseRevisions[caseId]?.at(-1));
  const reset = useAppStore((s) => s.queue.revision);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  return <OperatorActions key={`${caseId}:${revision?.number}:${reset}:${agentEnabled}`} caseId={caseId} compact={compact} showConfirmation={showConfirmation} />;
}

function OperatorActions({ caseId, compact, showConfirmation }: { caseId: string; compact: boolean; showConfirmation: boolean }) {
  const id = useId();
  const c = useLifecycleCase(caseId);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const revision = useAppStore((s) => s.caseRevisions[caseId]?.at(-1));
  const process = useAppStore((s) => s.itemProcesses[caseId]);
  const lifecycle = useAppStore((s) => s.lifecycles[caseId]);
  const records = useAppStore((s) => s.records);
  const storedDraft = useAppStore((s) => s.operatorDrafts[caseId]);
  const setDraft = useAppStore((s) => s.setOperatorDraft);
  const apply = useAppStore((s) => s.applySuggestionToDecision);
  const release = useAppStore((s) => s.releaseToPricing);
  const referBack = useAppStore((s) => s.referBack);
  const requestInformation = useAppStore((s) => s.requestInformation);
  const recordDecision = useAppStore((s) => s.recordType2Decision);
  const arrive = useAppStore((s) => s.arriveInQueue);
  const pack = useMemo(() => c && agentEnabled ? runAgent(c, { agentEnabled: true }) : null, [c, agentEnabled]);
  const record = records.filter((entry) => entry.caseId === caseId && (entry.revision ?? 1) === revision?.number).at(-1);
  const openReview = process?.routing.outcome === "type2_endorsement" && process.routing.requiresHuman
    && (lifecycle?.state === "in_review" || lifecycle?.state === "escalated");
  const { recommendation, error: recommendationError } = useItemRecommendation(caseId,
    record && !openReview ? { kind: "recorded", revision: record.revision ?? 1, recordId: record.id } : { kind: "current" });
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  if (!c || !revision || !process || !lifecycle || process.revision !== revision.number) {
    return <p role="alert">Current routing unavailable. Reopen the item.</p>;
  }
  const active = process.routing.outcome === "type2_endorsement" && process.routing.requiresHuman;
  if (!active || !["in_review", "escalated", "submitted", "resubmitted"].includes(lifecycle.state)) {
    const event = lifecycle.history.filter((entry) => entry.actor === "operator" && entry.revision === revision.number).at(-1);
    return <section aria-label="Operator decision" className="space-y-2 rounded-xl border p-4">
      <h2 className="font-semibold">Read-only: not awaiting an operator decision</h2>
      {showConfirmation && <PharmacyConfirmation caseId={caseId} />}
      {recommendationError && <p role="alert">{recommendationError}</p>}
      {recommendation && <RecommendationCard recommendation={recommendation} compact={compact} />}
      {compact ? lifecycle.state === "released_to_pricing" ? <ReleaseRecord caseId={caseId} /> : <>
        <p>{itemStateLabel(lifecycle, "nhsbsa", agentEnabled)}</p>
        <dl className="grid gap-2 text-sm">
          <div><dt className="font-medium">Recorded human decision</dt><dd>{record?.decision ?? event?.decision ?? "None"}</dd></div>
          <div><dt className="font-medium">Human reason</dt><dd>{record?.reason ?? event?.reason ?? "Not recorded"}</dd></div>
          <div><dt className="font-medium">Recorded rule</dt><dd>{record?.clauseId ?? event?.clauseId ?? "Not recorded"} · {record?.tariffVersion ?? event?.tariffVersion ?? "Not recorded"}</dd></div>
        </dl>
      </> : <Button asChild variant="outline"><Link to={`/case/${encodeURIComponent(caseId)}/record`}>Open audit record</Link></Button>}
    </section>;
  }

  const reviewing = lifecycle.state === "in_review" || lifecycle.state === "escalated";
  const draft: OperatorDecisionDraft = storedDraft?.revision === revision.number ? storedDraft
    : { revision: revision.number, outcome: null, rbCode: "", note: "", appliedSuggestion: false };
  const eligibility = getReleaseEligibility(caseId);
  const appliedEvent = lifecycle.history.some((event) => event.revision === revision.number && event.processStep === "suggestion_applied" && event.actor === "operator");

  function perform(action: () => void) {
    try { action(); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Action unavailable. Reopen the item."); }
  }
  function change(patch: Partial<Pick<OperatorDecisionDraft, "outcome" | "rbCode" | "note">>) {
    perform(() => setDraft(caseId, { revision: draft.revision, outcome: draft.outcome, rbCode: draft.rbCode, note: draft.note, ...patch }));
  }
  function decide(outcome: HumanDecision) {
    if (draft.note.trim().length < 8) {
      setError(outcome === "REQUEST_INFORMATION" ? "Enter a question of at least eight characters." : "Enter a reason of at least eight characters.");
      return;
    }
    if (outcome === "REFER_BACK" && !draft.rbCode) { setError("Choose an RB code."); return; }
    perform(() => {
      if (outcome === "ACCEPT") release(caseId, draft.note);
      else if (outcome === "REFER_BACK") referBack(caseId, draft.rbCode, draft.note);
      else if (outcome === "REQUEST_INFORMATION") requestInformation(caseId, draft.note);
      else recordDecision({ caseId, decision: "ESCALATE", reason: draft.note });
    });
  }

  return <section aria-label="Operator decision" data-operator-action-panel={caseId} data-compact={compact}
    className="space-y-4 rounded-xl border border-orange-600 bg-card p-4">
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-semibold">Operator decision</h2><BoundaryTag cls="human" />
    </div>
    {showConfirmation && <PharmacyConfirmation caseId={caseId} />}
    {recommendationError && <p role="alert" className="text-sm text-destructive">{recommendationError}</p>}
    {recommendation && <RecommendationCard recommendation={recommendation} compact={compact} applyLabel="Apply suggestion"
      onApply={reviewing && recommendation.operatorApplyAllowed
        ? () => perform(() => { apply(caseId); noteRef.current?.focus(); }) : undefined} />}
    {!agentEnabled && <p className="text-sm">experience only</p>}
    {compact && <details open className="space-y-3 rounded-lg border p-3">
      <summary className="cursor-pointer font-medium focus-visible:outline-2">Evidence and received source</summary>
      <RawCaseFields c={c} compact />
      {pack && <dl className="grid gap-2 text-sm">{pack.evidence.map((evidence) => <div key={evidence.id}>
        <dt className="font-medium">{evidence.field}</dt><dd>{evidence.value}</dd><dd className="text-xs">Source: {evidence.origin}</dd>
      </div>)}</dl>}
    </details>}
    {!reviewing ? <>
      <Button onClick={() => perform(() => arrive(caseId))}>Start review</Button>
      {error && <p ref={errorRef} tabIndex={-1} role="alert">{error}</p>}
    </> : <>
      {appliedEvent && <p className="text-sm" data-suggestion-applied>applied by the operator from the agent&apos;s suggestion</p>}
      <NativeRadioGroup aria-label="Decision" value={draft.outcome ?? ""} onValueChange={(value) => {
        const outcome = OUTCOMES.find((option) => option.value === value)?.value;
        if (outcome) change({ outcome });
      }} className="grid grid-cols-2 gap-2">
        {OUTCOMES.map((outcome) => <div key={outcome.value} className="flex items-center gap-2">
          <NativeRadioItem id={`${id}-${outcome.value}`} value={outcome.value} />
          <Label htmlFor={`${id}-${outcome.value}`}>{outcome.label}</Label>
        </div>)}
      </NativeRadioGroup>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-rb-code`}>RB code (required)</Label>
        <select id={`${id}-rb-code`} name="rb-code" value={draft.rbCode} onChange={(event) => change({ rbCode: event.target.value })}
          aria-required={draft.outcome === "REFER_BACK"} className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
          <option value="">Choose an RB code</option>
          {RB_CODE_CATALOG.map((entry) => <option key={entry.code} value={entry.code}>{entry.code}: {entry.reason}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={compact ? `${id}-reason` : "reason"}>{draft.outcome === "REQUEST_INFORMATION" ? "Question (required)" : "Reason (required)"}</Label>
        <Textarea ref={noteRef} id={compact ? `${id}-reason` : "reason"} name="reason" value={draft.note} minLength={8}
          aria-required="true" aria-describedby={error ? undefined : `${id}-note-help`} autoComplete="off"
          onChange={(event) => change({ note: event.target.value })} />
        {!error && <p id={`${id}-note-help`} className="text-xs text-muted-foreground">At least eight characters.</p>}
      </div>
      {error && <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-md border border-destructive p-2 text-sm focus-visible:outline-2">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={!eligibility.allowed || draft.note.trim().length < 8} aria-describedby={!eligibility.allowed ? `${id}-release-gate` : undefined}
          onClick={() => decide("ACCEPT")}>Release to pricing</Button>
        <Button type="button" variant="outline" onClick={() => decide("REFER_BACK")}>Refer back</Button>
        <Button type="button" variant="outline" onClick={() => decide("REQUEST_INFORMATION")}>Request information</Button>
        <Button type="button" variant="outline" onClick={() => decide("ESCALATE")}>Escalate</Button>
      </div>
      {!eligibility.allowed && <details>
        <summary id={`${id}-release-gate`} className="cursor-pointer text-sm focus-visible:outline-2">Release unavailable: code gate</summary>
        <p className="mt-2 text-sm">{eligibility.reason}</p>
      </details>}
    </>}
  </section>;
}
