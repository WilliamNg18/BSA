import { useId } from "react";
import { Button } from "@/components/ui/button";
import { SignalList } from "./signals";
import type { ConcreteSuggestion, ItemRecommendation } from "@/lib/domain/recommendations";
import { cn } from "@/lib/utils";

export interface RecommendationCardProps {
  recommendation: ItemRecommendation;
  onApply?: () => void;
  onFocusField?: (target: ConcreteSuggestion["focusTarget"]) => void;
  applyLabel?: string;
  compact?: boolean;
  className?: string;
}

/** Presentation only: the containing human control owns Apply and error reporting. */
export function RecommendationCard({
  recommendation: r, onApply, onFocusField, applyLabel = "Apply suggested correction", compact = false, className,
}: RecommendationCardProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={cn("space-y-3 rounded-lg border p-4", compact && "p-3", className)} data-recommendation-case={r.caseId}>
      <h3 id={headingId} className="font-semibold">Recommendation</h3>
      <p className="text-sm">{r.authorityLabel}</p>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-muted-foreground">Clause</dt><dd>{r.clause?.title ?? "Unavailable"}</dd></div>
        <div><dt className="text-muted-foreground">Tariff version</dt><dd>{r.versionLabel ?? "Unavailable"}{r.version && ` (${r.version})`}</dd></div>
        <div><dt className="text-muted-foreground">Dispensing date</dt><dd>{r.dispensingDate.split("-").reverse().join("/")}</dd></div>
        <div><dt className="text-muted-foreground">Evidence</dt><dd>{r.context === "recorded" ? "Recorded" : r.context === "draft" ? "Draft" : "Current"} revision {r.revision}</dd></div>
      </dl>
      <div className="text-sm">
        {r.missing.length > 0 && <h4 className="font-medium">Missing or unresolved</h4>}
        <ul aria-label="Requirement results" className="space-y-1">
          {r.requirements.map((entry) => <li key={entry.id}>
            {entry.basis === "declared_format" ? "Declared format: " : entry.basis === "received_source" ? "Received source: " : ""}
            {entry.label}: <strong>{entry.status === "met" ? "Met" : entry.status === "not_met" ? "Not met" : "Not established"}</strong>
          </li>)}
        </ul>
      </div>
      <p className="text-sm font-medium">{r.summary}</p>
      {r.suggestions.length > 0 && <div className="space-y-2 text-sm">
        <h4 className="font-medium">Suggested values</h4>
        {r.suggestions.map((entry) => <div key={entry.field}>
          <dl><dt>{entry.label}</dt><dd>{entry.value !== null ? <strong>{entry.value}</strong> : "Needs human input"}</dd>
            <dt className="text-muted-foreground">Source</dt><dd>{entry.source}</dd></dl>
          {entry.status === "needs-human-input" && onFocusField && <Button type="button" variant="outline" size="sm" onClick={() => onFocusField(entry.focusTarget)}>Enter invoice price</Button>}
        </div>)}
      </div>}
      {r.preview && <div className="space-y-1 text-sm">
        <h4 className="font-medium">Corrected preview</h4>
        <p className="whitespace-pre-wrap break-words font-mono">{r.preview.endorsementText || "No free-text endorsement"}</p>
        {r.preview.epsPrescription?.supplyEvidence && <dl className="grid grid-cols-3 gap-2">
          <div><dt>Brand or manufacturer</dt><dd>{r.preview.epsPrescription.supplyEvidence.brandManufacturer}</dd></div>
          <div><dt>Pack size</dt><dd>{r.preview.epsPrescription.supplyEvidence.packSize}</dd></div>
          <div><dt>Form</dt><dd>{r.preview.epsPrescription.supplyEvidence.form}</dd></div>
        </dl>}
      </div>}
      {r.operatorPreview && r.context === "current" && r.operatorApplyAllowed && <dl className="space-y-1 text-sm">
        <dt className="font-medium">Operator draft preview</dt>
        <dd>{r.operatorPreview.outcome === "ACCEPT" ? "Sufficient" : r.operatorPreview.outcome === "REFER_BACK" ? "Refer back" : "Request information"}</dd>
        {r.operatorPreview.rbCode && <><dt>RB code</dt><dd>{r.operatorPreview.rbCode}</dd></>}
        <dt>Note</dt><dd className="whitespace-pre-wrap">{r.operatorPreview.note}</dd>
      </dl>}
      <dl className="text-sm">
        <dt className="font-medium">Recommended outcome</dt>
        <dd>{r.outcome === "COMPLETE" ? r.operatorApplyAllowed ? "Sufficient recommended" : "Complete" : r.outcome === "REFER_BACK" ? "Refer back" : r.outcome === "REQUEST_INFORMATION" ? "Request information" : "Abstain"}</dd>
        {r.diagnostic && <><dt className="font-medium">Safe human follow-up</dt><dd>{r.diagnostic.provenance === "reconciliation_failed" ? "Reconciliation failed" : "Unverified evidence"}</dd></>}
        <dt>Kernel outcome and gate retained</dt><dd>{r.kernelRecommendation}; {r.kernelGate}</dd>
        <dt>Next step</dt><dd>{r.nextStep}</dd>
        <dt>Source provenance</dt><dd>{r.provenance}</dd>
      </dl>
      {r.operatorApproved && <p className="text-sm">Operator-approved; the agent verified and advised.</p>}
      <SignalList signals={r.signals} compact={compact} />
      {onApply && r.context !== "recorded" && <Button type="button" variant="outline" onClick={onApply}>{applyLabel}</Button>}
    </section>
  );
}
