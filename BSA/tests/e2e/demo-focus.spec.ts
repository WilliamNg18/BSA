import { captureJson, expect, test } from "./fixtures";

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`demo entry focuses each committed destination once without stealing Jump focus, motion=${reducedMotion}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(() => {
      const calls: { step: string | null; href: string }[] = [];
      Reflect.set(window, "__BSA_DEMO_FOCUS_CALLS__", calls);
      const original = HTMLElement.prototype.focus;
      HTMLElement.prototype.focus = function (options?: FocusOptions) {
        const screen = this.closest('[data-testid="demo-step-screen"]');
        if (this.tagName === "H1" && screen) {
          calls.push({ step: screen.getAttribute("data-demo-step"), href: window.location.href });
        }
        return original.call(this, options);
      };
    });
    await page.goto("/#scene");
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    const strip = page.getByTestId("demo-strip");
    const screen = page.getByTestId("demo-step-screen");
    const jump = strip.getByRole("combobox", { name: "Jump to demo step", exact: true });
    const focusCalls = () => page.evaluate(() => {
      const calls: unknown = Reflect.get(window, "__BSA_DEMO_FOCUS_CALLS__");
      if (!Array.isArray(calls)) throw new Error("The read-only focus observer is unavailable.");
      return calls as { step: string | null; href: string }[];
    });
    await strip.getByRole("button", { name: "Enter demo mode", exact: true }).press("Enter");
    await expect(screen).toHaveAttribute("data-demo-step", "1");
    await expect(screen.getByRole("heading", { level: 1 })).toBeFocused();
    await jump.focus();
    await expect(jump).toBeFocused();
    await jump.press("Space");
    await page.keyboard.press("Escape");
    await expect(jump).toBeFocused();
    expect(await focusCalls()).toEqual([{ step: "1", href: new URL("/#pipeline", page.url()).href }]);

    await strip.getByRole("button", { name: "Next", exact: true }).press("Enter");
    await expect(screen).toHaveAttribute("data-demo-step", "2");
    await expect(screen.getByRole("heading", { level: 1 })).toBeFocused();
    await jump.focus();
    await expect(jump).toBeFocused();
    expect(await focusCalls()).toHaveLength(2);
    await strip.getByRole("button", { name: "Back", exact: true }).press("Enter");
    await expect(screen).toHaveAttribute("data-demo-step", "1");
    await expect(screen.getByRole("heading", { level: 1 })).toBeFocused();
    await jump.focus();
    await expect(jump).toBeFocused();
    expect(await focusCalls()).toHaveLength(3);
    await jump.selectOption("7");
    await expect(screen.getByRole("heading", { level: 1 })).toBeFocused();
    await jump.focus();
    await expect(jump).toBeFocused();
    expect(await focusCalls()).toHaveLength(4);
    await page.getByRole("region", { name: "Followed item", exact: true })
      .getByRole("button", { name: "NHSBSA view", exact: true }).click();
    await expect(screen.getByRole("heading", { level: 1 })).toBeFocused();
    await jump.focus();
    await expect(jump).toBeFocused();
    const calls = await focusCalls();
    expect(calls).toHaveLength(5);
    expect(calls.map((call) => call.step)).toEqual(["1", "2", "1", "7", "7"]);
    expect(calls.at(-1)?.href).toBe(new URL("/case/EX-24123", page.url()).href);
    await captureJson(info, "committed-demo-focus-calls", calls);
  });
}
