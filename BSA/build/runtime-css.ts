import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";
import type { Plugin } from "vite";

/** Scan all reachable local modules, including conditional UI, not tests/docs or unused templates. */
export function runtimeCss(root: string): Plugin {
  return {
    name: "runtime-css-sources",
    apply: "build",
    enforce: "pre",
    transform(code, id) {
      if (id !== resolve(root, "src/index.css").replaceAll("\\", "/")) return;
      const visited = new Set<string>();
      function visit(file: string) {
        if (visited.has(file)) return;
        visited.add(file);
        const source = readFileSync(file, "utf8");
        for (const { fileName } of ts.preProcessFile(source).importedFiles) {
          if (!fileName.startsWith(".") && !fileName.startsWith("@/")) continue;
          const base = fileName.startsWith("@/") ? resolve(root, "src", fileName.slice(2)) : resolve(dirname(file), fileName);
          const dependency = [base, ...[".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"].map((ext) => base + ext)].find((path) => /\.[jt]sx?$/.test(path) && existsSync(path));
          if (dependency) visit(dependency);
          else if (!/\.(css|svg|png|woff2?)$/.test(fileName)) throw new Error(`Unresolved CSS source dependency: ${fileName} in ${file}`);
        }
      }
      visit(resolve(root, "src/main.tsx"));
      const sources = [...visited].sort().map((file) => `@source "${file.replaceAll("\\", "/")}";`).join("\n");
      return code.replace('@import "tailwindcss" source(".");', `@import "tailwindcss" source(none);\n${sources}`);
    },
  };
}