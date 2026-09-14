import { Button } from "@/components/ui/button";
import { BoundaryTag } from "./labels";
import type { PharmacyCheck } from "@/lib/domain/pharmacy-check";

export function PharmacyDraftCheck({ result, error, apply, recheck }: {
  result: PharmacyCheck | null; error: string; apply?: () => void; recheck?: () => void;
}) {
  return <section aria-label="Claims precheck" className="space-y-2">
    <BoundaryTag cls="deterministic" />
    <p role="status" data-pharmacy-status>{error || (result?.status === "ready" ? "Ready" : result?.status === "missing" ? "Information missing" : "Human review required")}</p>
    {result && <details><summary className="cursor-pointer">Precheck evidence</summary>
      <dl className="text-sm"><dt>Version / clause</dt><dd>{result.version ?? "Not retrieved"} / {result.clause?.id ?? "Not retrieved"}</dd>
        <dt>Exact gap</dt><dd>{result.gap}</dd></dl>
      {result.clause && <blockquote>{result.clause.text}</blockquote>}
      <ul aria-label="Requirement checkboxes">{result.checks.map((check) => <li key={check.id}>{check.label}: {check.met === true ? "met" : check.met === false ? "missing" : "unknown"}</li>)}</ul>
    </details>}
    <div className="flex flex-wrap gap-2">
      {apply && <Button variant="outline" data-pharmacy-action="apply-correction" onClick={apply}>Apply suggested correction</Button>}
      {recheck && <Button variant="outline" onClick={recheck}>Re-check endorsement</Button>}
    </div>
  </section>;
}
