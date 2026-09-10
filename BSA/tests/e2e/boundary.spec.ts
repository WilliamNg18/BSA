import { expect, test } from "@playwright/test";
import { confirmReset } from "./fixtures";

// This test deliberately faults a served production bundle, never the source.
// Unlike the normal fixture it expects ONLY the injected error and boundary log.
test("a view failure preserves the shell, logs its pathname and resets on navigation", async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => requests.push(request.url()));
  page.on("response", (response) => {
    if (response.status() >= 400) requests.push(`${response.status()} ${response.url()}`);
  });
  let injected = false;
  await page.route("**/BSA/assets/*.js", async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const marker = "Operator case pack: ${";
    if (!source.includes(marker)) {
      await route.fulfill({ response });
      return;
    }
    expect(source.split(marker)).toHaveLength(2);
    injected = true;
    await route.fulfill({ response, body: source.replace(marker,
      'Operator case pack: ${(() => { throw new Error("PR1 injected view failure"); })()}${') });
  });
  await page.goto("case/EX-24112");
  expect(injected).toBe(true);
  await expect(page.getByRole("heading", { name: "This view could not be loaded", exact: true })).toBeVisible();
  await expect(page.locator("[data-disclaimer]")).toContainText("Synthetic demonstration data throughout.");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await page.getByRole("switch", { name: "Agent: On", exact: true }).click();
  await expect(page.getByRole("switch", { name: "Agent: Off", exact: true })).not.toBeChecked();
  await confirmReset(page);
  await expect(page.getByRole("switch", { name: "Agent: On", exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: /Presenter mode|Discussion mode/ })).toHaveCount(0);
  expect(errors.some((error) => error.includes("[View Error] /case/EX-24112"))).toBe(true);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors.every((error) => error.includes("PR1 injected view failure")), errors.join("\n")).toBe(true);
  errors.length = 0;
  await page.getByRole("link", { name: "Go to the queue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "NHSBSA exception queue", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This view could not be loaded" })).toHaveCount(0);
  await page.locator("a[href='/BSA/case/EX-24112/trace']").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How the case was built: Missing or insufficient information");
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});