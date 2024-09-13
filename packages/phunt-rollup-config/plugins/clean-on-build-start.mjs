import {rm, mkdir} from "node:fs/promises";

/**
 * A Rollup plugin that removes a specified directory before the first write operation.
 * Subsequent write operations will wait for the removal to complete.
 *
 * @param {string} directory - The path of the directory to remove before writing.
 * @returns A Rollup plugin object with a `generateBundle` hook.
 */
export function cleanOnBuildStart(directory) {
  let removePromise;
  return {
    buildStart(_options) {
      removePromise ??= rm(directory, {
        force: true,
        recursive: true,
      }).then(async () => {
        // recreate the removed directory
        await mkdir(directory);
      });

      return removePromise;
    },
    name: "clean-on-build-start",
  };
}
