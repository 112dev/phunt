import { FileSyncCriteria } from "../file-sync.types";
import { FileSyncValidator } from "./validator.types";
import { DuplicateFileValidatorService } from "./duplicate-file/duplicate-file-validator";
import { FileIndexTableDbService } from "../../db";
import { FileOps } from "../../file-ops";

type FileSyncValidatorParams = {
  readonly fileOps: FileOps;
  readonly fileIndexTableDbService: FileIndexTableDbService;
};

export class FileSyncValidatorService implements FileSyncValidator {
  private readonly fileOps: FileOps;
  private readonly fileIndexTableDbService: FileIndexTableDbService;

  constructor(params: FileSyncValidatorParams) {
    this.fileOps = params.fileOps;
    this.fileIndexTableDbService = params.fileIndexTableDbService;
  }

  public async validateAsync(criteria: FileSyncCriteria): Promise<void> {
    const validators = [
      new DuplicateFileValidatorService({
        fileOps: this.fileOps,
        fileIndexTableDbService: this.fileIndexTableDbService,
      }),
    ];

    for (const validator of validators) {
      await validator.validateAsync(criteria);
    }
  }
}
