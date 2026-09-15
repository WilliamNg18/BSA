import { describe, expect, it } from "vitest";
import { scanEpsHeadlines } from "../../scripts/check-eps-headlines.mjs";

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
});
