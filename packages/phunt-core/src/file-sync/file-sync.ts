import path from "path";
import { FileSyncValidatorService } from "./validator/validator.js";
import { DuplicateErrorDuplicateFileValidatorService } from "./validator/duplicate-file/duplicate-file-validator.js";
import { FileIndexRecord, FileIndexTableDbService } from "../db/file-index.js";
import { Logger } from "@112dev/phunt-contracts/logger";
import { FileMetadata } from "@112dev/phunt-contracts/file";
import { FileSearchService } from "@112dev/phunt-contracts/file-search";
import { FileOps } from "../file-ops/file-ops.js";

export type DuplicateFilterStrategy = "checksum" | "bpb";

export type FileSyncCriteria = {
  srcFile: string;
  destDir: string;
  removeSrc: boolean;
  destPattern: string;
  includeDuplicates: boolean;
  duplicateFilterStrategy: DuplicateFilterStrategy;
};

type FileSyncServiceParams = {
  readonly fileOps: FileOps;
  readonly fileSearchService: FileSearchService;
  readonly fileIndexTableDbService: FileIndexTableDbService;
  readonly logger: Logger;
};

export class FileSyncService {
  private readonly fileOps: FileOps;
  private readonly fileSearchService: FileSearchService;
  private readonly fileIndexTableDbService: FileIndexTableDbService;
  private readonly logger: Logger;
  private readonly fileSyncValidatorService: FileSyncValidatorService;

  constructor(params: FileSyncServiceParams) {
    this.fileOps = params.fileOps;
    this.fileSearchService = params.fileSearchService;
    this.fileIndexTableDbService = params.fileIndexTableDbService;
    this.logger = params.logger;

    this.fileSyncValidatorService = new FileSyncValidatorService({
      fileOps: this.fileOps,
      fileSearchService: this.fileSearchService,
      fileIndexTableDbService: this.fileIndexTableDbService,
    });
  }

  public async syncAsync(criteria: FileSyncCriteria): Promise<void> {
    try {
      await this.fileSyncValidatorService.validateAsync(criteria);
    } catch (error: unknown) {
      if (error instanceof DuplicateErrorDuplicateFileValidatorService) {
        if (criteria.removeSrc) {
          await this.fileOps.removeFileAsync(criteria.srcFile);
          this.logger.logWarning(
            `Source file removal is enabled. The source file '${criteria.srcFile}' has been deleted as it is already present at the destination '${error.foundFileDuplicatePath}'.`,
          );
        }

        return;
      }

      throw error;
    }

    const dest = await this.transferFile(
      criteria.srcFile,
      criteria.destDir,
      criteria.destPattern,
      criteria.removeSrc,
    );

    await this.indexTransferredFile(dest);
  }

  private async transferFile(
    srcFilePath: string,
    destDir: string,
    destPattern: string,
    removeSrc: boolean,
  ): Promise<string> {
    let fileMetadata: FileMetadata | null = null;

    const srcFileBuffer = await this.fileOps.readFileAsync(srcFilePath);

    const fileExifData = await this.fileOps.getExifDataAsync(srcFileBuffer);
    if (fileExifData !== undefined) {
      fileMetadata = {
        Exif: fileExifData,
      };
    }

    const processedDestPattern = await this.processDestPattern(
      srcFileBuffer,
      srcFilePath,
      fileMetadata,
      destPattern,
    );

    const dest = path.join(destDir, processedDestPattern);

    if (removeSrc) {
      try {
        await this.fileOps.moveFileAsync(srcFilePath, dest);
      } catch (error: unknown) {
        throw new Error(
          `An error occurred while moving file from ${srcFilePath} to ${dest}! The file has not been moved!`,
          {
            cause: error,
          },
        );
      }
    } else {
      try {
        await this.fileOps.writeFileFromBufferAsync(srcFileBuffer, dest);
      } catch (error: unknown) {
        throw new Error(
          `An error occurred while copying file from ${srcFilePath} to ${dest}! The file has not been copied!`,
          {
            cause: error,
          },
        );
      }
    }

    return dest;
  }

  private async indexTransferredFile(filePath: string): Promise<void> {
    try {
      const file = await this.fileOps.readFileAsync(filePath);

      const fileMetadata =
        await this.fileOps.getFileMetadataFromBufferAsync(file);

      let metadata = null;
      if (fileMetadata !== null) {
        metadata = JSON.stringify(fileMetadata);
      }

      const fileChecksum = await this.fileOps.calculateFileChecksumAsync(file);

      const fileIndexRecord: FileIndexRecord = {
        path: filePath,
        creation_date: new Date().toUTCString(),
        metadata: metadata,
        checksum_algorithm: fileChecksum.algorithm,
        checksum: fileChecksum.value,
      };

      this.fileIndexTableDbService.insert(fileIndexRecord);
    } catch (e: unknown) {
      this.logger.logError(
        `An error occurred while trying to index synced file at "${filePath}"!`,
        e,
      );
      return;
    }
  }

  private async getPhotoFileCreationDate(
    filePath: string,
    fileMetadata: FileMetadata | null,
  ): Promise<Date | null> {
    let creationDate = null;

    if (fileMetadata?.Exif?.DateTimeOriginal !== undefined) {
      creationDate = new Date(fileMetadata?.Exif?.DateTimeOriginal);
    } else if (fileMetadata?.Exif?.DateTime !== undefined) {
      creationDate = fileMetadata?.Exif?.DateTime;
    } else {
      try {
        // Fallback to phunt-file creation phunt-date
        // on Unix phunt-file systems this can be inaccurate due to some systems not storing creation phunt-date
        const fileStat = await this.fileOps.getFileStatsAsync(filePath);

        // Compare birthtime and mtime, and assign the older one
        creationDate =
          fileStat.birthtime < fileStat.mtime
            ? fileStat.birthtime
            : fileStat.mtime;
      } catch (error: unknown) {
        this.logger.logError(
          `An error occurred during reading file stats for file: ${filePath}`,
          error,
        );
      }
    }

    return creationDate;
  }

  private async processDestPattern(
    srcFile: Buffer,
    srcFilePath: string,
    srcFileMetadata: FileMetadata | null,
    destPattern: string,
  ): Promise<string> {
    const asyncReplace = async (match: string): Promise<string> => {
      const datePlaceholders = new Set<string>([
        "{yyyy}",
        "{yy}",
        "{mm}",
        "{dd}",
      ]);

      if (datePlaceholders.has(match)) {
        const creationDate = await this.getPhotoFileCreationDate(
          srcFilePath,
          srcFileMetadata,
        );

        if (creationDate === null) {
          return "na"; // as in not available
        }

        if ("{yyyy}" === match) {
          return creationDate.getUTCFullYear().toString();
        } else if ("{yy}" === match) {
          return creationDate.getUTCFullYear().toString().substring(2);
        } else if ("{mm}" === match) {
          return (creationDate.getUTCMonth() + 1).toString().padStart(2, "0");
        } else if ("{dd}" === match) {
          return creationDate.getUTCDate().toString().padStart(2, "0");
        }
      } else if ("{short-hash}" === match) {
        return await this.fileOps.getShortHashAsync(srcFile);
      } else if ("{src-name}" === match) {
        return this.fileOps.getFileName(srcFilePath) ?? "na";
      } else if ("{src-ext}" === match) {
        return this.fileOps.getFileExtension(srcFilePath);
      }

      throw new Error(
        `Unsupported destination pattern provided: \`${match}\`!`,
      );
    };

    const regex = /\{[^}]+}/g;
    const matches = destPattern.match(regex) || [];

    for (const match of matches) {
      const replacement = await asyncReplace(match);
      destPattern = destPattern.replace(match, replacement);
    }

    return destPattern;
  }
}
