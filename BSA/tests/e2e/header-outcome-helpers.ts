import { expect, type Page } from "@playwright/test";

export async function expectHeaderOutcomeSettled(page: Page, enabled: boolean) {
  await expect(page.getByRole("banner", { includeHidden: true }).getByRole("switch", { includeHidden: true })).toBeChecked({ checked: enabled });
  const outcome = page.locator("[data-agent-outcome]");
  await expect(outcome).toHaveCount(enabled ? 1 : 0);
  if (enabled) await expect(outcome).toHaveCSS("opacity", "1");
}
