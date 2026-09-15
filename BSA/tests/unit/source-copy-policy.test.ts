import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkSourceCopy, scanSourceCopy } from "../../scripts/check-source-copy.mjs";

describe("source platform-neutrality boundary", () => {
  it("checks all production source with no whole-file whitelist", async () => {
    expect(await checkSourceCopy(fileURLToPath(new URL("../..", import.meta.url)))).toEqual([]);
  });
  it("exempts package imports, not adjacent interface copy or metadata", () => {
    const findings = scanSourceCopy("src/example.ts", "import sdk from '@azure/example';\nexport const label = 'Azure OpenAI';");
    expect(findings.map((finding) => [finding.line, finding.text])).toEqual([[2, "Azure"], [2, "OpenAI"]]);
  });
  it("permits concrete names only in the example service cells", () => {
    const code = "export const REFERENCE_MAPPING = { caption: 'Reference mapping, one example', rows: [['Hosted model endpoint', 'Azure OpenAI']] };";
    expect(scanSourceCopy("src\\components\\how-it-works\\reference-mapping.ts", code)).toEqual([]);
    expect(scanSourceCopy("src/pages/architecture.tsx", code)).toHaveLength(2);
    expect(scanSourceCopy("src/components/how-it-works/reference-mapping.ts", `${code}\nexport const heading = 'Microsoft';`))
      .toEqual([expect.objectContaining({ line: 2, text: "Microsoft" })]);
  });
  it("does not exempt the mapping caption, capability labels or another export", () => {
    const path = "src/components/how-it-works/reference-mapping.ts";
    expect(scanSourceCopy(path, "export const REFERENCE_MAPPING = { caption: 'Azure', rows: [['Microsoft', 'Azure OpenAI']] };")
      .map((finding) => finding.text)).toEqual(["Azure", "Microsoft"]);
    expect(scanSourceCopy(path, "export const OTHER = { rows: [['Model', 'Azure OpenAI']] };")).toHaveLength(2);
  });
  it("retains exact source positions and rejects active vendor configuration", () => {
    expect(scanSourceCopy("src/lib/config.ts", "\nconst productionService = 'Azure Functions';"))
      .toEqual([{ path: "src/lib/config.ts", line: 2, column: 28, text: "Azure" }]);
  });
});
