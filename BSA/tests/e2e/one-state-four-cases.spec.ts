import { expect, test } from "./fixtures";
import { readDomainState, verifyPerspectiveEquivalence } from "./one-state-helpers";
import { runFourCaseCycle } from "./four-case-cycle-helpers";
import { DEMO_MODES, PLAYABLE_CYCLES } from "../support/desktop-matrix";

for (const scenario of PLAYABLE_CYCLES) for (const enabled of DEMO_MODES) {
  test(`one state: ${scenario.id} complete shared cycle with both side buttons after every state, Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    test.setTimeout(180_000);
    await verifyPerspectiveEquivalence(page, info, enabled, async (action) => {
      const initial = await readDomainState(page);
      expect(Object.keys(initial.lifecycles).sort()).toEqual(PLAYABLE_CYCLES.map((entry) => entry.id).sort());
      await runFourCaseCycle(page, scenario, enabled, action);
      const final = await readDomainState(page);
      const id = scenario.id;
      const row = final.lifecycles[id];
      expect(row.state).toBe(scenario.kind === "complete" && !enabled ? "paid" : "released_to_pricing");
      expect(final.caseRevisions[id]).toHaveLength(scenario.kind === "complete" ? 2 : 3);
      expect(final.caseRevisions[id].slice(0, initial.caseRevisions[id].length)).toEqual(initial.caseRevisions[id]);
      expect(row.history.slice(0, initial.lifecycles[id].history.length)).toEqual(initial.lifecycles[id].history);
      if (scenario.kind !== "complete") {
        expect(row.history.at(-1)).toMatchObject({ actor: "operator", releaseOrigin: "human_decision", to: "released_to_pricing" });
        expect(final.itemProcesses[id].releaseOrigin).toBe("human_decision");
        expect(final.itemVerification[id]).toMatchObject({ gate1: enabled ? "pass" : "none", gate2: enabled ? "pass" : "none", released: true });
        expect(row.history.some((event) => event.to === "referred_back" && event.actor === "operator")).toBe(true);
        expect(row.history.some((event) => event.processStep === "resubmission" && event.actor === "pharmacy")).toBe(true);
        if (enabled) {
          expect(row.history.some((event) => event.processStep === "suggestion_applied" && event.actor === "operator" && event.from === event.to)).toBe(true);
          expect(row.history.some((event) => event.processStep === "correction_applied" && event.actor === "pharmacy" && event.from === event.to)).toBe(true);
        }
      } else if (enabled) {
        expect(final.itemVerification[id]).toEqual({ gate1: "pass", gate2: "pass", reconciled: true, released: true });
        expect(final.itemProcesses[id].releaseOrigin).toBe("automatic_verification");
        expect(row.history.slice(initial.lifecycles[id].history.length).some((event) => event.actor === "operator")).toBe(false);
      }
      if (scenario.kind === "wrong-pack") {
        const firstSubmission = row.history.filter((event) => event.revision === 2);
        expect(firstSubmission.some((event) => event.to === "released_to_pricing" || event.to === "paid")).toBe(false);
        if (enabled) expect(firstSubmission.some((event) => event.verification?.gate1 === "pass" && event.verification.gate2 === "fail")).toBe(true);
      }
      for (const other of PLAYABLE_CYCLES.filter((entry) => entry.id !== id)) {
        for (const key of ["lifecycles", "caseRevisions", "itemProcesses", "itemVerification", "operatorDrafts", "pharmacyDrafts"] as const) {
          expect(final[key][other.id], `${id} must not change ${other.id}'s ${key}`).toEqual(initial[key][other.id]);
        }
      }
    });
  });
}
