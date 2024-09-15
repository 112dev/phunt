import baseOptions from "@112dev/phunt-rollup-config/base-options.mjs";
import { assembleRollupConfig } from "@112dev/phunt-rollup-config/functions.mjs";
import { cleanOnBuildStart } from "@112dev/phunt-rollup-config/plugins/clean-on-build-start.mjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import copy from "rollup-plugin-copy";
import replace from "@rollup/plugin-replace";
import { readFileSync } from "fs";
import { env } from "process";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

/**
 * @type {import("rollup").RollupOptions}
 */
const rollupOptions = {
  ...baseOptions,
  plugins: [
    cleanOnBuildStart("dist"),
    copy({
      targets: [
        {
          src: "node_modules/@112dev/phunt-core/node_modules/@112dev/phunt-db/node_modules/better-sqlite3/**/*",
          dest: "dist/node_modules/better-sqlite3",
        },
      ],
      verbose: true,
    }),
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
      dynamicRequireTargets: [
        "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
      ],
    }),
    typescript({
      tsconfig: "tsconfig.lib.json",
      moduleResolution: "bundler",
    }),
    terser({
      sourceMap: true,
    }),
  ],
  external: ["better-sqlite3"],
};

export default assembleRollupConfig(rollupOptions);
