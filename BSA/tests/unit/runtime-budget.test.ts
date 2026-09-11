import { describe, expect, it } from "vitest";
import { gzipSync } from "node:zlib";
import { assertRuntimeBudget, measureRuntime, RUNTIME_BUDGET_BYTES } from "../../build/runtime-budget";

const bytes = (value: string) => new TextEncoder().encode(value);
const fixture = [
  { file: "index.html", bytes: bytes("<html>App</html>") },
  { file: "assets/app.js", bytes: bytes("console.log('app')") },
  { file: "assets/app.css", bytes: bytes("body{color:black}") },
];

describe("complete eager runtime budget", () => {
  it("uses a strict decimal 200,000 byte cap, not 200 KiB", () => {
    expect(RUNTIME_BUDGET_BYTES).toBe(200_000);
    const report = measureRuntime(fixture);
    expect(() => assertRuntimeBudget({ ...report, gzipTotal: 199_999 })).not.toThrow();
    for (const gzipTotal of [200_000, 204_799, 204_800]) expect(() => assertRuntimeBudget({ ...report, gzipTotal })).toThrow(/must be below/);
  });
  it("counts each asset's gzip independently, including extra chunks and fonts", () => {
    const files = [...fixture, { file: "assets/later.js", bytes: bytes("extra route") }, { file: "assets/font.woff2", bytes: bytes("font") }, { file: "assets/image.svg", bytes: bytes("<svg/>") }];
    const report = measureRuntime(files);
    expect(report.assets).toHaveLength(files.length);
    expect(report.gzipTotal).toBe(files.reduce((sum, file) => sum + gzipSync(file.bytes).length, 0));
  });
  it("excludes only the empty hosting marker", () => {
    expect(measureRuntime([...fixture, { file: ".nojekyll", bytes: bytes("") }])).toEqual(measureRuntime(fixture));
    expect(measureRuntime([...fixture, { file: ".nojekyll", bytes: bytes("not empty") }]).assets).toHaveLength(4);
  });
  it("rejects vacuous or incomplete scans", () => {
    expect(() => assertRuntimeBudget(measureRuntime([]))).toThrow(/requires/);
    for (const missing of [".html", ".js", ".css"]) expect(() => assertRuntimeBudget(measureRuntime(fixture.filter((item) => !item.file.endsWith(missing))))).toThrow(/requires/);
  });
});