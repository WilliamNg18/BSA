import type { CaseRevision } from "./lifecycle";
import { immutable } from "./lifecycle-model";
import type { ExceptionCase } from "./types";

export const AS_SUBMITTED_HEADING = "As submitted by the pharmacy";

export interface SubmissionReplica {
  readonly heading: typeof AS_SUBMITTED_HEADING;
  readonly asSubmitted: CaseRevision;
  readonly paperScan: ExceptionCase | null;
}

/** Information-only answers are not replacement claim submissions. */
export function lastPharmacySubmission(revisions: readonly CaseRevision[]): CaseRevision {
  const submission = [...revisions].reverse().find((revision) => revision.kind !== "confirmation");
  if (!submission) throw new Error("The original pharmacy submission is unavailable.");
  return immutable(submission);
}

/** Never build this block from a captured-field or recommendation projection. */
export function submissionReplica(submission: CaseRevision, paperScan?: ExceptionCase): SubmissionReplica {
  if (submission.kind === "confirmation") throw new Error("An information response is not a replacement submission.");
  if (submission.channel !== "eps" && submission.channel !== "paper") throw new Error("The submission channel is unavailable.");
  if (submission.channel === "paper" && !paperScan) throw new Error("The original synthetic paper scan is unavailable.");
  if (submission.channel === "eps" && paperScan) throw new Error("An EPS submission has no paper scan.");
  if (paperScan?.capturedEvidence) throw new Error("Use the original paper scan, not derived human capture.");
  return immutable({ heading: AS_SUBMITTED_HEADING, asSubmitted: submission, paperScan: paperScan ?? null });
}
