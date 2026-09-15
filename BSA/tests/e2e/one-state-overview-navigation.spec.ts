import { captureJson, expect, navigatePrimary, test } from "./fixtures";
import { readDomainState } from "./one-state-helpers";
import { TOUR_CHAPTERS } from "../../src/lib/tour-navigation";

for (const enabled of [false, true]) {
  test(`ordinary overview links preserve the complete session and disappear in demo, Agent ${enabled}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/pharmacy?case=EX-24112&channel=eps");
    await page.getByRole("banner").getByRole("switch").setChecked(enabled);
    await page.getByRole("textbox", { name: "Dispenser endorsement", exact: true }).fill("NCSO retained human draft");
    const before = await readDomainState(page);
    await navigatePrimary(page, "Overview");
    const sections = page.getByRole("navigation", { name: "Overview sections", exact: true });
    await expect(sections.getByRole("link")).toHaveCount(6);
    for (const section of TOUR_CHAPTERS) {
      const link = sections.getByRole("link", { name: section.label, exact: true });
      await expect(link).toHaveAttribute("href", section.to);
      await link.click();
      await expect(page).toHaveURL((url) => `${url.pathname}${url.hash}` === section.to);
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeFocused();
      await expect(link).toHaveAttribute("aria-current", "page");
      expect(await readDomainState(page)).toEqual(before);
    }
    await page.getByRole("button", { name: "Enter demo mode", exact: true }).click();
    await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "1");
    await expect(sections).toHaveCount(0);
    expect(await readDomainState(page)).toEqual(before);
    await page.getByRole("button", { name: "Exit demo", exact: true }).click();
    await expect(sections).toBeVisible();
    expect(await readDomainState(page)).toEqual(before);
    await captureJson(info, "overview-link-domain-invariance", before);
  });
}
