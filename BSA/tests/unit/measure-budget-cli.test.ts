import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { measureRuntime } from "../../build/runtime-budget";

const cli = fileURLToPath(new URL("../../scripts/measure-budget.mjs", import.meta.url));
const temporary: string[] = [];
const bytes = (text: string) => Buffer.from(text);
const minimum = [
  { file: "index.html", bytes: bytes("<html>App</html>") },
  { file: "assets/app.js", bytes: bytes("console.log('app')") },
  { file: "assets/app.css", bytes: bytes("body{color:black}") },
];

function run(files: { file: string; bytes: Uint8Array }[]) {
  const directory = mkdtempSync(resolve(tmpdir(), "bsa-budget-"));
  temporary.push(directory);
  mkdirSync(resolve(directory, "assets"));
  for (const file of files) writeFileSync(resolve(directory, file.file), file.bytes);
  return spawnSync(process.execPath, [cli, directory], { encoding: "utf8" });
}

afterEach(() => {
  for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("standalone measure-budget command", () => {
  it("matches the build gate and includes fonts, extra chunks and public assets", () => {
    const files = [...minimum,
      { file: "assets/font.woff2", bytes: bytes("font") },
      { file: "assets/extra.js", bytes: bytes("extra") },
      { file: "image.svg", bytes: bytes("<svg/>") },
      { file: ".nojekyll", bytes: bytes("") },
    ];
    const result = run(files);
    expect(result.status, result.stderr).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report).toMatchObject({ gzipTotal: measureRuntime(files).gzipTotal, limit: 200_000, complete: true, passed: true });
    expect(report.assets).toHaveLength(6);
  });

  it("fails when an extra binary resource exceeds the strict budget", () => {
    const result = run([...minimum, { file: "assets/large.bin", bytes: randomBytes(200_000) }]);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).passed).toBe(false);
    expect(result.stderr).toContain("must be below 200000");
  });

  it("fails incomplete and empty directories rather than reporting a vacuous pass", () => {
    for (const files of [[], minimum.slice(1)]) {
      const result = run(files);
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout)).toMatchObject({ complete: false, passed: false });
      expect(result.stderr).toContain("requires HTML, CSS and JavaScript");
    }
  });
});