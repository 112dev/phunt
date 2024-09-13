/**
 * @type {import("rollup").RollupOptions}
 */
const rollupOptions = {
  input: "src/index.ts",
  output: {
    file: "dist/bundle.js",
    format: "cjs",
    generatedCode: "es2015",
    sourcemap: true,
  },
  strictDeprecations: true,
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
  onwarn: (warning, defaultHandler) => {
    if (warning.code === "CIRCULAR_DEPENDENCY") {
      return; // Suppress circular dependency warnings.
    }
    defaultHandler(warning);
  },
};

export default rollupOptions;
