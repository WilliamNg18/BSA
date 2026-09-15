import { describe, expect, it } from "vitest";
import { caseById, PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { seededLifecycleSession } from "../../src/lib/domain/lifecycle-seed";
import { lastPharmacySubmission, submissionReplica } from "../../src/lib/domain/submission-fidelity";
import type { CaseRevision } from "../../src/lib/domain/lifecycle";

describe("exact submission fidelity, independent of derived operator evidence", () => {
  it.each(PLAYABLE_CASE_IDS)("deep-equals the complete pharmacy submission for %s", (id) => {
    const revision = seededLifecycleSession().caseRevisions[id].at(-1)!;
    const original = caseById(revision.templateCaseId)!;
    const replica = submissionReplica(revision, revision.channel === "paper" ? original : undefined);
    expect(replica.heading).toBe("As submitted by the pharmacy");
    expect(replica.asSubmitted).toEqual(revision);
    expect(replica.asSubmitted).not.toBe(revision);
    expect(Object.isFrozen(replica.asSubmitted)).toBe(true);
    expect(replica.paperScan).toEqual(revision.channel === "paper" ? original : null);
  });

  it.each(["seed", "submission", "resubmission"] as const)("retains every field of a %s attempt, not a filtered projection", (kind) => {
    const initial = seededLifecycleSession().caseRevisions["EX-24123"][0];
    const revision: CaseRevision = { ...initial, number: 2, kind, endorsementText: "  NCSO JB 27/08/26  " };
    const replica = submissionReplica(revision, caseById("EX-24123")!);
    expect(replica.asSubmitted).toEqual(revision);
    expect(replica.asSubmitted.endorsementText).toBe("  NCSO JB 27/08/26  ");
    expect(() => Object.assign(replica.asSubmitted.paperDeclaration!, { typedProduct: "rewritten" })).toThrow();
  });

  it("a later information response does not replace the submitted claim", () => {
    const revision = seededLifecycleSession().caseRevisions["EX-24107"][0];
    const answer: CaseRevision = { ...revision, number: 2, kind: "confirmation", confirmation: "Additional evidence only" };
    expect(lastPharmacySubmission([revision, answer])).toEqual(revision);
    expect(() => lastPharmacySubmission([answer])).toThrow(/unavailable/);
    expect(() => submissionReplica(answer)).toThrow(/not a replacement/);
  });

  it("a corrected pharmacy attempt replaces only the latest view, not the old submission or scan", () => {
    const original = caseById("EX-24123")!;
    const first = seededLifecycleSession().caseRevisions[original.id][0];
    const earlier = submissionReplica(first, original);
    const second: CaseRevision = { ...first, number: 2, kind: "resubmission", endorsementText: "NCSO JB 27/08/26; pharmacy amendment" };
    const latest = lastPharmacySubmission([first, second]);
    expect(latest).toEqual(second);
    expect(earlier.asSubmitted).toEqual(first);
    expect(earlier.paperScan).toEqual(original);
    expect(() => submissionReplica(first, { ...original, capturedEvidence: {
      fields: { productCode: "SYN-REPLACED", quantity: 1, endorsementText: "capture only" },
      provenance: "human_capture", declarationReconciled: true, revision: first.number,
    } })).toThrow(/derived human capture/);
  });

  it("fails explicitly when original channel evidence is unavailable", () => {
    const revision = seededLifecycleSession().caseRevisions["EX-24123"][0];
    expect(() => submissionReplica(revision)).toThrow(/scan is unavailable/);
    expect(() => submissionReplica({ ...revision, channel: undefined })).toThrow(/channel is unavailable/);
    expect(() => submissionReplica({ ...revision, channel: "eps" }, caseById("EX-24123")!)).toThrow(/no paper scan/);
  });
});
