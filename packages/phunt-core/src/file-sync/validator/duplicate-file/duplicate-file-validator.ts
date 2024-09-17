import { FileSyncValidator } from "../validator.types";
import {
  DuplicateFilterStrategy,
  FileSyncCriteria,
} from "../../file-sync.types";
import { FileIndexTableDbService } from "../../../db";
import { FileOps } from "../../../file-ops";
import { FileSearchService } from "@112dev/phunt-contracts";

type DuplicateFileValidatorServiceParams = {
  readonly fileOps: FileOps;
  readonly fileIndexTableDbService: FileIndexTableDbService;
  readonly fileSearchService: FileSearchService;
};

export class DuplicateFileValidatorService implements FileSyncValidator {
  private readonly fileOps: FileOps;
  private readonly fileIndexTableDbService: FileIndexTableDbService;
  private readonly fileSearchService: FileSearchService;

  constructor(params: DuplicateFileValidatorServiceParams) {
    this.fileOps = params.fileOps;
    this.fileIndexTableDbService = params.fileIndexTableDbService;
    this.fileSearchService = params.fileSearchService;
  }

  async validateAsync(criteria: FileSyncCriteria): Promise<void> {
    if (criteria.includeDuplicates) {
      return;
    }

    const foundFileDuplicatePath = await this.searchForFileAtDestination(
      criteria.destDir,
      criteria.srcFile,
      criteria.duplicateFilterStrategy,
    );

    if (foundFileDuplicatePath !== undefined) {
      throw new DuplicateErrorDuplicateFileValidatorService(
        criteria,
        foundFileDuplicatePath,
      );
    }
  }

  private async searchForFileAtDestination(
    destDirPath: string,
    srcFilePath: string,
    duplicateFilterStrategy: DuplicateFilterStrategy,
  ): Promise<string | undefined> {
    if (duplicateFilterStrategy === "checksum") {
      return await this.searchForFileAtDestinationUsingChecksumStrategy(
        srcFilePath,
      );
    } else if (duplicateFilterStrategy === "bpb") {
      return await this.searchForFileAtDestinationUsingBytePerByteStrategy(
        srcFilePath,
        destDirPath,
      );
    }

    throw new UnsupportedDuplicateFilterStrategyDuplicateFileValidatorService(
      duplicateFilterStrategy,
    );
  }

  private async searchForFileAtDestinationUsingChecksumStrategy(
    srcFilePath: string,
  ): Promise<string | undefined> {
    const srcFileBuffer = await this.fileOps.readFileAsync(srcFilePath);

    const srcFileChecksum =
      await this.fileOps.calculateFileChecksumAsync(srcFileBuffer);

    const existingFileIndexRecord = this.fileIndexTableDbService.getByChecksum(
      srcFileChecksum.value,
    );

    return existingFileIndexRecord?.path;
  }

  private async searchForFileAtDestinationUsingBytePerByteStrategy(
    srcFilePath: string,
    destDirPath: string,
  ): Promise<string | undefined> {
    const srcFileBuffer = await this.fileOps.readFileAsync(srcFilePath);

    const srcFileExtension = this.fileOps.getFileExtension(srcFilePath);

    const destFilePathsList = await this.fileSearchService.searchAsync({
      srcDir: destDirPath,
      recursive: true,
      fileExtensions: [srcFileExtension],
    });

    const srcFileName = this.fileOps.getFileName(srcFilePath, true);

    /**
     * Sorts destFilePathsList so that files with the same file name as srcFileName
     * are prioritized first. This optimization improves the likelihood of finding
     * duplicates early, as files with matching names are more likely to be duplicates.
     */
    destFilePathsList.sort((a: string, b: string): number => {
      const fileNameA = this.fileOps.getFileName(a, true);
      const fileNameB = this.fileOps.getFileName(b, true);

      const isAMatch = fileNameA === srcFileName;
      const isBMatch = fileNameB === srcFileName;

      if (isAMatch && !isBMatch) {
        return -1;
      } else if (!isAMatch && isBMatch) {
        return 1;
      } else {
        return 0;
      }
    });

    for (const destFilePath of destFilePathsList) {
      const destFileBuffer = await this.fileOps.readFileAsync(destFilePath);

      if (
        this.fileOps.compareFileBuffersBytePerByte(
          srcFileBuffer,
          destFileBuffer,
        )
      ) {
        return destFilePath;
      }
    }
  }
}

export class UnsupportedDuplicateFilterStrategyDuplicateFileValidatorService extends Error {
  constructor(public readonly duplicateFilterStrategy: string) {
    super(
      `Unsupported duplicate filter strategy '${duplicateFilterStrategy}' provided!`,
    );
  }
}

export class DuplicateErrorDuplicateFileValidatorService extends Error {
  constructor(
    public readonly criteria: FileSyncCriteria,
    public readonly foundFileDuplicatePath: string,
  ) {
    super(
      `The source file '${criteria.srcFile}' already exists at the destination '${foundFileDuplicatePath}'. Skipping synchronization.`,
    );
  }
}
