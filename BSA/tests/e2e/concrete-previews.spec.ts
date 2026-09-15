import { test } from "./fixtures";
import { DEMO_MODES, DESKTOP_WIDTHS } from "../support/desktop-matrix";
import { verifyConcretePreviews } from "./concrete-preview-helpers";

for (const width of DESKTOP_WIDTHS) for (const enabled of DEMO_MODES) {
  test(`concrete date, product and manual invoice previews, ${width}, Agent ${enabled ? "On" : "Off"}`, async ({ page }) => {
    test.setTimeout(120_000);
    await verifyConcretePreviews(page, width, enabled);
  });
}
