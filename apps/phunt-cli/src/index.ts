#!/usr/bin/env node

import { Command } from "commander";
import buildSyncCommand from "./commands/sync.command";
import buildIndexCommand from "./commands/index.command";

const app = new Command();

app.version(`Version: __PHUNT_CLI_VERSION__
Build Id: __PHUNT_CLI_BUILD_ID__
Build Date: __PHUNT_CLI_BUILD_DATE__
License: __PHUNT_CLI_LICENSE__`);

app.description(`
phunt-cli is a command line tool which helps you organize digital photos. You provide the source path(s) from where to look for
photos and the destination directory. In addition, you can customize the logic how the photos are organized at the
destination.
`);

app.addCommand(buildIndexCommand());
app.addCommand(buildSyncCommand());

app.parse();
