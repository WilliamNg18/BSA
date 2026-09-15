import { useId } from "react";
import { Button } from "@/components/ui/button";
import { SignalList } from "./signals";
import type { ConcreteSuggestion, ItemRecommendation } from "@/lib/domain/recommendations";
import { cn } from "@/lib/utils";
import { recommendationForAudience, type RecommendationAudience } from "@/lib/domain/recommendation-audience";

export interface RecommendationCardProps {
  recommendation: ItemRecommendation;
  audience?: RecommendationAudience;
  onApply?: () => void;
  onFocusField?: (target: ConcreteSuggestion["focusTarget"]) => void;
  applyLabel?: string;
  pharmacyAction?: "apply-correction";
  compact?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

/** Presentation only: the containing human control owns Apply and error reporting. */
export function RecommendationCard({
  recommendation, audience = "operator", onApply, onFocusField, applyLabel, pharmacyAction, compact = false, headingLevel = 3, className,
}: RecommendationCardProps) {
  const r = recommendationForAudience(recommendation, audience);
  const pharmacy = r.audience === "pharmacy";
  const suggestions = r.suggestions.filter((entry) => entry.field !== "selected_pack_matches" || !r.strength?.suggestion);
  const headingId = useId();
  const Heading = headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : "h4";
  const Subheading = headingLevel === 2 ? "h3" : headingLevel === 3 ? "h4" : "h5";
  return (
    <section aria-labelledby={headingId} className={cn("space-y-3 rounded-lg border p-4", compact && "p-3", className)} data-recommendation-case={r.caseId} data-recommendation-audience={r.audience}>
      <Heading id={headingId} className="font-semibold">Recommendation</Heading>
      {r.operatorApproved && <p className="text-sm">Operator-approved; the agent verified and advised.</p>}
      <p className="text-sm">{r.authorityLabel}</p>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-muted-foreground">Clause</dt><dd>{r.clause?.title ?? "Unavailable"}</dd></div>
        <div><dt className="text-muted-foreground">Tariff version</dt><dd>{r.versionLabel ?? "Unavailable"}{r.version && ` (${r.version})`}</dd></div>
        <div><dt className="text-muted-foreground">Dispensing date</dt><dd>{r.dispensingDate.split("-").reverse().join("/")}</dd></div>
        <div><dt className="text-muted-foreground">Evidence</dt><dd>{r.context === "recorded" ? "Recorded" : r.context === "draft" ? "Draft" : "Current"} revision {r.revision}</dd></div>
        {r.context === "recorded" && <div><dt>Assessment basis</dt><dd>Read-only reassessment of recorded sources, not a historical agent action.</dd></div>}
      </dl>
      {r.strength && <div className="space-y-2 text-sm" aria-label="Prescription, selection and supply facts">
        <Subheading className="font-medium">Read-only source facts</Subheading>
        <dl className="grid grid-cols-3 gap-2">
          {[["Prescribed", r.strength.prescribed], ["Selected in claim", r.strength.selected], ["Supplied record", r.strength.supplied]].map(([label, pack]) =>
            <div key={String(label)}><dt>{String(label)}</dt><dd>{typeof pack === "object" && pack ? `${pack.name}, ${pack.packSize}` : "Not established"}</dd></div>)}
        </dl>
        <dl><dt>{r.strength.ruleLabel}</dt><dd>{r.strength.rule}</dd><dt>Source comparison</dt><dd>{r.strength.gap}</dd></dl>
      </div>}
      <div className="text-sm">
        {r.missing.length > 0 && <Subheading className="font-medium">Missing or unresolved</Subheading>}
        <ul aria-label="Requirement results" className="space-y-1">
          {r.requirements.map((entry) => <li key={entry.id}>
            {entry.basis === "declared_format" ? "Declared format: " : entry.basis === "received_source" ? "Received source: " : ""}
            {entry.label}: <strong>{entry.status === "met" ? "Met" : entry.status === "not_met" ? "Not met" : "Not established"}</strong>
          </li>)}
        </ul>
      </div>
      <p className="text-sm font-medium">{r.summary}</p>
      {pharmacy && (r.suggestions.length > 0 || r.preview || r.strength?.suggestion) && <p className="text-sm font-medium">{r.suggestionLabel}</p>}
      {pharmacy && r.strength?.suggestion && <div className="space-y-1 text-sm">
        <Subheading className="font-medium">Suggested pack</Subheading>
        <p>{r.strength.suggestion.label}</p>
        <Subheading className="font-medium">Corrected claim line preview</Subheading>
        <p className="font-mono">{r.strength.suggestion.claimLinePreview}</p>
      </div>}
      {pharmacy && suggestions.length > 0 && <div className="space-y-2 text-sm">
        <Subheading className="font-medium">Suggested values</Subheading>
        {suggestions.map((entry) => <div key={entry.field}>
          <dl><dt>{entry.label}</dt><dd>{entry.value !== null ? <strong>{entry.value}</strong> : "Needs human input"}</dd>
            <dt className="text-muted-foreground">Source</dt><dd>{entry.source}</dd></dl>
          {entry.status === "needs-human-input" && onFocusField && <Button type="button" variant="outline" size="sm"
            data-pharmacy-action={pharmacyAction ? "invoice-focus" : undefined} onClick={() => onFocusField(entry.focusTarget)}>Enter invoice price</Button>}
        </div>)}
      </div>}
      {pharmacy && r.preview && <div className="space-y-1 text-sm">
        <Subheading className="font-medium">Corrected preview</Subheading>
        <p className="whitespace-pre-wrap break-words font-mono">{r.preview.endorsementText || "No free-text endorsement"}</p>
        {r.preview.epsPrescription?.supplyEvidence && <dl className="grid grid-cols-3 gap-2">
          <div><dt>Brand or manufacturer</dt><dd>{r.preview.epsPrescription.supplyEvidence.brandManufacturer}</dd></div>
          <div><dt>Pack size</dt><dd>{r.preview.epsPrescription.supplyEvidence.packSize}</dd></div>
          <div><dt>Form</dt><dd>{r.preview.epsPrescription.supplyEvidence.form}</dd></div>
        </dl>}
        {r.preview.paperDeclaration && <dl className="grid grid-cols-3 gap-2">
          <div><dt>Product</dt><dd>{r.preview.paperDeclaration.typedProduct}</dd></div>
          <div><dt>Quantity</dt><dd>{r.preview.paperDeclaration.quantity ?? "Not established"}</dd></div>
          <div><dt>Brand or manufacturer</dt><dd>{r.preview.paperDeclaration.brandManufacturer || "Not established"}</dd></div>
          <div><dt>Pack size</dt><dd>{r.preview.paperDeclaration.packSize ?? "Not established"}</dd></div>
          <div><dt>Form</dt><dd>{r.preview.paperDeclaration.form || "Not established"}</dd></div>
          <div><dt>Dispensing date</dt><dd>{r.preview.paperDeclaration.dispensingDate}</dd></div>
        </dl>}
      </div>}
      {!pharmacy && r.operatorPreview && r.context === "current" && r.operatorApplyAllowed && <dl className="space-y-1 text-sm">
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
        <dt>Recorded verification</dt><dd>{r.verification?.gate1 === "pass" && r.verification.gate2 === "pass" && r.verification.reconciled
          ? "Both gates satisfied" : r.verification ? `Gate 1 ${r.verification.gate1}; Gate 2 ${r.verification.gate2}` : "Not established"}</dd>
        {r.sourceAssessment && <><dt>{r.context === "recorded" ? "Recorded-source reassessment" : "Current source checks"}</dt>
          <dd>Gate 1 {r.sourceAssessment.gate1}; Gate 2 {r.sourceAssessment.gate2}; reconciliation {r.sourceAssessment.reconciled ? "established" : "not established"}</dd></>}
        <dt>Next step</dt><dd>{r.nextStep}</dd>
        <dt>Source provenance</dt><dd>{r.provenance}</dd>
      </dl>
      <SignalList signals={r.signals} compact={compact} />
      {onApply && r.context !== "recorded" && <Button type="button" variant="outline" data-pharmacy-action={pharmacy ? pharmacyAction : undefined} onClick={onApply}>{applyLabel ?? (pharmacy ? "Apply suggested correction" : "Apply suggestion")}</Button>}
    </section>
  );
}
