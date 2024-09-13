import { jest, describe, beforeEach, expect, it } from "@jest/globals";
import {
  DuplicateErrorDuplicateFileValidatorService,
  DuplicateFileValidatorService,
} from "./duplicate-file-validator";
import { FileSyncCriteria } from "../../file-sync.types";
import {
  FileIndexRecord,
  FileIndexTableDbService,
} from "../../../db/file-index";
import { FileOps } from "../../../file-ops";
import { FileChecksum } from "@112dev/phunt-contracts";

describe("DuplicateFileValidatorService", () => {
  let fileOpsMock: jest.Mocked<FileOps>;
  let fileIndexTableDbServiceMock: jest.Mocked<FileIndexTableDbService>;
  let duplicateFileValidatorService: DuplicateFileValidatorService;

  beforeEach(() => {
    fileOpsMock = {
      readFileAsync: jest.fn(),
      calculateFileChecksumAsync: jest.fn(),
    } as unknown as jest.Mocked<FileOps>;

    fileIndexTableDbServiceMock = {
      getByChecksum: jest.fn(),
    } as unknown as jest.Mocked<FileIndexTableDbService>;

    duplicateFileValidatorService = new DuplicateFileValidatorService({
      fileOps: fileOpsMock,
      fileIndexTableDbService: fileIndexTableDbServiceMock,
    });
  });

  it("should pass validation if includeDuplicates is true", async () => {
    const criteriaStub = {
      srcFile: "path/to/source/phunt-file",
      duplicateFilterStrategy: "checksum",
      includeDuplicates: true,
    } as Partial<FileSyncCriteria> as FileSyncCriteria;

    await expect(
      duplicateFileValidatorService.validateAsync(criteriaStub),
    ).resolves.toBeUndefined();

    expect(fileOpsMock.readFileAsync).not.toHaveBeenCalled();
    expect(fileIndexTableDbServiceMock.getByChecksum).not.toHaveBeenCalled();
  });

  it("should throw DuplicateErrorDuplicateFileValidatorService if a duplicate is found", async () => {
    const criteriaStub = {
      srcFile: "path/to/source/phunt-file",
      duplicateFilterStrategy: "checksum",
      includeDuplicates: false,
    } as Partial<FileSyncCriteria> as FileSyncCriteria;

    const mockFileBuffer = Buffer.from("phunt-file content");
    fileOpsMock.readFileAsync.mockResolvedValue(mockFileBuffer);

    const mockChecksum: FileChecksum = {
      value: "mocked-checksum",
      algorithm: "sha256",
    };
    fileOpsMock.calculateFileChecksumAsync.mockResolvedValue(mockChecksum);

    const fileIndexRecordStub = {
      path: "path/to/duplicate/phunt-file",
    } as Partial<FileIndexRecord> as FileIndexRecord;

    fileIndexTableDbServiceMock.getByChecksum.mockReturnValue(
      fileIndexRecordStub,
    );

    await expect(
      duplicateFileValidatorService.validateAsync(criteriaStub),
    ).rejects.toThrowError(
      new DuplicateErrorDuplicateFileValidatorService(
        criteriaStub,
        fileIndexRecordStub.path,
      ),
    );

    expect(fileOpsMock.readFileAsync).toHaveBeenCalledWith(
      "path/to/source/phunt-file",
    );
    expect(fileOpsMock.calculateFileChecksumAsync).toHaveBeenCalledWith(
      mockFileBuffer,
    );
    expect(fileIndexTableDbServiceMock.getByChecksum).toHaveBeenCalledWith(
      mockChecksum.value,
    );
  });

  it("should not throw error if no duplicate is found", async () => {
    const criteriaStub = {
      srcFile: "path/to/source/phunt-file",
      duplicateFilterStrategy: "checksum",
      includeDuplicates: false,
    } as Partial<FileSyncCriteria> as FileSyncCriteria;

    const mockChecksum: FileChecksum = {
      value: "mocked-checksum",
      algorithm: "sha256",
    };
    const mockFileBuffer = Buffer.from("phunt-file content");

    fileOpsMock.readFileAsync.mockResolvedValue(mockFileBuffer);
    fileOpsMock.calculateFileChecksumAsync.mockResolvedValue(mockChecksum);
    fileIndexTableDbServiceMock.getByChecksum.mockReturnValue(undefined);

    await expect(
      duplicateFileValidatorService.validateAsync(criteriaStub),
    ).resolves.toBeUndefined();

    expect(fileOpsMock.readFileAsync).toHaveBeenCalledWith(
      "path/to/source/phunt-file",
    );
    expect(fileOpsMock.calculateFileChecksumAsync).toHaveBeenCalledWith(
      mockFileBuffer,
    );
    expect(fileIndexTableDbServiceMock.getByChecksum).toHaveBeenCalledWith(
      mockChecksum.value,
    );
  });
});
