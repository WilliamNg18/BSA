import { automaticCaseIds, cases, expect, navigatePrimary, staticRoutes, test } from "./fixtures";
import { DEMO_STEPS, demoStepDestination } from "../../src/lib/domain/demo-steps";
import { enterDesktopDemo } from "./desktop-step-helpers";

for (const enabled of [true, false]) {
  const stateTag = enabled ? "@agent-on" : "@agent-off";
  for (const width of [1280, 1440]) {
    for (const action of ["Escape", "Keep working", "Reset demonstration"]) {
      test(`reset focus ${action} width=${width} agent=${enabled}`, { tag: ["@hosted-qa", "@reset-focus", stateTag] }, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("pharmacy");
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        const field = page.getByRole("textbox", { name: "Dispenser endorsement" });
        const seed = await field.inputValue();
        await field.fill("NCSO RK 21/08/26");
        const trigger = page.getByRole("button", { name: "Reset demo", exact: true });
        // Reopening verifies that close autofocus does not discard the next trigger.
        for (let attempt = 0; attempt < 2; attempt++) {
          await trigger.focus();
          await page.keyboard.press("Enter");
          const dialog = page.getByRole("alertdialog");
          await expect(dialog.getByRole("button", { name: "Keep working" })).toBeFocused();
          if (action === "Escape") await page.keyboard.press("Escape");
          else {
            await dialog.getByRole("button", { name: action, exact: true }).focus();
            await page.keyboard.press("Enter");
          }
          await expect(dialog).toHaveCount(0);
          await expect(trigger).toBeFocused();
          await expect(field).toHaveValue(action === "Reset demonstration" ? seed : "NCSO RK 21/08/26");
          await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: action !== "Reset demonstration" && enabled });
          await expect(page).toHaveURL(/\/pharmacy$/);
        }
      });
    }
  }

  test(`rapid consecutive tour inputs agent=${enabled}`, { tag: ["@hosted-qa", "@fast-keyboard", stateTag] }, async ({ page }) => {
    await enterDesktopDemo(page, enabled);
    const rail = page.getByTestId("demo-strip");
    const screen = page.getByTestId("demo-step-screen");
    // The native switch is an input; shortcuts deliberately ignore fields.
    await page.getByRole("heading", { level: 1 }).focus();
    // Real keyboard events, deliberately no screenshot, sleep or assertion
    // between inputs. Cross both hash and pathname transitions in both directions.
    for (let pass = 0; pass < 3; pass++) {
      for (let step = 1; step < DEMO_STEPS.length; step++) await page.keyboard.press("Alt+ArrowRight");
      await expect(page).toHaveURL(/#close$/);
      await expect(screen).toHaveAttribute("data-demo-step", "11");
      await expect(rail).toContainText("11 / 11");
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      for (let step = 1; step < DEMO_STEPS.length; step++) await page.keyboard.press("Alt+ArrowLeft");
      await expect(page).toHaveURL(/#scene$/);
      await expect(screen).toHaveAttribute("data-demo-step", "1");
      await expect(rail).toContainText("1 / 11");
    }
    // A same-task burst deterministically exercises history ahead of React's
    // commit. Assert EVERY requested stop, including immediate reversals/limits.
    const directions = [1, -1, -1, ...Array<number>(DEMO_STEPS.length).fill(1), ...Array<number>(DEMO_STEPS.length).fill(-1)];
    let index = 0;
    const expected = directions.map((direction) => {
      index = Math.max(0, Math.min(DEMO_STEPS.length - 1, index + direction));
      const destination = new URL(demoStepDestination(DEMO_STEPS[index]), "http://demo.invalid");
      return `${destination.pathname}${destination.search}${destination.hash}`;
    });
    const visited = await page.evaluate((steps) => steps.map((direction) => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: direction > 0 ? "ArrowRight" : "ArrowLeft", altKey: true, bubbles: true, cancelable: true }));
      return `${location.pathname}${location.search}${location.hash}`;
    }), directions);
    expect(visited).toEqual(expected);
    await expect(page).toHaveURL(/#scene$/);
    await expect(screen).toHaveAttribute("data-demo-step", "1");
    await rail.getByRole("button", { name: "Exit demo", exact: true }).press("Enter");
    await expect(screen).toHaveCount(0);
    // Ordinary browser history stays ordinary; explicit re-entry starts the focused demo.
    await navigatePrimary(page, "Pharmacy check");
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page.goBack();
    await expect(page).toHaveURL(/#scene$/);
    await expect(screen).toHaveCount(0);
    await page.goForward();
    await expect(page).toHaveURL(/\/pharmacy$/);
    await expect(screen).toHaveCount(0);
    await rail.getByRole("button", { name: "Enter demo mode", exact: true }).press("Enter");
    await expect(screen).toHaveAttribute("data-demo-step", "1");
    await expect(screen.getByRole("heading", { level: 1 })).toBeFocused();
    await page.keyboard.press("Alt+ArrowRight");
    await expect(page).toHaveURL(/#month$/);
    await expect(screen).toHaveAttribute("data-demo-step", "2");
    await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
  });

  test(`generic production labels including Architecture agent=${enabled}`, { tag: ["@hosted-qa", "@vendor-copy", stateTag] }, async ({ page }) => {
    test.setTimeout(90_000);
    const routes = [
      ...staticRoutes.map((route) => route.path || "./"),
      ...["month", "pipeline", "cases", "two-places", "close"].map((chapter) => `./#${chapter}`),
      ...cases.flatMap(({ id }) => [`case/${id}`, `case/${id}/trace`, `case/${id}/record`]),
      "unknown-page", "notes", "case/UNKNOWN", "case/UNKNOWN/trace", "case/UNKNOWN/record",
    ];
    for (const route of routes) {
      await page.goto(route);
      await page.getByRole("banner").getByRole("switch").setChecked(enabled);
      if (route.startsWith("case/UNKNOWN")) await expect(page.getByText("Case not found", { exact: true })).toBeVisible();
      else await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (route.endsWith("/trace") && !route.includes("UNKNOWN")) {
        if (enabled && !automaticCaseIds.some((id) => route === `case/${id}/trace`)) {
          await page.getByRole("button", { name: "Show all", exact: true }).click();
        } else if (enabled) {
          await expect(page.getByRole("list", { name: "Deterministic clearance trace", exact: true })).toContainText("Cleared by rules; agent not invoked");
          await expect(page.getByRole("button", { name: "Show all", exact: true })).toHaveCount(0);
          await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
        }
        else {
          const complete = [...automaticCaseIds, "EX-24088"].some((id) => route === `case/${id}/trace`);
          await expect(page.getByRole("list", { name: "Manual gathering trace", exact: true }).locator(":scope > li")).toHaveCount(complete ? 0 : 7);
          await expect(page.getByRole("list", { name: "Agent trace", exact: true })).toHaveCount(0);
        }
      }
      // Include expanded disclosures and audit metadata, not just default copy.
      await page.locator("main details").evaluateAll((elements) => elements.forEach((element) => element.setAttribute("open", "")));
      const mapping = page.locator("table[data-reference-mapping]");
      await expect(mapping).toHaveCount(route === "architecture" ? 1 : 0);
      if (route === "architecture") await expect(mapping.locator("caption")).toHaveText("Reference mapping, one example");
      const neutralText = await page.locator("body").evaluate((body) => {
        const copy = body.cloneNode(true) as HTMLElement;
        copy.querySelector("table[data-reference-mapping]")?.remove();
        return copy.textContent ?? "";
      });
      expect(neutralText, route).not.toMatch(/\b(?:Azure|OpenAI|Cosmos DB|Copilot|Microsoft|Foundry|Purview|Entra|Key Vault|Private Link|Application Insights|GitHub Actions|Bicep|Terraform|TypeScript)\b/i);
      await expect(page.locator('a[href$=".pdf"], a[href$=".docx"]')).toHaveCount(0);
      if (route === "architecture") {
        await expect(page.getByRole("main")).toContainText("Equivalents exist on other platforms");
        await expect(page.getByRole("main")).toContainText("NHSBSA");
        await expect(page.getByRole("main")).toContainText("dm+d");
        for (const tool of ["Read image region", "look up product/pack", "look up claim", "check history", "retrieve the effective-date Tariff clause"]) {
          await expect(page.getByRole("main")).toContainText(tool);
        }
        await expect(page.getByRole("main")).toContainText("Recording is application-owned, not a model write tool");
      }
      if (route === "case/EX-24088/record") {
        await expect(page.getByRole("heading", { name: "Record DR-000872", exact: true })).toBeVisible();
        await expect(page.getByRole("combobox", { name: "Replay with", exact: true })).toBeDisabled();
        await expect(page.locator("[data-original-records]")).toContainText("DR-000871");
        await expect(page.locator("[data-original-records]")).toContainText("Original rule: 2026-08");
        await expect(page.locator("[data-original-records]")).toContainText("Human reason:");
      }
    }
  });
}
