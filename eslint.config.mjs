import nextCoreWebVitals from "eslint-config-next/core-web-vitals.js";
import nextTypescript from "eslint-config-next/typescript.js";
import globals from "globals";
import pluginJs from "@eslint/js";
import * as tseslint from "@typescript-eslint/eslint-plugin";
import next from "eslint-config-next/index.js";

export default [...nextCoreWebVitals, ...nextTypescript, {
  files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
  ...pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...next(), // Extend the Next.js recommended configuration
  languageOptions: {
    globals: globals.browser,
    parser: tseslint.parser, // Ensure TypeScript parser is used
    parserOptions: {
      project: ["./tsconfig.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    "no-console": "warn", // Keep console logs as warnings
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_", // Allow unused parameters starting with _
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ],
    // Disable default no-unused-vars since we're using the TypeScript version
    "no-unused-vars": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
}];