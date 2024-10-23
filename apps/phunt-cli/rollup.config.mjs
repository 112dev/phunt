import { assembleRollupConfig } from "@112dev/phunt-rollup-config/functions.mjs";
import { cleanOnBuildStart } from "@112dev/phunt-rollup-config/plugins/clean-on-build-start.mjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import { readFileSync } from "fs";
import { env } from "process";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

/**
 * @type {import("rollup").RollupOptions}
 */
const rollupOptions = {
  input: "src/index.ts",
  output: {
    file: `dist/phunt-cli.js`,
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
  plugins: [
    cleanOnBuildStart("dist"),
    replace({
      values: {
        __PHUNT_CLI_NAME__: () => {
          return pkg.name.startsWith("@") ? pkg.name.split("/")[1] : pkg.name;
        },
        __PHUNT_CLI_VERSION__: pkg.version,
        __PHUNT_CLI_LICENSE__: pkg.license,
        __PHUNT_CLI_BUILD_ID__: () => {
          return env["BUILD_ID"] ?? "unknown";
        },
        __PHUNT_CLI_BUILD_DATE__: () => {
          return new Date().toUTCString();
        },
      },
      preventAssignment: true,
    }),
    nodeResolve({
      preferBuiltins: false,
    }),
    json(),
    commonjs({
      ignoreTryCatch: false,
    }),
    typescript({
      tsconfig: "tsconfig.build.json",
      moduleResolution: "bundler",
    }),
  ],
  external: Object.keys(pkg.dependencies || {}), // https://github.com/rollup/rollup-plugin-node-resolve/issues/77
};

export default assembleRollupConfig(rollupOptions);
