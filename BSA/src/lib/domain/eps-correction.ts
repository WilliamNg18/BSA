import type { EpsPrescription } from "./types";
import type { CaseLifecycle, CaseRevision, PharmacyPrecheckSnapshot } from "./lifecycle";
import { caseForLifecycle, validatePrecheck, validateSubmissionSources } from "./lifecycle-model";
import { checkEpsPharmacy } from "./eps-pharmacy-check";
import { pharmacySnapshot } from "./pharmacy-check";

export interface EpsCorrectionSources {
  readonly before: EpsPrescription;
  readonly after: EpsPrescription;
}

/** Recompute advice from source copies, never trust a caller's ready flag. */
export function validateEpsCorrection(
  caseId: string, sources: EpsCorrectionSources, before: PharmacyPrecheckSnapshot, after: PharmacyPrecheckSnapshot,
  lifecycles: Record<string, CaseLifecycle>, revisions: Record<string, readonly CaseRevision[]>,
): void {
  const fail = () => { throw new Error("Invalid EPS correction source evidence."); };
  const identity = (source: EpsPrescription) => ({ ...source, dispenserEndorsement: "", supplyEvidence: undefined });
  if (JSON.stringify(identity(sources.before)) !== JSON.stringify(identity(sources.after)) ||
    JSON.stringify(sources.before) === JSON.stringify(sources.after)) fail();
  const latest = revisions[caseId].at(-1)!;
  for (const [source, snapshot] of [[sources.before, before], [sources.after, after]] as const) {
    if (!["draft", "submitted"].includes(source.claimMessageState)) fail();
    validateSubmissionSources({ caseId, channel: "eps", endorsementText: snapshot.typedText,
      epsPrescription: { ...source, claimMessageState: "submitted" } }, latest.number);
    validatePrecheck(snapshot, source.dispenserEndorsement, source.dispensingDate);
    const projected = caseForLifecycle(caseId, lifecycles, {
      ...revisions, [caseId]: [...revisions[caseId].slice(0, -1), {
        ...latest, channel: "eps", endorsementText: source.dispenserEndorsement, epsPrescription: source,
      }],
    })!;
    const result = checkEpsPharmacy(projected, source.dispenserEndorsement);
    const expected = pharmacySnapshot(source.dispenserEndorsement, source.dispensingDate, "scripted", result, snapshot.checkedAt);
    if (JSON.stringify(expected) !== JSON.stringify(snapshot)) fail();
  }
}
