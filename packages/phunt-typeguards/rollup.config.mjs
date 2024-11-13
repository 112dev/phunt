import { assembleRollupConfig } from "@112dev/phunt-rollup-config/functions.mjs";
import { cleanOnBuildStart } from "@112dev/phunt-rollup-config/plugins/clean-on-build-start.mjs";
import typescript from "@rollup/plugin-typescript";
import { readFileSync } from "node:fs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

/**
 * @type {import("rollup").RollupOptions}
 */
const rollupOptions = {
  input: "src/index.ts",
  output: [
    {
      dir: "dist",
      format: "es",
      preserveModules: true,
      entryFileNames: "[name].mjs",
      sourcemap: true,
    },
    {
      dir: "dist",
      format: "cjs",
      preserveModules: true,
      entryFileNames: "[name].cjs",
      sourcemap: true,
    },
  ],
  strictDeprecations: true,
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
  plugins: [
    cleanOnBuildStart("dist"),
    nodeResolve({
      preferBuiltins: false,
    }),
    commonjs({
      ignoreTryCatch: false,
    }),
    typescript({
      tsconfig: "tsconfig.build.json",
      compilerOptions: {
        moduleResolution: "NodeNext",
        module: "NodeNext",
      },
    }),
  ],
  external: Object.keys(pkg.dependencies || {}), // https://github.com/rollup/rollup-plugin-node-resolve/issues/77
};

export default assembleRollupConfig(rollupOptions);
