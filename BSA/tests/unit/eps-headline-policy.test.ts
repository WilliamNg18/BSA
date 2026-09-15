import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkEpsHeadlines, scanEpsHeadlines } from "../../scripts/check-eps-headlines.mjs";

const clause = `const clauses = [{ id: "P2-C9", endorsementType: "NCSO", text: "An endorsement not dated fails the dated requirement.", requirements: [] }];`;

describe("retired EPS date-error headline guard", () => {
  it.each(["Missing date", "missing-date", "MISSING THE DATE", "not dated"])("rejects %s in source headings", (text) => {
    expect(scanEpsHeadlines("src/example.tsx", `const title = "${text}";`))
      .toEqual([expect.objectContaining({ text, line: 1 })]);
  });

  it("allows only the actual NCSO clause text, not the whole Tariff file", () => {
    expect(scanEpsHeadlines("src\\lib\\domain\\tariff.ts", clause)).toEqual([]);
    expect(scanEpsHeadlines("src/lib/domain/tariff.ts", `${clause}\nconst heading = "missing date";`))
      .toEqual([{ path: "src/lib/domain/tariff.ts", line: 2, column: 18, text: "missing date" }]);
  });

  it("does not allow a Tariff title, unrelated clause, copied object or another export", () => {
    expect(scanEpsHeadlines("src/lib/domain/tariff.ts", clause.replace('text: "', 'title: "'))).toHaveLength(1);
    expect(scanEpsHeadlines("src/lib/domain/tariff.ts", clause.replace('"P2-C9"', '"P2-C8"'))).toHaveLength(1);
    expect(scanEpsHeadlines("src/pages/case-pack.tsx", clause)).toHaveLength(1);
    expect(scanEpsHeadlines("src/lib/domain/tariff.ts", 'const text = "not dated";')).toHaveLength(1);
  });

  it("rejects a source-history whitelist, a comment waiver and adjacent JSX", () => {
    expect(scanEpsHeadlines("src/lib/domain/reference.ts", 'const history = ["NCSO not dated"];')).toHaveLength(1);
    expect(scanEpsHeadlines("src/page.tsx", '// allow missing-date\nconst heading = <h1>Not dated</h1>;')).toHaveLength(2);
  });

  it("accepts strength headlines and the real initialled-and-dated requirement", () => {
    expect(scanEpsHeadlines("src/page.tsx",
      'const labels = ["EPS: wrong strength", "Strength mismatch: prescribed 10mg, selected 5mg", "NCSO initialled and dated"];')).toEqual([]);
  });

  it("walks nested production source without scanning historical test records outside src", async () => {
    const root = await mkdtemp(join(tmpdir(), "bsa-eps-headlines-"));
    try {
      await mkdir(join(root, "src", "lib", "domain"), { recursive: true });
      await mkdir(join(root, "src", "components"), { recursive: true });
      await mkdir(join(root, "tests"), { recursive: true });
      await writeFile(join(root, "src", "lib", "domain", "tariff.ts"), clause);
      await writeFile(join(root, "src", "components", "case.tsx"), 'export const title = <h1>Missing date</h1>;');
      await writeFile(join(root, "tests", "historical.test.ts"), 'const original = "not dated";');
      expect(await checkEpsHeadlines(root)).toEqual([
        expect.objectContaining({ path: join("src", "components", "case.tsx"), line: 1, text: "Missing date" }),
      ]);
      await writeFile(join(root, "src", "components", "case.tsx"), 'export const title = <h1>EPS: wrong strength</h1>;');
      expect(await checkEpsHeadlines(root)).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
