import { PainMarker } from "@/components/demo/pain-marker";
import type { PharmacyCheck } from "@/lib/domain/pharmacy-check";

export function ClaimsResubmissionComparison({ enabled, approved, status }: {
  enabled: boolean;
  approved: boolean;
  status: PharmacyCheck["status"] | null;
}) {
  const resolved = enabled && approved && status === "ready";
  const pain = !enabled ? "Hypothetical repeat correction, not a prediction"
    : !approved ? "No operator-approved correction"
    : status === "missing" ? "Current correction remains incomplete"
    : "Current correction not verified";

  return <section aria-label="Resubmission comparison" className="space-y-2">
    <PainMarker resolved={resolved} pain={pain} resolution="Ready; explicit resubmission required" />
  </section>;
}
