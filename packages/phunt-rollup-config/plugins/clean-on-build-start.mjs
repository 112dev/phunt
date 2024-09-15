import { access } from 'fs/promises';
import {rimraf} from 'rimraf';

/**
 * @param {string} directory - The path of the directory to clean.
 * @returns A Rollup plugin object with a `buildStart` hook.
 */
export function cleanOnBuildStart(directory) {
  return {
    /**
     * @param {import("rollup").InputOptions|null} options}
     * @return {Promise<void>}
     */
    async buildStart(options) {
      try {
        await access(directory)
      } catch(error) {
        console.log("RollupPlugin.cleanOnBuildStart: Unable to access the specified directory! Skipping..");
        return;
      }

      await rimraf(
        `${directory}/*`,
        {
          glob: true,
          preserveRoot: true
        }
      );
    },
    name: "clean-on-build-start",
  };
}
