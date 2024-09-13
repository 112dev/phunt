import { FileMetadata } from "@112dev/phunt-contracts";

export type FileIndexCriteria = {
  srcDir: string;
  fileExtensions: Array<string>;
  recursive: boolean;
};

export type FileIndex = {
  path: string;
  checksum: string;
  checksum_algorithm: string;
  metadata: FileMetadata | null;
  creation_date: Date;
};

export const isFileIndexType = (object: unknown): object is FileIndex => {
  if (typeof object !== "object" || object === null) {
    return false;
  }

  const fileIndex = object as FileIndex;

  return (
    typeof fileIndex.path === "string" &&
    typeof fileIndex.checksum === "string" &&
    typeof fileIndex.checksum_algorithm === "string" &&
    (fileIndex.metadata === null || typeof fileIndex.metadata === "object") &&
    fileIndex.creation_date instanceof Date
  );
};

type AssertIsFileIndexType = (object: unknown) => asserts object is FileIndex;
export const assertIsFileIndexType: AssertIsFileIndexType = (
  object: unknown,
): asserts object is FileIndex => {
  if (!isFileIndexType(object)) {
    throw new Error(`Failed asserting that object is of type \`FileIndex\`!`);
  }
};
