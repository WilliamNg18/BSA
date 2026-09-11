import AxeBuilder from "@axe-core/playwright";
import { captureCheckpoint, captureJson, cases, confirmReset, expect, staticRoutes, test } from "./fixtures";
import { startDemonstrationReview } from "./lifecycle-helpers";

const surfaces = [
  ...["scene", "month", "cases", "two-places", "close"].map((chapter) => ({ name: `overview-${chapter}`, path: `./#${chapter}` })),
  ...staticRoutes.slice(1).map((route) => ({ name: route.path, path: route.path })),
  ...cases.flatMap((c) => ["", "/trace", "/record"].map((suffix) => ({ name: `${c.id}${suffix.replace("/", "-") || "-pack"}`, path: `case/${c.id}${suffix}` }))),
  { name: "claims-contract", path: "pharmacy/claims" },
  { name: "not-found", path: "missing-page" },
];

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  for (const [width, colorScheme] of [[360, "dark"], [1440, "light"]] as const) {
    test.describe(`Task7 ${width} ${colorScheme} ${reducedMotion}`, () => {
      test.use({ viewport: { width, height: 1000 }, colorScheme, reducedMotion });
      for (const enabled of [false, true]) for (const surface of surfaces) {
        test(`all-rule axe and photograph ${surface.name} agent=${enabled}`, async ({ page }, testInfo) => {
          await page.goto(surface.path);
          const flag = page.getByRole("banner").getByRole("switch");
          await expect(flag).not.toBeChecked();
          await flag.setChecked(enabled);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await expect(page.locator("[data-assistance-host]")).toHaveAttribute("data-phase", enabled ? "assisted" : "manual");
          if (enabled && /EX-.*-pack$/.test(surface.name)) await expect(page.locator("[data-pack-assembly]")).toHaveAttribute("data-pack-assembly", "6");
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          const results = await new AxeBuilder({ page }).analyze();
          await captureJson(testInfo, "axe-results", results);
          expect(results.violations, JSON.stringify(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })))).toEqual([]);
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({ path: testInfo.outputPath(`${surface.name}-${width}-${colorScheme}-${reducedMotion}-${enabled ? "on" : "off"}.png`), fullPage: true });
        });
      }
    });
  }
}

test("Task7 native replay and decision notices retain keyboard operation and Reset Off", async ({ page }, testInfo) => {
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  await page.getByRole("radio", { name: /^Amend / }).check();
  const record = page.getByRole("button", { name: "Record decision", exact: true });
  await record.focus();
  await page.keyboard.press("Enter");
  const notices = page.getByRole("complementary", { name: "Decision notifications" });
  const dismiss = notices.getByRole("button", { name: "Dismiss notification" });
  await expect(page.getByRole("alert").filter({ hasText: "A reason of at least eight characters" })).toBeVisible();
  await expect(record).toBeFocused();
  let axe = await new AxeBuilder({ page }).analyze();
  await captureJson(testInfo, "axe-notice-error", axe);
  expect(axe.violations).toEqual([]);
  await expect(dismiss).toHaveCount(0);
  await captureCheckpoint(page, testInfo, "notification-error-keyboard");
  await expect(page.locator("[data-decision-notice]")).toHaveCount(0);
  await expect(record).toBeFocused();
  await captureCheckpoint(page, testInfo, "notification-restored-record-focus");
  await page.getByRole("textbox", { name: "Reason (required)", exact: true }).fill("Operator reviewed the evidence");
  await record.press("Enter");
  await expect(notices).toContainText("Decision recorded as DR-000873");
  const replay = page.getByRole("combobox", { name: "Replay with", exact: true });
  await replay.focus();
  await replay.press("Home");
  await replay.press("Enter");
  await expect(replay).toHaveValue("2026-07");
  await expect(replay).toBeFocused();
  await expect(page.getByRole("status", { name: "Replay outcome" })).toContainText("Sufficient");
  axe = await new AxeBuilder({ page }).analyze();
  await captureJson(testInfo, "axe-notice-success-replay", axe);
  expect(axe.violations).toEqual([]);
  await captureCheckpoint(page, testInfo, "notification-success-july-replay");
  // Programmatic dismissal must not steal focus from an unrelated field.
  await dismiss.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator("[data-decision-notice]")).toHaveCount(0);
  await expect(replay).toBeFocused();
  await confirmReset(page);
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(page.locator("[data-decision-notice]")).toHaveCount(0);
});

test("Task7 inline decision errors leave publishing fields and button focus unchanged", async ({ page }, testInfo) => {
  await page.goto("case/EX-24112");
  await startDemonstrationReview(page);
  const reason = page.getByRole("textbox", { name: "Reason (required)", exact: true });
  const record = page.getByRole("button", { name: "Record decision", exact: true });
  const dismiss = page.getByRole("button", { name: "Dismiss notification", exact: true });
  await reason.focus();
  // Publish without moving focus, as with a form's implicit submission.
  await record.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("alert").filter({ hasText: "A reason of at least eight characters" })).toBeVisible();
  await expect(dismiss).toHaveCount(0);
  await expect(reason).toBeFocused();
  await captureCheckpoint(page, testInfo, "notification-restored-field-focus");
  await record.press("Enter");
  await expect(record).toBeFocused();
  await reason.focus();
  await expect(dismiss).toHaveCount(0);
  await expect(reason).toBeFocused();
});