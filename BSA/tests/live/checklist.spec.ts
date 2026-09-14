import { audit, captureJson, expect, test } from "./fixtures";
import { cases, confirmReset, navigatePrimary, staticRoutes } from "../e2e/fixtures";
import { choosePerspective } from "../e2e/perspective-helpers";
import { expandProcessInputs, expectProcessMetrics, PROCESS_MONTH_DEFAULTS } from "../e2e/process-model-helpers";
import { formatProcessHours, formatProcessItems, monthModel } from "../../src/lib/domain/baseline";
import { MANUAL_LOOP_METRICS } from "../../src/lib/domain/manual-loop-presentation";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { DESKTOP_WIDTHS, PLAYABLE_CYCLES } from "../support/desktop-matrix";
import { LIVE_CHECKS, systemDesignTitle } from "./inventory";

const routes = [...new Set([
  ...staticRoutes.map((route) => `/${route.path}`), "/pharmacy/claims", "/#month",
  ...cases.flatMap((c) => [`/case/${c.id}`, `/case/${c.id}/trace`, `/case/${c.id}/record`]),
])];

test(LIVE_CHECKS.root, async ({ page }, info) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Most items need no person", exact: true })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Enter demo mode", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Guided tour", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.has(window, "__BSA_READ_DOMAIN_STATE__"))).toBe(false);
  await audit(page, info, "root", false);
});

test(LIVE_CHECKS.routes, async ({ page }, info) => {
  for (const route of routes) await test.step(route, async () => {
    await page.goto(route);
    for (const enabled of [true, false]) {
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("switch", { includeHidden: true })).toHaveCount(1);
      await expect(page.getByRole("main")).not.toContainText("This view could not be loaded");
    }
  });
  await captureJson(info, "current-routes-visited", routes);
});

test(LIVE_CHECKS.model, async ({ page }, info) => {
  await page.goto("/#month");
  await expandProcessInputs(page);
  await page.getByRole("textbox", { name: "Items in the monthly referral loop", exact: true }).fill("120");
  await page.getByRole("textbox", { name: "Today gathering minutes per item", exact: true }).fill("5");
  await page.getByRole("textbox", { name: "Pharmacy MYS minutes per referral", exact: true }).fill("7");
  const input = { ...PROCESS_MONTH_DEFAULTS, manualLoopItems: 120, gatheringMinutesToday: 5, mysCompletionMinutes: 7 };
  const expected = monthModel(input);
  for (const enabled of [false, true]) {
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await expectProcessMetrics(page, input, enabled);
  }
  await navigatePrimary(page, "NHSBSA queue");
  for (const { key, format } of MANUAL_LOOP_METRICS) {
    await expect(page.locator(`[data-projection-metric="${key}"]`))
      .toHaveText(`${format(expected.today[key])} / ${format(expected.withAgent[key])} (estimate)`);
  }
  await navigatePrimary(page, "Pharmacy claims");
  const projection = page.getByRole("region", { name: "Shared monthly process projection", exact: true });
  await expect(projection).toBeVisible();
  for (const enabled of [false, true]) {
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    for (const key of ["referredBackItems", "operatorHours", "pharmacyCompletionHours"] as const) {
      const format = key.endsWith("Hours") ? formatProcessHours : formatProcessItems;
      await expect(projection.locator(`[data-pharmacy-model="${key}"]`))
        .toHaveText(`${format(expected[enabled ? "withAgent" : "today"][key])}${enabled ? " (estimate)" : ""}`);
    }
    await expect(projection.locator('[data-pharmacy-model="prevented"]'))
      .toHaveText(enabled ? `${formatProcessItems(expected.cohorts.prevented)} (estimate)` : "0");
  }
  await captureJson(info, "shared-monthly-calculation", { input, expected, pharmacyText: await projection.innerText() });
});

test(LIVE_CHECKS.claims, async ({ page }) => {
  await page.goto("/pharmacy/claims");
  await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^All / }).click();
  const table = page.getByRole("table", { name: "Pharmacy claims", exact: true });
  const rows = table.locator("tbody tr:not([data-background-case])");
  await expect(rows).toHaveCount(4);
  await expect(table.locator("[data-background-case]")).toHaveCount(2);
  await expect(table.locator("[data-background-case] button, [data-background-case] a[href]")).toHaveCount(0);
  for (const { id } of PLAYABLE_CYCLES) {
    const row = rows.filter({ hasText: id });
    await expect(row).toHaveCount(1);
    await row.getByRole("button").click();
    await expect(page.getByRole("heading", { name: `Claim detail: ${id}`, exact: true })).toBeVisible();
  }
});

test(LIVE_CHECKS.queue, async ({ page }, info) => {
  await page.goto("/queue");
  const ids = await page.locator("[data-case-id], [data-type1-case]").evaluateAll((rows) =>
    rows.map((row) => row.getAttribute("data-case-id") ?? row.getAttribute("data-type1-case")));
  expect(ids.sort()).toEqual(["EX-24112", "EX-24123", "SYN-FQ123-MISMATCH"]);
  await expect(page.locator('[data-case-id="EX-24107"], [data-type1-case="EX-24107"]')).toHaveCount(0);
  for (const enabled of [false, true]) {
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await audit(page, info, "four-case-queue", enabled);
  }
});

test(LIVE_CHECKS.deepLinks, async ({ request }, info) => {
  const headers: { path: string; status: number; headers: Record<string, string> }[] = [];
  for (const path of ["/", "/pharmacy", "/pharmacy/claims", "/queue", "/case/EX-24112/trace", "/architecture"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^text\/html\b/);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["content-security-policy"]).toContain("default-src 'self'");
    expect(response.headers()["referrer-policy"]).toBeTruthy();
    expect(await response.text()).toContain('<div id="root">');
    headers.push({ path, status: response.status(), headers: response.headers() });
  }
  await captureJson(info, "deep-link-headers", headers);
});

test(LIVE_CHECKS.reset, async ({ page }) => {
  await page.goto("/pharmacy");
  await choosePerspective(page, "Pharmacy");
  await page.getByRole("banner").getByRole("switch").setChecked(true);
  const scenario = page.getByRole("radio", { name: "NCSO missing date", exact: true });
  await scenario.click();
  await expect(scenario).toBeChecked();
  const endorsement = page.getByRole("textbox", { name: "Dispenser endorsement", exact: true });
  const seedText = await endorsement.inputValue();
  await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
  await expect(endorsement).not.toHaveValue(seedText);
  await page.getByRole("button", { name: "Send claim", exact: true }).click();
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toContainText("EX-24112:2");
  await confirmReset(page);
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
  await expect(page.getByRole("radio", { name: "Pharmacy", exact: true })).toBeChecked();
  await expect(endorsement).toHaveValue(seedText);
  await expect(page.getByRole("region", { name: "Submission receipt", exact: true })).toHaveCount(0);
  await expect(page.locator("[data-pharmacy-released-count]")).toHaveText("0");
  await navigatePrimary(page, "Pharmacy claims");
  await page.getByRole("group", { name: "Claim filters", exact: true }).getByRole("button", { name: /^All / }).click();
  await expect(page.getByRole("table", { name: "Pharmacy claims", exact: true }).locator("tbody tr:not([data-background-case])")).toHaveCount(4);
  await expect(page.getByRole("table", { name: "Pharmacy claims", exact: true }).getByRole("row").filter({ hasText: "EX-24112" }))
    .toContainText(LIFECYCLE_LABELS.referred_back.pharmacy);
});

test(LIVE_CHECKS.background, async ({ page }) => {
  const retired = ["EX-24119", "EX-24088", "EX-24101", "SYN-FQ123-TYPE2", "SYN-FQ123-RECHECK", "SYN-FQ123-READABLE"];
  for (const route of ["/queue", "/pharmacy/claims"]) {
    await page.goto(route);
    const background = route === "/queue"
      ? page.getByRole("region", { name: "Background cases", exact: true })
      : page.locator('tbody[aria-label="Historical cases, background"]');
    await expect(background).toBeVisible();
    await expect(background).toContainText("EX-24119");
    await expect(background).toContainText("EX-24088");
    await expect(background.locator("a[href], button, input, select, textarea, [role=button], [tabindex]")).toHaveCount(0);
    for (const id of retired) {
      await expect(page.locator(`a[href*="${id}"], button[data-case-id="${id}"], [data-type1-case="${id}"]`)).toHaveCount(0);
    }
  }
  for (const id of retired) {
    await page.goto(`/case/${id}`);
    await expect(page.getByRole("main").getByText("Case not found", { exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Go to the queue", exact: true })).toHaveAttribute("href", "/queue");
    await expect(page.getByRole("button", { name: "Apply suggestion", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Release to pricing", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Follow this case", exact: true })).toHaveCount(0);
  }
});

for (const width of DESKTOP_WIDTHS) test(systemDesignTitle(width), async ({ page }, info) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/architecture");
  await expect(page.getByRole("heading", { name: "How it works and how it would scale", exact: true })).toBeVisible();
  const ids = ["proof", "alternatives", "governance", "architecture", "integration", "scale", "judgement", "costs", "questions", "reference-mapping"];
  const contents = page.getByRole("navigation", { name: "How it works contents", exact: true });
  for (const id of ids) {
    await expect(page.locator(`[data-design-section="${id}"]`)).toBeVisible();
    await contents.locator(`a[href="#${id}"]`).click();
    await expect(page).toHaveURL((url) => url.hash === `#${id}`);
  }
  const mapping = page.locator("table[data-reference-mapping]");
  await expect(mapping).toHaveCount(1);
  await expect(mapping.locator("caption")).toHaveText("Reference mapping, one example");
  const nonMappingText = await page.getByRole("main").evaluate((main) => {
    const copy = main.cloneNode(true) as HTMLElement;
    copy.querySelector("table[data-reference-mapping]")?.remove();
    return copy.textContent ?? "";
  });
  expect(nonMappingText).not.toMatch(/\b(?:Microsoft|Azure|OpenAI|Foundry|Copilot|AWS|Google|Anthropic)\b/i);
  for (const label of ["Built in this proof of concept", "Proposed for production", "Assumption to validate with NHSBSA"]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await audit(page, info, `system-design-${width}`, false, width === 1440);
});
