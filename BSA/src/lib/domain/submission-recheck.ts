import type { ItemVerification } from "./lifecycle";
import type { ItemChannel } from "./types";

export interface SubmissionRecheck {
  readonly disposition: "automatic_release" | "operator_release_required" | "operator_review_required";
  readonly automaticRelease: boolean;
  readonly readyToRelease: boolean;
  readonly message: string;
}

/** A routing decision only: the authoritative store appends the actual events. */
export function submissionRecheck(channel: ItemChannel, verification: ItemVerification): SubmissionRecheck {
  if (channel !== "eps" && channel !== "paper") throw new Error("A supported submission channel is required.");
  const satisfied = verification.gate1 === "pass" && verification.gate2 === "pass" && verification.reconciled;
  if (!satisfied) return {
    disposition: "operator_review_required", automaticRelease: false, readyToRelease: false,
    message: "Source reconciliation is not satisfied; operator review is required.",
  };
  if (channel === "paper") return {
    disposition: "operator_release_required", automaticRelease: false, readyToRelease: true,
    message: "Resubmitted, ready to release. Paper requires the operator's press.",
  };
  return {
    disposition: "automatic_release", automaticRelease: true, readyToRelease: true,
    message: "released to existing pricing, no operator action",
  };
}
