import { beforeEach, describe, expect, it } from "vitest";
import { PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { deriveRecommendation } from "../../src/lib/domain/recommendations";
import { initialisePharmacyDraft, suggestedPharmacyCorrection } from "../../src/lib/domain/pharmacy-correction";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState();
beforeEach(() => store().resetDemo());

describe("shared recommendation contract", () => {
  it.each(PLAYABLE_CASE_IDS)("contains every required field for %s without changing state", (id) => {
    const before = getDomainSnapshot(), r = deriveRecommendation(store(), id);
    for (const key of ["clause", "version", "requirements", "missing", "suggestions", "outcome", "signals", "preview", "provenance"]) expect(r).toHaveProperty(key);
    expect(Object.keys(r.signals)).toHaveLength(5);
    expect(r.authorityLabel).toBe("the agent verifies and advises; a person decides");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("complete EPS reports the dated clause without inventing a model invocation", () => {
    const r = deriveRecommendation(store(), "EX-24107");
    expect(r).toMatchObject({ outcome: "COMPLETE", version: "2026-08", missing: [], suggestions: [], preview: null, kernelRecommendation: "NONE" });
    expect(r.summary).toBe("Complete against Clause 9, Version August 2026; nothing to add.");
  });

  it("previews and applies the actual dispensing date through exactly one helper", () => {
    const id = "EX-24112", revision = store().caseRevisions[id][0], current = sessionCase(id)!;
    store().setAgentEnabled(true);
    store().setPharmacyDraft(id, { ...initialisePharmacyDraft(current, revision), purpose: "new_submission" });
    const r = deriveRecommendation(store(), id, { kind: "draft" });
    expect(r.suggestions[0]).toMatchObject({ field: "dated", value: "21/08/2026" });
    expect(r.preview?.endorsementText).toBe("NCSO RK 21/08/26");
    expect(r.preview).toEqual(suggestedPharmacyCorrection(current, revision, store().pharmacyDrafts[id]));
    const attempts = store().caseRevisions[id];
    store().applySuggestedCorrection(id);
    expect(store().pharmacyDrafts[id]).toEqual(r.preview);
    expect(store().caseRevisions[id]).toEqual(attempts);
  });

  it("wrong pack is not complete and proposes the actual registered pack", () => {
    const r = deriveRecommendation(store(), "SYN-FQ123-MISMATCH");
    expect(r.outcome).not.toBe("COMPLETE");
    expect(r.suggestions).toContainEqual(expect.objectContaining({ field: "pack_size", value: 21 }));
  });

  it("paper declaration complete is distinct from unverified received paper", () => {
    const draft = deriveRecommendation(store(), "EX-24123", { kind: "draft" });
    expect(draft.outcome).toBe("COMPLETE");
    expect(draft.provenance).toContain("declared by the pharmacy, not read from the form");
    const received = deriveRecommendation(store(), "EX-24123");
    expect(received.outcome).toBe("REQUEST_INFORMATION");
    expect(received.kernelRecommendation).toBe("ABSTAIN");
    expect(received.requiresOperatorRelease).toBe(true);
    expect(received.diagnostic?.provenance).toBe("unverified");
    expect(store().itemVerification["EX-24123"].released).toBe(false);
  });

  it("recorded attempts cannot borrow a later correction or a live draft", () => {
    const id = "EX-24112", before = deriveRecommendation(store(), id, { kind: "recorded", revision: 1 });
    store().submitFromPharmacy(id, "NCSO RK 21/08/26");
    expect(deriveRecommendation(store(), id, { kind: "recorded", revision: 1 })).toEqual(before);
    expect(deriveRecommendation(store(), id).outcome).toBe("COMPLETE");
    expect(() => deriveRecommendation(store(), id, { kind: "recorded", revision: 100 })).toThrow("unavailable");
  });
});
