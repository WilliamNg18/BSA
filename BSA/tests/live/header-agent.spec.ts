import { test } from "./fixtures";
import { agentRoutes, assertHeaderAgent } from "../e2e/header-agent-helpers";
import { headerCheckTitle, LIVE_PERSPECTIVES } from "./inventory";

for (const perspective of LIVE_PERSPECTIVES) {
  test(headerCheckTitle(perspective), async ({ page }) => {
    for (const route of agentRoutes) {
      await test.step(route, () => assertHeaderAgent(page, route, perspective));
    }
  });
}
