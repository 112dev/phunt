import {rimrafSync} from "rimraf";
import path from "node:path";

console.log("Starting cleanup script.");

const baseDir = path.dirname(new URL(import.meta.url).pathname);

rimrafSync(path.join(baseDir, ".turbo"));
rimrafSync(path.join(baseDir, "apps/**/.turbo"), {glob: true});
rimrafSync(path.join(baseDir, "apps/**/dist"), {glob: true});
rimrafSync(path.join(baseDir, "apps/**/node_modules"), {glob: true});
rimrafSync(path.join(baseDir, "apps/**/.vite"), {glob: true});
rimrafSync(path.join(baseDir, "packages/**/.turbo"), {glob: true});
rimrafSync(path.join(baseDir, "packages/**/dist"), {glob: true});
rimrafSync(path.join(baseDir, "packages/**/node_modules"), {glob: true});

console.log("Cleanup script completed.");
