import { fileURLToPath, URL } from "node:url";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { runtimeCss } from "./build/runtime-css";
import { radixTreeShaking } from "./build/radix-tree-shaking";
import { readFileSync } from "node:fs";

const routerRoot = dirname(createRequire(import.meta.url).resolve("react-router/package.json"));

export default defineConfig(({ command }) => ({
  base: "/",
  plugins: [runtimeCss(fileURLToPath(new URL(".", import.meta.url))), radixTreeShaking(), react(), tailwindcss(), {
    name: "static-web-app-configuration",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "staticwebapp.config.json", source: readFileSync(fileURLToPath(new URL("../staticwebapp.config.json", import.meta.url))) });
    },
  }],
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      // Router 7.18 exports its development entry even for production builds.
      // Use the package's own production files, not a warning-stripping shim.
      ...(command === "build" ? [
        { find: /^react-router$/, replacement: resolve(routerRoot, "dist/production/index.mjs") },
        { find: /^react-router\/dom$/, replacement: resolve(routerRoot, "dist/production/dom-export.mjs") },
      ] : []),
    ],
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    cssMinify: "esbuild",
    terserOptions: { compress: { passes: 3 }, format: { comments: false } },
    reportCompressedSize: false,
    chunkSizeWarningLimit: Number.POSITIVE_INFINITY,
  },
}));
