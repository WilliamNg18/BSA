import type { Page } from "@playwright/test";
import { expect, cases, staticRoutes } from "./fixtures";
import { TOUR_STOPS } from "../../src/lib/tour-navigation";
import type { Perspective } from "../../src/lib/store";
import { MONTH_MODEL_DEFAULTS, formatBaselineNumber, monthModel } from "../../src/lib/domain/baseline";

export const agentRoutes = [...new Set([
  ...staticRoutes.map(({ path }) => `/${path}`),
  ...TOUR_STOPS.map(({ to }) => to),
  "/pharmacy/claims?caseId=EX-24112",
  ...cases.flatMap(({ id }) => [`/case/${id}`, `/case/${id}/trace`, `/case/${id}/record`]),
])];

export const perspectiveNames = { pharmacy: "Pharmacy", nhsbsa: "NHSBSA", both: "Both" } as const;

export async function assertHeaderAgent(page: Page, route: string, perspective: Perspective) {
  await page.goto(route);
  const header = page.getByRole("banner");
  await header.getByRole("radio", { name: perspectiveNames[perspective], exact: true }).check();
  const flag = header.getByRole("switch", { name: /^Agent: (On|Off)$/ });
  const hidden = perspective === "pharmacy" && (route === "/queue" || route.startsWith("/case/"))
    || perspective === "nhsbsa" && route.startsWith("/pharmacy");
  for (const enabled of [true, false]) {
    await flag.setChecked(enabled);
    // Count hidden controls too: an off-screen duplicate is still a duplicate.
    await expect(page.getByRole("switch", { includeHidden: true })).toHaveCount(1);
    await expect(flag).toBeChecked({ checked: enabled });
    await expect(flag).toHaveAttribute("id", "agent-flag");
    await expect(page.locator("[data-assistance-host]")).toHaveAttribute("data-phase", enabled ? "assisted" : "manual");
    await expect(header.getByRole("radio", { name: perspectiveNames[perspective], exact: true })).toBeChecked();
    if (hidden) {
      await expect(page.getByText("This view belongs to the other side; switch perspective to see it", { exact: true })).toBeVisible();
    } else if (route === "/pharmacy") {
      await expect(page.locator("[data-pharmacy-status]")).toHaveText(enabled ? "Information may be missing" : "Not checked: manual submission");
      await expect(page.getByRole("button", { name: "Apply correction", exact: true })).toHaveCount(enabled ? 1 : 0);
    } else if (route === "/queue") {
      await expect(page.locator("[data-queue-guide]")).toContainText(enabled ? "With the agent:" : "Today:");
    } else if (route.startsWith("/pharmacy/claims")) {
      await expect(page.getByRole("main")).toContainText(enabled ? "With the agent: the item comes back" : "Today: the pharmacy learns weeks later");
    } else if (route === "/#month") {
      const model = monthModel(MONTH_MODEL_DEFAULTS);
      const hours = enabled ? model.withAgent.operatorHours : model.today.operatorHours;
      await expect(page.locator("[data-month-hours]")).toHaveText(formatBaselineNumber(hours, 1));
    } else if (route.startsWith("/case/")) {
      await expect(page.getByRole("region", { name: "Assisted fields not recorded", exact: true })).toHaveCount(enabled ? 0 : 1);
    }
  }
}
