import { test, expect, navigatePrimary } from "./fixtures";
import { agentRoutes, assertHeaderAgent, perspectiveNames } from "./header-agent-helpers";
import type { Perspective } from "../../src/lib/store";

test.use({ reducedMotion: "reduce" });

for (const perspective of Object.keys(perspectiveNames) as Perspective[]) {
  for (const route of agentRoutes) {
    test(`one header Agent toggle on ${route} in ${perspective}`, async ({ page }) => {
      await assertHeaderAgent(page, route, perspective);
    });
  }
}

test("header state persists through page navigation and open comparison controls cannot change it", async ({ page }) => {
  await page.goto("/pharmacy");
  const flag = page.getByRole("banner").getByRole("switch");
  for (const enabled of [true, false]) {
    await flag.setChecked(enabled);
    await navigatePrimary(page, "NHSBSA queue");
    await expect(flag).toBeChecked({ checked: enabled });
    await expect(page.locator("[data-queue-guide]")).toContainText(enabled ? "With the agent:" : "Today:");
    await page.getByRole("button", { name: "Compare", exact: true }).click();
    await page.getByRole("button", { name: "Run one hour", exact: true }).click();
    await expect(page.getByRole("switch", { includeHidden: true })).toHaveCount(1);
    await expect(flag).toBeChecked({ checked: enabled });
    await page.getByRole("button", { name: "Close comparison", exact: true }).click();
    await navigatePrimary(page, "Pharmacy claims");
    await expect(flag).toBeChecked({ checked: enabled });
    await navigatePrimary(page, "Pharmacy check");
    await expect(page.locator("[data-pharmacy-status]")).toHaveText(enabled ? "Information may be missing" : "Not checked: manual submission");
  }
});
