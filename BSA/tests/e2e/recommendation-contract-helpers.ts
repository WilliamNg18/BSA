import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

export async function assertVisibleRecommendation(page: Page, caseId: string, enabled: boolean) {
  const allCards = page.getByRole("region", { name: "Recommendation", exact: true });
  if (!enabled) {
    await expect(allCards).toHaveCount(0);
    return;
  }
  const card = allCards.and(page.locator(`[data-recommendation-case="${caseId}"]`));
  await expect(card).toHaveCount(1);
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("data-recommendation-case", caseId);
  await expect(card.getByRole("heading", { name: "Recommendation", exact: true })).toBeVisible();
  for (const name of ["Requirement results", "Suggested values", "Corrected preview", "Recommended outcome", "Confidence signals"]) {
    await expect(card.getByText(name, { exact: true }).first(), `${name} must be visible without opening a disclosure`).toBeVisible();
  }
  await expect(card).toContainText("the agent verifies and advises; a person decides");
  const collapsedContent = card.locator("details:not([open])").filter({
    hasText: /Requirement results|Suggested values|Corrected preview|Recommended outcome|Confidence signals/,
  });
  await expect(collapsedContent, "Mandatory recommendation fields cannot be hidden in collapsed details").toHaveCount(0);
}

export async function applyPreviewedDate(page: Page, caseId: string, fieldName: string) {
  await assertVisibleRecommendation(page, caseId, true);
  const card = page.getByRole("region", { name: "Recommendation", exact: true })
    .and(page.locator(`[data-recommendation-case="${caseId}"]`));
  await expect(card).toContainText("21/08/2026");
  await expect(card).toContainText("NCSO RK 21/08/26");
  const field = page.getByRole("textbox", { name: fieldName, exact: true });
  const before = await field.inputValue();
  expect(before).not.toBe("NCSO RK 21/08/26");
  await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
  await expect(field).toHaveValue("NCSO RK 21/08/26");
  await expect(field).toHaveClass(/ring-2/);
}
