import type { Page } from "@playwright/test";
import { expect, cases, staticRoutes } from "./fixtures";
import { TOUR_STOPS } from "../../src/lib/tour-navigation";
import type { Perspective } from "../../src/lib/store";
import { expectProcessMetrics, PROCESS_MONTH_DEFAULTS } from "./process-model-helpers";

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
      await expect(page.locator("[data-pharmacy-status]")).toHaveText(enabled ? "Information missing" : "Not checked: manual submission");
      await expect(page.getByRole("button", { name: "Apply correction", exact: true })).toHaveCount(enabled ? 1 : 0);
    } else if (route === "/queue") {
      await expect(page.locator("[data-queue-guide]")).toHaveText(enabled
        ? "Type 2 worklist: the agent verifies and advises; a person decides."
        : "Type 2 worklist: review captured evidence, look up the Tariff and record your judgement.");
    } else if (route.startsWith("/pharmacy/claims")) {
      await expect(page.getByRole("region", { name: "Referral cycle guide", exact: true })).toContainText(enabled
        ? "Read the operator-approved fix, correct the endorsement, then explicitly resubmit."
        : "Today: referred-back items appear in MYS Unpaid items with an RB code and the operator's reason.");
    } else if (route === "/#month") {
      await expectProcessMetrics(page, PROCESS_MONTH_DEFAULTS, enabled);
    } else if (route.startsWith("/case/")) {
      const completedTrace = ["/case/EX-24107/trace", "/case/EX-24101/trace", "/case/EX-24088/trace"].includes(route);
      await expect(page.getByRole("region", { name: "Assisted fields not recorded", exact: true })).toHaveCount(enabled || completedTrace ? 0 : 1);
    }
  }
}
