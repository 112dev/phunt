export type FileIndexRecord = {
  path: string;
  checksum: string;
  checksum_algorithm: string;
  metadata: string | null;
  creation_date: string;
};

export const isFileIndexRecordType = (
  object: unknown,
): object is FileIndexRecord => {
  if (typeof object !== "object" || object === null) {
    return false;
  }

  const fileIndexRecord = object as FileIndexRecord;

  return (
    typeof fileIndexRecord.path === "string" &&
    typeof fileIndexRecord.checksum === "string" &&
    typeof fileIndexRecord.checksum_algorithm === "string" &&
    (fileIndexRecord.metadata === null ||
      typeof fileIndexRecord.metadata === "string") &&
    typeof fileIndexRecord.creation_date === "string"
  );
};

type AssertIsFileIndexRecordType = (
  object: unknown,
) => asserts object is FileIndexRecord;
export const assertIsFileIndexRecordType: AssertIsFileIndexRecordType = (
  object: unknown,
): asserts object is FileIndexRecord => {
  if (!isFileIndexRecordType(object)) {
    throw new Error(
      `Failed asserting that object is of type \`FileIndexRecord\`!`,
    );
  }
};
