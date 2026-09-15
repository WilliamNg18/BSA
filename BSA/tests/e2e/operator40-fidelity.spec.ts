import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { test, expect, captureCheckpoint } from "./fixtures";
import { expectHeaderOutcomeSettled } from "./header-outcome-helpers";

async function panelProse(panel: Locator) {
  return panel.evaluate((element) => [...element.querySelectorAll("p, span.text-xs.text-muted-foreground")]
    .map((node) => node.textContent ?? "").join(" ").trim().split(/\s+/).filter(Boolean).length);
}

async function verifyAuthorityPanels(page: Page, caseId: string, enabled: boolean) {
  const human = page.getByRole("region", { name: "Operator decision", exact: true });
  await expect(human).toBeVisible();
  await expect(human.locator("[data-recommendation-case]")).toHaveCount(0);
  expect(await panelProse(human)).toBeLessThan(25);
  const advice = page.locator(`[data-operator-workspace="${caseId}"] > [data-recommendation-case="${caseId}"]`);
  await expect(advice).toHaveCount(enabled ? 1 : 0);
  if (enabled) {
    await expect(advice.getByRole("heading", { name: "Recommendation", exact: true })).toBeVisible();
    expect(await panelProse(advice)).toBeLessThan(25);
    const geometry = await advice.evaluate((element) => {
      const human = element.parentElement?.querySelector("[data-operator-action-panel]");
      if (!human) throw new Error("The sibling human panel is missing.");
      return {
        siblings: human.parentElement === element.parentElement,
        nested: human.contains(element) || element.contains(human),
        advice: element.getBoundingClientRect().toJSON(),
        human: human.getBoundingClientRect().toJSON(),
        viewportWidth: innerWidth,
      };
    });
    expect(geometry.siblings).toBe(true);
    expect(geometry.nested).toBe(false);
    expect(geometry.human.top).toBeGreaterThanOrEqual(geometry.advice.bottom);
    for (const rectangle of [geometry.advice, geometry.human]) {
      expect(rectangle.left).toBeGreaterThanOrEqual(0);
      expect(rectangle.right).toBeLessThanOrEqual(geometry.viewportWidth);
    }
  }
  return { human, advice };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a submitted evidence object.");
  return Object.fromEntries(Object.entries(value));
}

for (const width of [1280, 1440]) {
  test(`Task40 explicit later audit retains the exact submitted EPS message at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/case/EX-24107");
    const source = page.locator("[data-submitted-record]");
    await source.locator("summary").click();
    await expect(source.locator("pre")).toBeVisible();
    const original = await source.locator("pre").innerText();
    const audit = page.getByRole("region", { name: "Later audit or query", exact: true });
    await expect(audit.getByRole("button", { name: "Open later audit or query", exact: true })).toBeDisabled();
    await audit.getByRole("textbox", { name: "Audit or later-query reason (at least eight characters)", exact: true })
      .fill("Later query requires comparison with the original submitted record.");
    await audit.getByRole("button", { name: "Open later audit or query", exact: true }).click();
    await expect(page.getByRole("region", { name: "Operator decision", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Refer back", exact: true })).toBeVisible();
    await expect(audit).toHaveCount(0);
    await expect(source.locator("pre")).toHaveText(original);
    await expect(page.getByRole("region", { name: "Shared case history", exact: true }))
      .toContainText("Operator opened a later audit or query");
    await expectHeaderOutcomeSettled(page, false);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  for (const enabled of [false, true]) {
  test(`Task40 ready paper uses its actual prepared decision and one operator Release at ${width}px${enabled ? " Agent On" : ""}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/case/EX-24112");
    if (enabled) await page.getByRole("banner").getByRole("switch").click();
    const source = page.locator("[data-submitted-record]");
    await source.locator("summary").click();
    const original = await source.locator("pre").innerText();
    const { human: panel } = await verifyAuthorityPanels(page, "EX-24112", enabled);
    await expect(panel).toContainText("Resubmitted, ready to release");
    await expect(panel.getByRole("textbox", { name: "Reason (required)", exact: true })).not.toHaveValue("");
    await expect(panel.getByRole("button", { name: "Apply suggestion", exact: true })).toHaveCount(0);
    const release = panel.getByRole("button", { name: "Release to pricing", exact: true });
    await expect(release).toBeEnabled();
    await captureCheckpoint(page, info, `operator40-B-ready-${enabled ? "On" : "Off"}`);
    await release.click();
    const record = page.getByRole("region", { name: "Release record", exact: true });
    await expect(record).toBeVisible();
    await expect(record.getByRole("term").filter({ hasText: /^Released by$/ }).locator("+ dd")).toHaveText("operator");
    await expect(record).not.toHaveAttribute("data-automatic-case");
    await expect(page.getByRole("button", { name: "Release to pricing", exact: true })).toHaveCount(0);
    await expect(source.locator("pre")).toHaveText(original);
    await expectHeaderOutcomeSettled(page, enabled);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test(`Task40 confirmed paper keeps advice and human focus separate at ${width}px Agent ${enabled ? "On" : "Off"}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/case/EX-24123");
    if (enabled) await page.getByRole("banner").getByRole("switch").click();
    const source = page.locator("[data-submitted-record]");
    await source.locator("summary").click();
    const original = await source.locator("pre").innerText();
    const fields = object(object(object(JSON.parse(original)).declaration).fields);
    const capture = page.getByRole("region", { name: "Type 1 capture for EX-24123", exact: true });
    for (const [field, label] of [["productCode", "Product code"], ["quantity", "Quantity"],
      ["endorsementText", "Endorsement"], ["prescriber", "Prescriber"]]) {
      const value = fields[field];
      if ((typeof value !== "string" && typeof value !== "number") || value === "") {
        throw new Error(`The displayed complete declaration lacks ${field}.`);
      }
      const input = capture.getByRole("textbox", { name: label, exact: true });
      if (enabled) await expect(input).toHaveValue(String(value));
      else await input.fill(String(value));
    }
    if (enabled) await capture.getByRole("checkbox").check();
    await capture.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }).click();
    const { human, advice } = await verifyAuthorityPanels(page, "EX-24123", enabled);
    const note = human.getByRole("textbox", { name: "Reason (required)", exact: true });
    if (enabled) {
      await advice.getByRole("button", { name: "Apply suggestion", exact: true }).click();
      await expect(note).toBeFocused();
      await expect(note).not.toHaveValue("");
    } else {
      await note.fill("Human review still requires an explicit final decision.");
      await expect(note).toBeFocused();
    }
    await expect(note).toBeInViewport({ ratio: 1 });
    await expect(source.locator("pre")).toHaveText(original);
    await expect(page.getByRole("region", { name: "Release record", exact: true })).toHaveCount(0);
    await captureCheckpoint(page, info, `operator40-D-confirmed-${enabled ? "On" : "Off"}-focused`);
    await expectHeaderOutcomeSettled(page, enabled);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
  }
}
