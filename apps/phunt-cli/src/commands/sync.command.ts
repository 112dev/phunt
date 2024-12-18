import { Command } from "commander";
import { DefaultMediaFileExtensions } from "../defaults.js";
import * as path from "node:path";
import { promises as fs, Stats } from "node:fs";
import {
  DuplicateFilterStrategy,
  FileSyncService,
} from "@112dev/phunt-core/file-sync";
import {
  FileIndexTableDbService,
  getDefaultDatabaseFileName,
  initDb,
} from "@112dev/phunt-core/db";
import { WinstonBasedLogger } from "@112dev/phunt-core/logger";
import { DateParser } from "@112dev/phunt-core/date-parser";
import { FileOps } from "@112dev/phunt-core/file-ops";
import { LocalFileSystemFileSearchService } from "@112dev/phunt-core/file-search";
import { IndexDestinationDirectoryService } from "@112dev/phunt-core/index-dest-dir";
import { objectContainsCodeProperty } from "@112dev/phunt-typeguards";
import { FileSearchService } from "@112dev/phunt-contracts/file-search";

type SyncCommandOptions = {
  ext: string[];
  recursive: boolean;
  removeSrc: boolean;
  destPattern: string;
  includeDuplicates: boolean;
  duplicateFilterStrategy: "checksum";
};

const syncCommandAction = async (
  dest: string,
  src: string[],
  options: SyncCommandOptions,
): Promise<void> => {
  assertSyncCommandArguments(dest, src, options);

  const normalizedDest = path.normalize(dest);

  await validateDestDirectory(normalizedDest);

  const dbPath = path.join(normalizedDest, getDefaultDatabaseFileName());

  const isDestDirIndexingRequired = !(await isDbFilePresent(dbPath));

  const db = initDb(dbPath);

  const fileIndexTableDbService = new FileIndexTableDbService(db);

  const loggerService = new WinstonBasedLogger();
  const dateParserService = new DateParser();

  const fileOpsService = new FileOps({
    logger: loggerService,
    dateParser: dateParserService,
  });

  const fileSearchService = new LocalFileSystemFileSearchService();

  const indexDestinationDirectoryService = new IndexDestinationDirectoryService(
    {
      fileOps: fileOpsService,
      fileSearchService: fileSearchService,
      fileIndexTableDbService: fileIndexTableDbService,
    },
  );

  const fileSyncService = new FileSyncService({
    fileOps: fileOpsService,
    fileSearchService: fileSearchService,
    fileIndexTableDbService: fileIndexTableDbService,
    logger: loggerService,
  });

  if (isDestDirIndexingRequired) {
    await indexFiles(normalizedDest, options, indexDestinationDirectoryService);
  }

  const foundFiles = await searchFiles(src, options, fileSearchService);
  loggerService.logDebug("Found files", foundFiles);

  await syncFiles(foundFiles, normalizedDest, options, fileSyncService);
  loggerService.logInfo(`Sync complete. Processed ${foundFiles.length} files.`);
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

const isDbFilePresent = async (dbPath: string): Promise<boolean> => {
  let isFilePresent = false;

  try {
    await fs.access(dbPath);
  } catch (error: unknown) {
    if (objectContainsCodeProperty(error) && error.code === "ENOENT") {
      isFilePresent = true;
    } else {
      throw error;
    }
  }

  return isFilePresent;
};

const indexFiles = async (
  dest: string,
  options: { ext: string[]; recursive: boolean },
  indexDestinationDirectoryService: IndexDestinationDirectoryService,
): Promise<void> => {
  await indexDestinationDirectoryService.indexAsync({
    srcDir: dest,
    fileExtensions: options.ext,
    recursive: options.recursive,
  });
};

const searchFiles = async (
  srcDirs: string[],
  options: { ext: string[]; recursive: boolean },
  fileSearchService: FileSearchService,
): Promise<string[]> => {
  const allFoundFiles: string[] = [];

  for (const srcDir of srcDirs) {
    const searchResult = await fileSearchService.searchAsync({
      fileExtensions: options.ext,
      srcDir: srcDir,
      recursive: options.recursive,
    });
    allFoundFiles.push(...searchResult);
  }

  return allFoundFiles;
};

const syncFiles = async (
  files: string[],
  dest: string,
  options: {
    destPattern: string;
    includeDuplicates: boolean;
    duplicateFilterStrategy: DuplicateFilterStrategy;
    removeSrc: boolean;
  },
  fileSyncService: FileSyncService,
): Promise<void> => {
  for (const file of files) {
    await fileSyncService.syncAsync({
      srcFile: file,
      destDir: dest,
      destPattern: options.destPattern,
      duplicateFilterStrategy: options.duplicateFilterStrategy,
      includeDuplicates: options.includeDuplicates,
      removeSrc: options.removeSrc,
    });
  }
};

/**
 * Creates Commander.js "sync" command for the CLI.
 *
 * @returns The configured Command object for the "sync" operation.
 */
export default function buildSyncCommand(): Command {
  const command = new Command("sync");

  command.description(
    "Synchronizes digital media files from specified source directories to a destination directory. The command indexes and manages digital media files, applies customizable patterns for organizing them, and handles duplicates based on specified strategies. Useful for keeping your digital media collections organized and in sync with your directory structure.",
  );

  command.addOption(
    command
      .createOption(
        "--ext <extensions...>",
        "Sets the file extensions of the digital media files to include in the sync.",
      )
      .default(DefaultMediaFileExtensions),
  );

  command.addOption(
    command
      .createOption(
        "--recursive",
        "Perform recursive digital media file search in the source directory.",
      )
      .default(false),
  );

  command.addOption(
    command
      .createOption(
        "--remove-src",
        "Remove the source digital media file once it is copied to the destination directory.",
      )
      .default(false),
  );

  command.addOption(
    command
      .createOption(
        "--dest-pattern",
        `Pattern for organizing digital media files at the destination.

            Available patterns:

            - {yyyy}: 4 digit year
            - {yy}: 2 digit year
            - {mm}: month
            - {dd}: day
            - {short-hash}: short hash
            - {src-name}: existing file name
            - {src-ext}: existing file extension
            `,
      )
      .default("{yyyy}/{mm}/{dd}_{short-hash}{src-ext}"),
  );

  command.addOption(
    command
      .createOption(
        "--include-duplicates",
        "Copy the digital media file even if it exists at the destination.",
      )
      .default(false),
  );

  command.addOption(
    command
      .createOption(
        "--duplicate-filter-strategy",
        `Strategy to filter duplicate digital media files.

            Available filters:

            - bpb: Byte per byte comparison
            - checksum: Checksum comparison
            `,
      )
      .choices(["checksum", "bpb"])
      .default("checksum"),
  );

  command.addArgument(
    command.createArgument(
      "<dest>",
      "Filesystem path to the destination directory for storing digital media files.",
    ),
  );

  command.addArgument(
    command.createArgument(
      "<src...>",
      "Filesystem path(s) to the source directory where to look for digital media files.",
    ),
  );

  command.action(async (dest, src, options): Promise<void> => {
    assertSyncCommandArguments(dest, src, options);
    await syncCommandAction(dest, src, options);
  });

  return command;
}

const assertSyncCommandArguments = (
  dest: unknown,
  src: unknown,
  options: unknown,
): void => {
  if (typeof dest !== "string") {
    throw new Error("Invalid dest: must be a string.");
  }

  if (
    !Array.isArray(src) ||
    src.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    throw new Error(
      "Invalid src: must be a non-empty array of non-empty strings.",
    );
  }

  if (typeof options !== "object" || options === null) {
    throw new Error("Invalid options: must be an object.");
  }

  const {
    ext,
    recursive,
    removeSrc,
    destPattern,
    includeDuplicates,
    duplicateFilterStrategy,
  } = options as SyncCommandOptions;

  if (
    !Array.isArray(ext) ||
    ext.some((extItem) => typeof extItem !== "string" || extItem.trim() === "")
  ) {
    throw new Error(
      "Invalid ext: must be a non-empty array of non-empty strings.",
    );
  }

  if (typeof recursive !== "boolean") {
    throw new Error("Invalid recursive: must be a boolean.");
  }

  if (typeof removeSrc !== "boolean") {
    throw new Error("Invalid removeSrc: must be a boolean.");
  }

  if (typeof destPattern !== "string" || destPattern.trim() === "") {
    throw new Error("Invalid destPattern: must be a non-empty string.");
  }

  if (typeof includeDuplicates !== "boolean") {
    throw new Error("Invalid includeDuplicates: must be a boolean.");
  }

  if (!["checksum", "bpb"].includes(duplicateFilterStrategy)) {
    throw new Error(
      'Invalid duplicateFilterStrategy: must be "checksum" or "bpb".',
    );
  }
};
