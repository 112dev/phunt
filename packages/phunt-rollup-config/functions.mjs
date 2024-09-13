/**
 * Assembles a function to get the Rollup configuration, potentially setting up a watcher when in watch mode.
 *
 * @param {import("rollup").RollupOptions} rollupOptions The Rollup configuration options to use.
 * @returns {Function} A function that returns the Rollup configuration, and sets up a watcher if in watch mode.
 */
export function assembleRollupConfig(rollupOptions) {
  return async (command) => {
    if (command.watch) {
      const watcher = watch({
        ...rollupOptions,
        watch: {
          include: "src/**",
        },
      });

      watcher.on("event", (event) => {
        console.log(event.code);
      });
    }

    return [rollupOptions];
  };
}
