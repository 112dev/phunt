export type DuplicateFilterStrategy = "checksum";
export type UnresolvableStrategy = "dir" | "exclude";

export type FileSyncCriteria = {
  srcFile: string;
  destDir: string;
  removeSrc: boolean;
  destPattern: string;
  includeDuplicates: boolean;
  duplicateFilterStrategy: DuplicateFilterStrategy;
  unresolvableStrategy: UnresolvableStrategy;
};
