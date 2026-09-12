import { Link } from "react-router-dom";
import { BoundaryTag } from "@/components/demo/labels";
import { Button } from "@/components/ui/button";
import { pharmacyCaseLink } from "@/lib/case-links";
import type { CaseLifecycle } from "@/lib/domain/lifecycle";
import { LIFECYCLE_LABELS } from "@/lib/domain/lifecycle";
import { useAppStore } from "@/lib/store";

export function ReferralCycle({ enabled, claim }: { enabled: boolean; claim?: CaseLifecycle }) {
  const perspective = useAppStore((s) => s.perspective);
  return <section aria-label="Referral cycle guide" className="space-y-4 rounded-xl border bg-card p-5">
    <h2 className="text-xl font-semibold">Referral, correction and re-check</h2>
    <section aria-label="Referral cycle comparison" className="space-y-2 rounded-lg bg-muted/40 p-4">
      <h3 className="font-semibold">{enabled ? "With agent · Assisted preparation" : "Today · Manual preparation"}</h3>
      <BoundaryTag cls={enabled ? "agent" : "human"} />
      <p className="text-sm">{enabled
        ? "Illustrative: operator-approved drafts support human correction and resubmission; code validates and humans decide. Optional checks never guarantee shorter waits."
        : "Illustrative: humans review the reason, find the rule, correct, resubmit and decide after code validates. Waiting times are not guaranteed."}</p>
    </section>
    <ol aria-label="Referral cycle stages" className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <li className="space-y-2 rounded-lg border p-3">
        <h3 className="font-semibold">1. Referred back</h3><BoundaryTag cls="human" />
        <p className="text-sm">An operator records the referral reason. With assistance, only an explicitly approved draft becomes the pharmacy note.</p>
      </li>
      <li className="space-y-2 rounded-lg border p-3">
        <h3 className="font-semibold">2. Corrected</h3><BoundaryTag cls="human" />
        <p className="text-sm">The pharmacy edits the endorsement. An unsent correction is a local draft, not a lifecycle transition.</p>
      </li>
      <li className="space-y-2 rounded-lg border p-3">
        <h3 className="font-semibold">3. Resubmitted</h3><BoundaryTag cls="human" />
        <p className="text-sm">The pharmacy submits its correction. A new revision preserves the earlier evidence and returns the item for re-check.</p>
      </li>
      <li className="space-y-2 rounded-lg border p-3">
        <h3 className="font-semibold">4. Re-checked</h3><BoundaryTag cls="deterministic" /><BoundaryTag cls="human" />
        <p className="text-sm">An operator starts review. Code validates the revised evidence; the operator decides. Missing evidence can require another referral.</p>
      </li>
      <li className="space-y-2 rounded-lg border p-3">
        <h3 className="font-semibold">5. Paid · Synthetic only</h3><BoundaryTag cls="existing" />
        <p className="text-sm">For referred items, a sufficient human decision releases the item to existing pricing. The recorded paid result is synthetic, not a calculated payment.</p>
      </li>
    </ol>
    <p className="text-sm font-medium">This guide is not claim history. Opening it or switching assistance never completes a stage.</p>
    {claim && <section aria-label="Recorded claim state" className="space-y-3 border-t pt-4">
      <h3 className="font-semibold">{claim.caseId} · Recorded state</h3>
      <p className="text-sm" role="status">{LIFECYCLE_LABELS[claim.state].pharmacy}</p>
      {claim.state === "paid" && <p className="text-sm">Recorded synthetic outcome attributed to existing pricing. No actual payment is calculated or approved here.</p>}
      <div className="flex flex-wrap gap-3">
        {perspective !== "nhsbsa" && <Button asChild variant="outline"><Link to={pharmacyCaseLink(claim.caseId)}>Open this pharmacy claim</Link></Button>}
        {perspective !== "pharmacy" && <Button asChild variant="outline"><Link to={`/case/${claim.caseId}`}>Open this operator case</Link></Button>}
      </div>
    </section>}
  </section>;
}
