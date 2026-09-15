import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test.use({ screenshot: "off" });

for (const width of [1280, 1440]) {
  test(`all four item surfaces show complete On advice and no Off card at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ["EX-24107", "EX-24112", "SYN-FQ123-MISMATCH", "EX-24123"]) {
      for (const suffix of ["", "/trace", "/record"]) {
        await page.goto(`/case/${id}${suffix}`);
        await page.getByRole("banner").getByRole("switch").setChecked(true);
        const card = page.getByRole("region", { name: "Recommendation", exact: true });
        await expect(card).toHaveCount(1);
        await expect(card).toHaveAttribute("data-recommendation-case", id);
        expect(await card.evaluate((element) => Boolean(element.closest("details")))).toBe(false);
        for (const text of ["Tariff version", "Recommended outcome", "the agent verifies and advises; a person decides"]) {
          await expect(card).toContainText(text);
        }
        await expect(card.getByRole("list", { name: "Requirement results", exact: true })).toBeVisible();
        await expect(card.getByRole("list", { name: "Confidence signals", exact: true })).toBeVisible();
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.getByRole("banner").getByRole("switch").setChecked(false);
        await expect(card).toHaveCount(0);
      }
    }
  });

  test(`operator Apply uses the displayed concrete date and draft without releasing at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/pharmacy");
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    await page.getByRole("radio", { name: "NCSO missing date", exact: true }).click();
    await expect(page.getByRole("radio", { name: "NCSO missing date", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Send claim", exact: true }).click();
    await page.getByRole("link", { name: "View submitted claim", exact: true }).click();
    await page.getByRole("link", { name: "View NHSBSA case", exact: true }).click();
    const card = page.getByRole("region", { name: "Recommendation", exact: true });
    await expect(card).toBeVisible();
    await expect(card).toContainText("21/08/2026");
    await expect(card).toContainText("NCSO RK 21/08/26");
    await page.getByRole("button", { name: "Start review", exact: true }).click();
    const operator = page.getByRole("region", { name: "Operator decision", exact: true });
    const preview = card.locator("dl").filter({ has: page.getByText("Operator draft preview", { exact: true }) });
    const note = await preview.locator("dd").last().innerText();
    const history = page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status");
    const before = await history.innerText();
    await card.getByRole("button", { name: "Apply suggestion", exact: true }).click();
    await expect(operator.getByRole("textbox", { name: "Reason (required)", exact: true })).toHaveValue(note);
    await expect(operator.getByRole("radio", { name: "Refer back", exact: true })).toBeChecked();
    await expect(operator.getByLabel("RB code (required)", { exact: true })).toHaveValue("SYN-NCSO");
    await expect(operator).toContainText("applied by the operator from the agent's suggestion");
    await expect(history).toHaveText(before);
    await expect(operator.getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test(`unreconciled paper allows explicit safe follow-up but never Release at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/case/EX-24123");
    await page.getByRole("banner").getByRole("switch").setChecked(true);
    const capture = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true });
    await capture.getByRole("button", { name: "Key fields manually", exact: true }).click();
    await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
    const operator = page.getByRole("region", { name: "Operator decision", exact: true });
    const card = operator.getByRole("region", { name: "Recommendation", exact: true });
    await expect(card).toContainText("ABSTAIN");
    await expect(card).toContainText("Safe human follow-up");
    await card.getByRole("button", { name: "Apply suggestion", exact: true }).click();
    await expect(operator.getByLabel("RB code (required)", { exact: true })).toHaveValue("RB2B");
    await expect(operator.getByRole("radio", { name: "Refer back", exact: true })).toBeChecked();
    await expect(operator.getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
    await expect(card).toContainText("ABSTAIN");
    await expect(card).toContainText("fail");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await operator.getByRole("button", { name: "Refer back", exact: true }).click();
    await expect(page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status"))
      .toHaveText("Action needed: correction required");
    await expect(page.getByRole("region", { name: "Release record", exact: true })).toHaveCount(0);
  });
}
