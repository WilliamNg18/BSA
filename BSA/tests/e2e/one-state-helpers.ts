import type { Page, TestInfo } from "@playwright/test";
import { captureJson, expect } from "./fixtures";
import { choosePerspective, flag } from "./perspective-helpers";

type Side = "Pharmacy" | "NHSBSA";
type Checkpoint = { action: string; state: unknown };
type Action = (label: string, side: Side, perform: () => Promise<void>) => Promise<Record<string, unknown>>;
const epoch = Date.parse("2026-09-13T12:00:00.000Z");

export async function readDomainState(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const read: unknown = Reflect.get(window, "__BSA_READ_DOMAIN_STATE__");
    if (typeof read !== "function") throw new Error("The read-only domain observer is required for equivalence tests.");
    const snapshot: unknown = read();
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) throw new Error("The domain observer returned no state.");
    return snapshot as Record<string, unknown>;
  });
}

/** Every supplied action uses the UI; the observer can only read a snapshot. */
export async function verifyPerspectiveEquivalence(
  page: Page,
  info: TestInfo,
  enabled: boolean,
  flow: (action: Action) => Promise<void>,
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
    const action: Action = async (label, side, perform) => {
      const before = await readDomainState(page);
      if (mode === "switched") {
        for (const perspective of [side === "Pharmacy" ? "NHSBSA" : "Pharmacy", side] as const) {
          await choosePerspective(page, perspective);
          const state = await readDomainState(page);
          switches.push({ action: `${label}: switch to ${perspective}`, state });
          expect(state, `${label}: perspective alone must not mutate any domain field`).toEqual(before);
          await expect(flag(page)).toBeChecked({ checked: enabled });
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
