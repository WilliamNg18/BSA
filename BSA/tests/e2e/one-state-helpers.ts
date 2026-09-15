import type { Page, TestInfo } from "@playwright/test";
import { captureJson, expect } from "./fixtures";
import { choosePerspective, flag } from "./perspective-helpers";
import type { CycleActionOptions } from "../support/desktop-matrix";

type Side = "Pharmacy" | "NHSBSA";
export type DomainSnapshot = ReturnType<typeof import("../../src/lib/store").getDomainSnapshot>;
type Checkpoint = { action: string; state: unknown };
export type DomainAction = (label: string, side: Side, perform: () => Promise<void>, options?: CycleActionOptions) => Promise<DomainSnapshot>;
const epoch = Date.parse("2026-09-13T12:00:00.000Z");

export function expectHumanRelease(before: DomainSnapshot, after: DomainSnapshot, id: string) {
  const revision = before.caseRevisions[id].at(-1)!;
  const verification = revision.verificationEnabled
    ? { gate1: "pass", gate2: "pass", reconciled: true, released: true }
    : { gate1: "none", gate2: "none", reconciled: false, released: true };
  const record = after.records.at(-1)!;
  const event = after.lifecycles[id].history.at(-1)!;
  expect(record).toMatchObject({
    caseId: id, revision: revision.number, decision: "ACCEPT", operator: "Demo operator",
    reason: before.operatorDrafts[id].note.trim(), timestamp: event.at, synthetic: true,
  });
  expect(event).toMatchObject({
    actor: "operator", from: before.lifecycles[id].state, to: "released_to_pricing",
    revision: revision.number, processStep: "release_to_pricing", releaseOrigin: "human_decision",
    recordId: record.id, decision: "ACCEPT", verification,
    message: "Human review complete; released to existing pricing. No payment calculated.",
  });
  expect(after, "Only the explicit human release, its record and code-checked provenance may change").toEqual({
    ...before,
    records: [...before.records, record],
    lifecycles: { ...before.lifecycles, [id]: {
      ...before.lifecycles[id], state: "released_to_pricing", history: [...before.lifecycles[id].history, event],
    } },
    itemVerification: { ...before.itemVerification, [id]: verification },
    itemProcesses: { ...before.itemProcesses, [id]: {
      ...before.itemProcesses[id], releaseOrigin: "human_decision", routing: {
        ...before.itemProcesses[id].routing, requiresHuman: false, pricingAuthority: "existing_rules_engine",
      },
    } },
    caseStates: { ...before.caseStates, [id]: "human_decision_recorded" },
  });
}

export async function readDomainState(page: Page): Promise<DomainSnapshot> {
  return page.evaluate(() => {
    const read: unknown = Reflect.get(window, "__BSA_READ_DOMAIN_STATE__");
    if (typeof read !== "function") throw new Error("The read-only domain observer is required for equivalence tests.");
    const snapshot: unknown = read();
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) throw new Error("The domain observer returned no state.");
    return snapshot as DomainSnapshot;
  });
}

/** Every supplied action uses the UI; the observer can only read a snapshot. */
export async function verifyPerspectiveEquivalence(
  page: Page,
  info: TestInfo,
  enabled: boolean,
  flow: (action: DomainAction) => Promise<void>,
) {
  const both: Checkpoint[] = [];
  const switched: Checkpoint[] = [];
  const switches: Checkpoint[] = [];
  for (const mode of ["both", "switched"] as const) {
    const checkpoints = mode === "both" ? both : switched;
    await page.clock.setFixedTime(new Date(epoch));
    await page.goto("/pharmacy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await choosePerspective(page, "Both");
    await flag(page).setChecked(enabled);
    const initial = await readDomainState(page);
    checkpoints.push({ action: "initial", state: initial });
    if (mode === "switched") expect(initial, "Both and switched runs must start from identical complete seeds").toEqual(both[0].state);
    const action: DomainAction = async (label, side, perform, options) => {
      const before = await readDomainState(page);
      const agentBefore = await flag(page).isChecked();
      if (mode === "switched" && !options?.preservePerspective) {
        for (const perspective of [side === "Pharmacy" ? "NHSBSA" : "Pharmacy", side] as const) {
          await choosePerspective(page, perspective);
          const state = await readDomainState(page);
          switches.push({ action: `${label}: switch to ${perspective}`, state });
          expect(state, `${label}: perspective alone must not mutate any domain field`).toEqual(before);
          await expect(flag(page), "Perspective changes must preserve the current explicit Agent setting").toBeChecked({ checked: agentBefore });
        }
      }
      await page.clock.setFixedTime(new Date(epoch + checkpoints.length * 1000));
      await perform();
      const state = await readDomainState(page);
      checkpoints.push({ action: label, state });
      if (mode === "switched") {
        expect(checkpoints.at(-1), `${label}: exact complete state including timestamps, actors, IDs, attempts and history`)
          .toEqual(both[checkpoints.length - 1]);
      }
      return state;
    };
    try {
      await flow(action);
      if (mode === "switched") expect(switched).toEqual(both);
    } finally {
      await captureJson(info, `domain-${mode}-agent-${enabled ? "on" : "off"}`, checkpoints);
      if (mode === "switched") await captureJson(info, "presentation-switch-checkpoints", switches);
    }
  }
}
