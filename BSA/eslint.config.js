import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["framer-motion"], message: "Use `motion/react`." },
            { group: ["@radix-ui/react-*"], message: "Import Radix primitives from the unified `radix-ui` package, or use the wrappers in `@/components/ui/*`." },
            { group: ["next", "next/*"], message: "This is a Vite SPA; use react-router-dom." },
          ],
        },
      ],
    },
  },
  {
    // shadcn/ui components co-export variants; silence react-refresh for them only.
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: { "react-refresh/only-export-components": "off" },
  },
);
