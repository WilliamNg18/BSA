import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("only the header component can set the shared Agent mode", () => {
  const root = fileURLToPath(new URL("../../src/", import.meta.url));
  function writers(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return writers(path);
      return entry.name.endsWith(".tsx") && /\bsetAgentEnabled\b/.test(readFileSync(path, "utf8")) ? [path] : [];
    });

    it("keeps Agent help accessible without a focus popup covering navigation", () => {
      const header = readFileSync(fileURLToPath(new URL("../../src/components/demo/top-nav.tsx", import.meta.url)), "utf8");
      expect(header).toContain('aria-describedby="agent-help"');
      expect(header).toContain('id="agent-help"');
      expect(header).toContain("Off withholds recommendations; evidence and human decisions remain.");
      expect(header).not.toContain("Tooltip");
    });
  }
  expect(writers(root)).toEqual([join(root, "components", "demo", "top-nav.tsx")]);
  expect(readFileSync(join(root, "components", "demo", "pharmacy-workbench.tsx"), "utf8")).not.toMatch(/agentAvailable|setAgentAvailable/);
});
