import type { EpsPrescription } from "./types";
import type { CaseLifecycle, CaseRevision } from "./lifecycle";
import { caseForLifecycle } from "./lifecycle-model";

/** Preview a new submission, never a historical attempt or a referral correction. */
export function projectEpsSubmissionDraft(
  caseId: string, source: EpsPrescription,
  lifecycles: Record<string, CaseLifecycle>, revisions: Record<string, readonly CaseRevision[]>,
) {
  const latest = revisions[caseId]?.at(-1);
  if (!latest) throw new Error("EPS draft requires an existing synthetic item.");
  const next: CaseRevision = {
    number: latest.number + 1, at: latest.at, kind: "submission", templateCaseId: latest.templateCaseId,
    channel: "eps", endorsementText: source.dispenserEndorsement, epsPrescription: source,
    precheck: null, confirmation: null,
  };
  const projected = caseForLifecycle(caseId, lifecycles, { ...revisions, [caseId]: [...revisions[caseId], next] });
  if (!projected) throw new Error("EPS draft source could not be projected.");
  return projected;
}
