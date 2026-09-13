import { test } from "./fixtures";
import { agentRoutes, assertHeaderAgent, perspectiveNames } from "../e2e/header-agent-helpers";
import type { Perspective } from "../../src/lib/store";

for (const perspective of Object.keys(perspectiveNames) as Perspective[]) {
  test(`15 Single header Agent toggle on every route in ${perspective}`, async ({ page }) => {
    for (const route of agentRoutes) {
      await test.step(route, () => assertHeaderAgent(page, route, perspective));
    }
  });
}
