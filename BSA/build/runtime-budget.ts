import { readFile, readdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { gzipSync } from "node:zlib";
import type { Plugin } from "vite";

export const RUNTIME_BUDGET_BYTES = 350_000;

export function measureRuntime(files: { file: string; bytes: Uint8Array }[]) {
  // Count every emitted resource independently, including hosting configuration.
  const assets = files.map(({ file, bytes }) => ({ file, raw: bytes.length, gzip: gzipSync(bytes).length }));
  return { assets, gzipTotal: assets.reduce((sum, asset) => sum + asset.gzip, 0), limit: RUNTIME_BUDGET_BYTES };
}

export function assertRuntimeBudget(report: ReturnType<typeof measureRuntime>) {
  console.log(`Advisory runtime payload: ${report.gzipTotal}/${RUNTIME_BUDGET_BYTES} gzip bytes (all emitted assets; decimal bytes)`);
  if (![".js", ".css", ".html"].every((suffix) => report.assets.some(({ file }) => file.endsWith(suffix)))) console.warn("Advisory: runtime measurement requires HTML, CSS and JavaScript for a complete report");
  if (report.gzipTotal >= RUNTIME_BUDGET_BYTES) console.warn("Advisory: runtime payload meets or exceeds the budget");
}

export function runtimeBudget(): Plugin {
  let outDir: string;
  return {
    name: "complete-eager-runtime-budget",
    apply: "build",
    enforce: "post",
    configResolved(config) { outDir = resolve(config.root, config.build.outDir); },
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.dynamicImports.length) this.error(`Asynchronous runtime chunks are forbidden: ${chunk.fileName}`);
      }
    },
    async writeBundle() {
      const entries = await readdir(outDir, { recursive: true, withFileTypes: true });
      const files = await Promise.all(entries.filter((entry) => entry.isFile()).map(async (entry) => {
        const path = resolve(entry.parentPath, entry.name);
        return { file: relative(outDir, path).replaceAll("\\", "/"), bytes: await readFile(path) };
      }));
      const report = measureRuntime(files);
      assertRuntimeBudget(report);
    },
  };
}