import globals from "globals";
import pluginJs from "@eslint/js";
import tsEslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";

/** @type {import("eslint").Linter.Config} */
export default [
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  pluginJs.configs.recommended,
  ...tsEslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["src/**/*.ts"],
    ...jsdoc.configs["flat/recommended-typescript-error"],
    rules: {
      "jsdoc/tag-lines": ["error" | "warn", "always"],
    },
  },
  {
    ignores: ["dist/"],
  },
];
