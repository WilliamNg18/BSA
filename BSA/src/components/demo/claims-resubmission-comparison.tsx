import { PainMarker } from "@/components/demo/pain-marker";
import type { PharmacyCheck } from "@/lib/domain/pharmacy-check";

export function ClaimsResubmissionComparison({ enabled, approved, status }: {
  enabled: boolean;
  approved: boolean;
  status: PharmacyCheck["status"] | null;
}) {
  const resolved = enabled && approved && status === "ready";
  const pain = !enabled ? "No advisory sufficiency check · Assumption"
    : !approved ? "No operator-approved correction"
    : status === "missing" ? "Current correction remains incomplete"
    : "Current correction not verified";

  return <section aria-label="Resubmission comparison" className="space-y-2">
    <p className="text-sm">{enabled
      ? "A check supports correction, not payment. Explicit resubmission follows existing routing; human re-check is required only for unresolved items."
      : "Synthetic assumption: resubmitting without an advisory sufficiency check may mean another correction cycle. Real pharmacy checks are unknown."}</p>
    <PainMarker resolved={resolved} pain={pain} resolution="Current correction checked · Explicit resubmission required" />
  </section>;
}
