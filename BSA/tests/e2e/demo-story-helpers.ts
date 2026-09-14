import type { Page } from "@playwright/test";
import { expect } from "./fixtures";
import { enterDesktopDemo } from "./desktop-step-helpers";

export async function runGuidedReferralHandoff(page: Page) {
  await enterDesktopDemo(page, true);
  const strip = page.getByTestId("demo-strip");
  const jump = strip.getByRole("combobox", { name: "Jump to demo step" });
  const active = page.getByTestId("demo-assisted");
  const mismatch = "SYN-FQ123-MISMATCH";
  await jump.selectOption("4");
  await active.locator('[data-pharmacy-action="apply-correction"]').click();
  await active.locator('[data-pharmacy-action="submit"]').click();
  await expect(active.getByRole("region", { name: "Submission receipt", exact: true })).toContainText("released to existing pricing, no operator action");
  await strip.getByRole("button", { name: "Next", exact: true }).click();
  await active.locator('[data-pharmacy-action="submit"]').click();
  await expect(active.getByRole("region", { name: "Submission receipt", exact: true })).not.toContainText("released to existing pricing, no operator action");
  await jump.selectOption("8");
  await active.getByRole("button", { name: `Open ${mismatch}`, exact: true }).click();
  await active.getByRole("button", { name: "Start review", exact: true }).click();
  await active.getByRole("button", { name: "Apply suggestion", exact: true }).click();
  await expect(active.getByRole("button", { name: "Release to pricing", exact: true })).toBeDisabled();
  await active.getByRole("button", { name: "Refer back", exact: true }).click();
  const followed = page.getByRole("region", { name: "Followed item", exact: true });
  const event = await followed.locator("p").first().innerText();
  await strip.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByTestId("demo-step-screen")).toHaveAttribute("data-demo-step", "9");
  await expect(active.locator("[data-demo-live-case]")).toHaveAttribute("data-demo-live-case", mismatch);
  await expect(strip).toContainText(mismatch);
  await expect(strip).toContainText("EPS");
  await expect(active.locator('[data-pharmacy-action="apply-correction"]')).toBeVisible();
  await expect(active.locator('[data-pharmacy-action="resubmit"]')).toBeVisible();
  await expect(followed.locator("p").first()).toHaveText(event);
  await active.locator('[data-pharmacy-action="apply-correction"]').click();
  await active.locator('[data-pharmacy-action="resubmit"]').click();
  await expect(active.getByRole("button", { name: "Resubmit", exact: true })).toHaveCount(0);
  await expect(followed).toContainText(mismatch);
}
