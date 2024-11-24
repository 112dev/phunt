import { DuplicateFileValidatorService } from "./duplicate-file/duplicate-file-validator.js";
import { FileIndexTableDbService } from "../../db/file-index.js";
import { FileOps } from "../../file-ops/file-ops.js";
import { FileSearchService } from "@112dev/phunt-contracts/file-search";
import { FileSyncCriteria } from "../file-sync.js";

export interface FileSyncValidator {
  validateAsync(criteria: FileSyncCriteria): Promise<void>;
}

type FileSyncValidatorParams = {
  readonly fileOps: FileOps;
  readonly fileSearchService: FileSearchService;
  readonly fileIndexTableDbService: FileIndexTableDbService;
};

export class FileSyncValidatorService implements FileSyncValidator {
  private readonly fileOps: FileOps;
  private readonly fileSearchService: FileSearchService;
  private readonly fileIndexTableDbService: FileIndexTableDbService;

  constructor(params: FileSyncValidatorParams) {
    this.fileOps = params.fileOps;
    this.fileSearchService = params.fileSearchService;
    this.fileIndexTableDbService = params.fileIndexTableDbService;
  }

  public async validateAsync(criteria: FileSyncCriteria): Promise<void> {
    const validators = [
      new DuplicateFileValidatorService({
        fileOps: this.fileOps,
        fileSearchService: this.fileSearchService,
        fileIndexTableDbService: this.fileIndexTableDbService,
      }),
    ];

    for (const validator of validators) {
      await validator.validateAsync(criteria);
    }
  }
}
