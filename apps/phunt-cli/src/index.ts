#!/usr/bin/env node

import { Command } from "commander";
import buildSyncCommand from "./commands/sync.command";
import buildIndexCommand from "./commands/index.command";

const app = new Command();

if (process.env["npm_package_version"] !== undefined) {
  app.version(process.env["npm_package_version"]);
}

app.description(`
Phunt is a command line tool which helps you organize digital photos. You provide the source path(s) from where to look for
photos and the destination directory. In addition, you can customize the logic how the photos are organized at the
destination.
`);

app.addCommand(buildIndexCommand());
app.addCommand(buildSyncCommand());

app.parse();
