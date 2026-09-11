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
  it("uses an advisory decimal 350,000 byte budget without rejecting any size", () => {
    expect(RUNTIME_BUDGET_BYTES).toBe(350_000);
    const report = measureRuntime(fixture);
    for (const gzipTotal of [349_999, 350_000, 350_001, 700_000]) expect(() => assertRuntimeBudget({ ...report, gzipTotal })).not.toThrow();
  });
  it("counts each asset's gzip independently, including extra chunks and fonts", () => {
    const files = [...fixture, { file: "assets/later.js", bytes: bytes("extra route") }, { file: "assets/font.woff2", bytes: bytes("font") }, { file: "assets/image.svg", bytes: bytes("<svg/>") }];
    const report = measureRuntime(files);
    expect(report.assets).toHaveLength(files.length);
    expect(report.gzipTotal).toBe(files.reduce((sum, file) => sum + gzipSync(file.bytes).length, 0));
  });
  it("counts hosting configuration as an emitted resource", () => {
    expect(measureRuntime([...fixture, { file: "staticwebapp.config.json", bytes: bytes("{}") }]).assets).toHaveLength(4);
  });
  it("reports incomplete scans without blocking builds", () => {
    expect(() => assertRuntimeBudget(measureRuntime([]))).not.toThrow();
    for (const missing of [".html", ".js", ".css"]) expect(() => assertRuntimeBudget(measureRuntime(fixture.filter((item) => !item.file.endsWith(missing))))).not.toThrow();
  });
});