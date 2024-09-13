import { FileSyncValidator } from "../validator.types";
import {
  DuplicateFilterStrategy,
  FileSyncCriteria,
} from "../../file-sync.types";
import { FileIndexTableDbService } from "../../../db";
import { FileOps } from "../../../file-ops";

type DuplicateFileValidatorServiceParams = {
  readonly fileOps: FileOps;
  readonly fileIndexTableDbService: FileIndexTableDbService;
};

export class DuplicateFileValidatorService implements FileSyncValidator {
  private readonly fileOps: FileOps;
  private readonly fileIndexTableDbService: FileIndexTableDbService;

  constructor(params: DuplicateFileValidatorServiceParams) {
    this.fileOps = params.fileOps;
    this.fileIndexTableDbService = params.fileIndexTableDbService;
  }

  async validateAsync(criteria: FileSyncCriteria): Promise<void> {
    if (criteria.includeDuplicates) {
      return;
    }

    const foundFileDuplicatePath = await this.searchForFileAtDestination(
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
    srcFilePath: string,
    duplicateFilterStrategy: DuplicateFilterStrategy,
  ): Promise<string | undefined> {
    if (duplicateFilterStrategy === "checksum") {
      return await this.searchForFileAtDestinationUsingChecksumStrategy(
        srcFilePath,
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
