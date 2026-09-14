import { audit, captureJson, expect, test } from "./fixtures";
import { runFourCaseCycle, type CycleAction } from "../e2e/four-case-cycle-helpers";
import { choosePerspective } from "../e2e/perspective-helpers";
import { DEMO_MODES, PLAYABLE_CYCLES } from "../support/desktop-matrix";
import { fourCaseCycleTitle, LIVE_CYCLE_MODES } from "./inventory";

for (const scenario of PLAYABLE_CYCLES) for (const enabled of DEMO_MODES) for (const mode of LIVE_CYCLE_MODES) {
  test(fourCaseCycleTitle(scenario.id, enabled, mode), async ({ page }, info) => {
    test.setTimeout(180_000);
    const epoch = Date.parse("2026-09-14T12:00:00.000Z");
    await page.clock.setFixedTime(new Date(epoch));
    await page.goto("/");
    await choosePerspective(page, "Both");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    const actions: { label: string; side: string; at: string; url: string; visibleState: string; follow: string }[] = [];
    const action: CycleAction = async (label, side, perform) => {
      if (mode === "switched") {
        await choosePerspective(page, side === "Pharmacy" ? "NHSBSA" : "Pharmacy");
        await choosePerspective(page, side);
      }
      const at = new Date(epoch + (actions.length + 1) * 1000).toISOString();
      await page.clock.setFixedTime(new Date(at));
      await perform();
      await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
      actions.push({ label, side, at, url: page.url(),
        visibleState: await page.locator("[data-item-state]").innerText(),
        follow: await page.getByRole("region", { name: "Followed item", exact: true }).innerText() });
    };
    try {
      await runFourCaseCycle(page, scenario, enabled, action);
      expect(await page.evaluate(() => Reflect.has(window, "__BSA_READ_DOMAIN_STATE__"))).toBe(false);
      await audit(page, info, `four-case-${scenario.id}-${mode}`, enabled);
    } finally {
      await captureJson(info, "four-case-visible-action-history", {
        caseId: scenario.id, enabled, mode, observerUsed: false, actions,
        fullDomainParity: "Not inferred from visible text; the separate instrumented matrix compares full state after every action.",
      });
    }
  });
}
