export type DuplicateFilterStrategy = "checksum";

export type FileSyncCriteria = {
  srcFile: string;
  destDir: string;
  removeSrc: boolean;
  destPattern: string;
  includeDuplicates: boolean;
  duplicateFilterStrategy: DuplicateFilterStrategy;
};
