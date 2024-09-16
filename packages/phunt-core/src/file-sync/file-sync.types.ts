export type DuplicateFilterStrategy = "checksum" | "bpb";

export type FileSyncCriteria = {
  srcFile: string;
  destDir: string;
  removeSrc: boolean;
  destPattern: string;
  includeDuplicates: boolean;
  duplicateFilterStrategy: DuplicateFilterStrategy;
};
