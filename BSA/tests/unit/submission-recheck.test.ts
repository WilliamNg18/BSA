import { expect, it } from "vitest";
import { submissionRecheck } from "../../src/lib/domain/submission-recheck";
import type { ItemVerification } from "../../src/lib/domain/lifecycle";

it.each(["eps", "paper"] as const)("only both actual passing gates and reconciliation allow a satisfied %s recheck", (channel) => {
  for (const gate1 of ["none", "fail", "pass"] as const) for (const gate2 of ["none", "fail", "pass"] as const) {
    for (const reconciled of [false, true]) {
      const verification: ItemVerification = { gate1, gate2, reconciled, released: false };
      const result = submissionRecheck(channel, verification);
      const satisfied = gate1 === "pass" && gate2 === "pass" && reconciled;
      expect(result.automaticRelease).toBe(satisfied && channel === "eps");
      expect(result.readyToRelease).toBe(satisfied);
      expect(result.disposition).toBe(!satisfied ? "operator_review_required" : channel === "eps" ? "automatic_release" : "operator_release_required");
      expect(verification.released).toBe(false);
    }
  }
});

it("uses exact no-operator wording only for a satisfied EPS recheck", () => {
  const verified: ItemVerification = { gate1: "pass", gate2: "pass", reconciled: true, released: false };
  expect(submissionRecheck("eps", verified).message).toBe("released to existing pricing, no operator action");
  expect(submissionRecheck("paper", verified).message).toBe("Resubmitted, ready to release. Paper requires the operator's press.");
});
