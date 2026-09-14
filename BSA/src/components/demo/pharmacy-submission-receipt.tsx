import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BoundaryTag, KeyValue } from "./labels";
import { useAppStore } from "@/lib/store";
import { NO_VERIFICATION, itemStateLabel } from "@/lib/domain/lifecycle";
import { HILLCREST_PHARMACY } from "@/lib/domain/reference";
import { formatProcessItems } from "@/lib/domain/baseline";

export function PharmacySubmissionReceipt({ caseId, revisionNumber, compact = false }: {
  caseId: string; revisionNumber: number; compact?: boolean;
}) {
  const row = useAppStore((s) => s.lifecycles[caseId]);
  const revision = useAppStore((s) => s.caseRevisions[caseId]?.find((r) => r.number === revisionNumber));
  if (!row || !revision) return <p role="alert">Submission receipt unavailable.</p>;
  const events = row.history.filter((event) => event.revision === revisionNumber);
  const verification = events.filter((event) => event.verification).at(-1)?.verification ?? NO_VERIFICATION;
  const release = events.find((event) => event.to === "released_to_pricing");
  const pricing = events.find((event) => event.to === "paid");
  const built = events.some((event) => event.actor === "agent" && event.recommendationGate === "PASS" &&
    event.recommendation && ["SUFFICIENT", "REFER_BACK", "REQUEST_INFORMATION"].includes(event.recommendation));
  const humanRelease = release?.releaseOrigin === "human_decision" || release?.actor === "operator";
  const nextPath = release
    ? humanRelease ? "Released to existing pricing after operator review."
      : "Verified, released to existing pricing, no operator action."
    : pricing ? events.some((event) => event.actor === "operator") || pricing.processStep !== "automatic_pricing"
      ? "Priced by NHSBSA's existing rules engine after human review."
      : "priced by NHSBSA's existing rules engine, no person involved"
    : built ? "An operator will see a built case."
    : events.some((event) => event.processStep === "type1_capture")
      ? "Human capture recorded; human review pending."
      : revision.channel === "paper" ? "Human capture or reconciliation pending." : "Human review pending.";
  return <section aria-label="Submission receipt" data-pharmacy-receipt className="space-y-3 rounded-xl border p-4">
    <h2 className="font-semibold">Submission receipt</h2>
    <BoundaryTag cls={release || pricing ? humanRelease ? "human" : "deterministic" : "human"} />
    <p role="status">{release ? "Paid on the normal schedule (synthetic)." : nextPath}</p>
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <KeyValue k="Receipt" v={`${caseId}:${revision.number}`} />
      <KeyValue k="Gate 1" v={verification.gate1} />
      <KeyValue k="Gate 2" v={verification.gate2} />
      <KeyValue k="Reconciled" v={verification.reconciled ? "Yes" : "Not established"} />
      {release && <KeyValue k="Pricing path" v={nextPath} />}
    </dl>
    {!compact && <>
      <details><summary className="cursor-pointer">Recorded submission</summary>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <KeyValue k="Submitted at" v={revision.at} />
          <KeyValue k="Endorsement snapshot" v={revision.endorsementText || "Empty"} />
          <KeyValue k="Check result" v={revision.precheck?.status ?? "not_checked"} />
          <KeyValue k="Check timestamp" v={revision.precheck?.checkedAt ?? "No checks performed"} />
          <KeyValue k="Version / clause" v={`${revision.precheck?.tariffVersion ?? "Not retrieved"} / ${revision.precheck?.clauseId ?? "Not retrieved"}`} />
          <KeyValue k="Current item" v={itemStateLabel(row, "pharmacy")} />
        </dl>
      </details>
      <Button asChild variant="outline"><Link to={`/pharmacy/claims?caseId=${encodeURIComponent(caseId)}`}>View submitted claim</Link></Button>
    </>}
  </section>;
}

export function PharmacyReleasedCount() {
  const lifecycles = useAppStore((s) => s.lifecycles);
  const month = new Date().toISOString().slice(0, 7);
  const count = Object.values(lifecycles).filter((row) => row.pharmacyCode === HILLCREST_PHARMACY.contractorCode &&
    row.history.some((event) => event.to === "released_to_pricing" && event.at.startsWith(month) &&
      event.verification?.released && (event.actor === "code" || event.actor === "operator"))).length;
  return <section aria-label="Recorded pharmacy releases" className="rounded-xl border p-4">
    <dl><dt>Verified and released this month</dt><dd className="text-xl font-semibold" data-pharmacy-released-count>{formatProcessItems(count)}</dd></dl>
    <p className="text-sm">Hillcrest recorded items, not an estimate or payment. Includes operator-reviewed releases.</p>
  </section>;
}
