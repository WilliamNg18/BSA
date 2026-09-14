import AxeBuilder from "@axe-core/playwright";
import { captureJson, expect, test } from "./fixtures";
import { enterDesktopDemo } from "./desktop-step-helpers";

for (const caseId of ["EX-24107", "EX-24123"]) for (const enabled of [false, true]) {
  test(`demo Follow overrides narrative steps for ${caseId}, Agent ${enabled}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await enterDesktopDemo(page, enabled);
    const jump = page.getByRole("combobox", { name: "Jump to demo step" });
    await jump.selectOption(caseId === "EX-24107" ? "3" : "6");
    const follow = page.getByRole("region", { name: "Followed item", exact: true });
    const lastEvent = await follow.locator("p").first().innerText();
    for (const step of [1, 2, 11]) {
      await jump.selectOption(String(step));
      for (const side of ["Pharmacy", "NHSBSA"]) {
        await follow.getByRole("button", { name: `${side} view`, exact: true }).click();
        const screen = page.getByTestId("demo-step-screen");
        await expect(screen).toHaveAttribute("data-demo-step", String(step));
        await expect(screen).toHaveAttribute("data-demo-case", caseId);
        await expect(screen.getByRole("heading", { level: 1 })).toHaveText(`Following ${caseId} from step ${step}`);
        await expect(screen.getByRole("heading", { level: 1 })).toBeFocused();
        await expect(screen.locator("[data-demo-live-case]")).toHaveAttribute("data-demo-live-case", caseId);
        await expect(screen.locator("[data-demo-live-case]")).toHaveAttribute("data-demo-live-kind", side === "Pharmacy" ? "claim" : caseId === "EX-24123" ? "type1" : "operator");
        await expect(screen.locator("[data-demo-month], [data-demo-pipeline], [data-demo-control=queue-filter]")).toHaveCount(0);
        await expect(page.getByTestId("demo-strip")).toContainText(caseId);
        await expect(follow.locator("p").first()).toHaveText(lastEvent);
        const inactive = page.getByTestId(enabled ? "demo-today" : "demo-assisted");
        await expect(inactive).toContainText(caseId);
        await expect(inactive.locator("button,input,select,textarea,a[href]")).toHaveCount(0);
        if (caseId === "EX-24107") await expect(inactive).toContainText(enabled ? "no person involved" : "no operator action");
        const result = await new AxeBuilder({ page }).analyze();
        await captureJson(info, `follow-${step}-${side}-axe`, { violations: result.violations, incomplete: result.incomplete });
        expect(result.violations).toEqual([]);
      }
    }
  });
}

test("demo keyboard navigation focuses headings and Exit retains the followed history", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await enterDesktopDemo(page, false);
  const strip = page.getByTestId("demo-strip");
  await strip.getByRole("button", { name: "Next", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "3");
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
  const history = await page.getByRole("region", { name: "Followed item", exact: true }).locator("p").first().innerText();
  await page.getByRole("combobox", { name: "Jump to demo step" }).selectOption("4");
  const input = page.getByTestId("demo-step-screen").locator("input,textarea").first();
  await input.focus();
  await page.keyboard.press("Alt+ArrowRight");
  await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "4");
  await page.getByRole("combobox", { name: "Jump to demo step" }).selectOption("3");
  await strip.getByRole("button", { name: "Exit demo", exact: true }).click();
  await expect(page.getByTestId("demo-step-screen")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Primary", exact: true })).toBeVisible();
  await expect(page.locator("[data-pharmacy-case]")).toHaveAttribute("data-pharmacy-case", "EX-24107");
  await expect(page.getByRole("region", { name: "Followed item", exact: true }).locator("p").first()).toHaveText(history);
  await expect(page.getByRole("banner").getByRole("switch")).not.toBeChecked();
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`demo ${reducedMotion} motion keeps text opaque and has accessible light/dark final states`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion });
    await enterDesktopDemo(page, false);
    for (const dark of [false, true]) {
      await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
      for (const enabled of [true, false]) {
        await page.getByRole("banner").getByRole("switch").setChecked(enabled);
        const assisted = page.getByTestId("demo-assisted");
        await expect(assisted).toHaveAttribute("data-readonly", String(!enabled));
        const style = await assisted.evaluate((element) => {
          const computed = getComputedStyle(element);
          return { opacity: computed.opacity, transform: computed.transform, duration: computed.animationDuration };
        });
        expect(style.opacity).toBe("1");
        if (reducedMotion === "reduce") expect(style.transform).toBe("none");
        if (enabled && reducedMotion === "no-preference") expect(style.duration).toBe("2s");
        const result = await new AxeBuilder({ page }).analyze();
        await captureJson(info, `${dark ? "dark" : "light"}-${enabled ? "on" : "off"}-axe`, { violations: result.violations, incomplete: result.incomplete });
        expect(result.violations).toEqual([]);
      }
    }
  });
}
