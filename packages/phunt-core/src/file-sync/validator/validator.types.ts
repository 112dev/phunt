import { FileSyncCriteria } from "../file-sync.types";

export interface FileSyncValidator {
  validateAsync(criteria: FileSyncCriteria): Promise<void>;
}
