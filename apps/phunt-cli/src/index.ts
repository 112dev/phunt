#!/usr/bin/env node

import { Command } from "commander";
import buildSyncCommand from "./commands/sync.command";
import buildIndexCommand from "./commands/index.command";

const app = new Command();

app.name("__PHUNT_CLI_NAME__");

app.version(`Version: __PHUNT_CLI_VERSION__
Build Id: __PHUNT_CLI_BUILD_ID__
Build Date: __PHUNT_CLI_BUILD_DATE__
License: __PHUNT_CLI_LICENSE__`);

app.description(
  "__PHUNT_CLI_NAME__ is a command-line tool designed to help users organize digital media assets such as photos and images.",
);

app.addCommand(buildIndexCommand());
app.addCommand(buildSyncCommand());

app.parse();
