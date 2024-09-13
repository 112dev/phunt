import standard from "@112dev/phunt-eslint-config/standard.mjs";

export default [
  ...standard,
  {
    files: ["src/logger.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
