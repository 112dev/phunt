import { Command } from "commander";
import { DefaultMediaFileExtensions } from "../defaults";
import * as path from "path";
import { promises as fs, Stats } from "fs";
import {
  WinstonBasedLogger,
  DateParser,
  FileIndexTableDbService,
  getDefaultDatabaseFileName,
  initDb,
  LocalFileSystemFileSearchService,
  FileOps,
  IndexDestinationDirectoryService,
} from "@112dev/phunt-core";

type IndexCommandOptions = {
  ext: string[];
  recursive: boolean;
};

const execIndexAction = async (
  dest: string,
  options: IndexCommandOptions,
): Promise<void> => {
  const normalizedDestDirPath = path.normalize(dest);

  await validateDestDirectory(normalizedDestDirPath);

  const db = initializeDatabase(normalizedDestDirPath);

  const logger = new WinstonBasedLogger();
  const dateParser = new DateParser();

  const fileIndexTableDbService = new FileIndexTableDbService(db);
  const fileSearchService = new LocalFileSystemFileSearchService();
  const fileOps = new FileOps({
    logger: logger,
    dateParser: dateParser,
  });

  const indexDestinationDirectoryService = new IndexDestinationDirectoryService(
    {
      fileIndexTableDbService: fileIndexTableDbService,
      fileSearchService: fileSearchService,
      fileOps: fileOps,
    },
  );

  await indexDestinationDirectoryService.indexAsync({
    srcDir: normalizedDestDirPath,
    fileExtensions: options.ext,
    recursive: options.recursive,
  });
};

const validateDestDirectory = async (dest: string): Promise<void> => {
  let stats: Stats;

  try {
    stats = await fs.stat(dest);
  } catch (error: unknown) {
    const errorMessage = `Failed to validate dest directory for path '${dest}'`;
    throw new Error(errorMessage, { cause: error });
  }

  if (!stats.isDirectory()) {
    throw new Error(`Provided path '${dest}' is not a directory!`);
  }
};

const initializeDatabase = (dest: string) => {
  const dbPath = path.join(dest, getDefaultDatabaseFileName());
  return initDb(dbPath);
};

/**
 * Creates Commander.js Index subcommand.
 *
 * @returns The configured Command object for the "index" operation.
 */
export default function buildIndexCommand(): Command {
  const command = new Command("index");

  command.description(`
    Indexes digital media files in the specified destination directory.
    This command is useful when we suspect that the directory index is not in sync with the directory contents.
  `);

  command.option(
    "--ext <extensions...>",
    "Set the file extensions of the media files to include in the index.",
    DefaultMediaFileExtensions,
  );

  command.option(
    "--recursive",
    "Traverse all subdirectories to search for media files recursively.",
    false,
  );

  command.argument(
    "<dest>",
    "Filesystem path towards the destination directory where the index action will be performed.",
  );

  command.action(async (dest, options): Promise<void> => {
    assertIndexCommandArguments(dest, options);
    await execIndexAction(dest, options);
  });

  return command;
}

const assertIndexCommandArguments = (dest: unknown, options: unknown): void => {
  if (typeof dest !== "string" || dest.trim() === "") {
    throw new Error("Invalid dest: must be a non-empty string.");
  }

  if (typeof options !== "object" || options === null) {
    throw new Error("Invalid options: must be an object.");
  }

  const { ext, recursive } = options as IndexCommandOptions;

  if (
    !Array.isArray(ext) ||
    ext.length === 0 ||
    ext.some((extItem) => typeof extItem !== "string" || extItem.trim() === "")
  ) {
    throw new Error(
      "Invalid ext: must be a non-empty array of non-empty strings.",
    );
  }

  if (typeof recursive !== "boolean") {
    throw new Error("Invalid recursive: must be a boolean.");
  }
};
