import { describe, expect, it } from "vitest";
import { LIFECYCLE_LABELS, type LifecycleState } from "../../src/lib/domain/lifecycle";
import { CLAIMS, claimsForPharmacy, pharmacyOptions } from "../../src/components/claims/fixtures";
import { actionsForState } from "../../src/components/claims/claim-actions-model";

const ALL_STATES: LifecycleState[] = ["submitted", "in_review", "information_requested", "referred_back", "resubmitted", "paid", "escalated"];

describe("synthetic pharmacy claim fixtures", () => {
  it("carries a unique caseId per claim and only known lifecycle states", () => {
    const ids = CLAIMS.map((c) => c.caseId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CLAIMS) expect(ALL_STATES).toContain(c.state);
  });

  it("gives every claim a non-empty, well-formed history ending in its current state", () => {
    for (const c of CLAIMS) {
      expect(c.history.length).toBeGreaterThan(0);
      expect(c.history[0].from).toBeNull();
      expect(c.history.at(-1)!.to).toBe(c.state);
      for (let i = 1; i < c.history.length; i++) expect(c.history[i].from).toBe(c.history[i - 1].to);
    }
  });

  it("covers each of the seven contract lifecycle states with at least one claim", () => {
    const covered = new Set(CLAIMS.map((c) => c.state));
    for (const state of ALL_STATES) expect(covered.has(state)).toBe(true);
  });

  it("groups claims by pharmacy contractor code, matching pharmacyOptions", () => {
    const options = pharmacyOptions(CLAIMS);
    const total = options.reduce((n, o) => n + claimsForPharmacy(o.code, CLAIMS).length, 0);
    expect(total).toBe(CLAIMS.length);
    for (const o of options) {
      for (const c of claimsForPharmacy(o.code, CLAIMS)) expect(c.pharmacyName).toBe(o.name);
    }
  });

  it("uses the exact frozen pharmacy-side lifecycle labels", () => {
    for (const c of CLAIMS) expect(LIFECYCLE_LABELS[c.state].pharmacy).toBeTruthy();
  });
});

describe("claim actions allowed by lifecycle state", () => {
  it("offers a pharmacy action only for information_requested and referred_back", () => {
    for (const state of ALL_STATES) {
      const actions = actionsForState(state);
      if (state === "information_requested" || state === "referred_back") {
        expect(actions.length).toBeGreaterThan(0);
      } else {
        expect(actions).toEqual([]);
      }
    }
  });

  it("never proposes an action that itself names a lifecycle state change", () => {
    for (const state of ALL_STATES) {
      for (const action of actionsForState(state)) {
        expect(action.key).not.toMatch(/state|lifecycle/i);
      }
    }
  });
});
