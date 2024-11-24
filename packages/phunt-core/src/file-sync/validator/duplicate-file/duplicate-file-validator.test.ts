import { jest, describe, beforeEach, expect, it } from "@jest/globals";
import {
  DuplicateErrorDuplicateFileValidatorService,
  DuplicateFileValidatorService,
} from "./duplicate-file-validator.js";
import {
  FileIndexRecord,
  FileIndexTableDbService,
} from "../../../db/file-index.js";
import { FileOps } from "../../../file-ops/file-ops.js";
import { FileSearchService } from "@112dev/phunt-contracts/file-search";
import { FileChecksum } from "@112dev/phunt-contracts/file";
import { FileSyncCriteria } from "../../file-sync.js";

describe("DuplicateFileValidatorService", () => {
  let fileOpsMock: jest.Mocked<FileOps>;
  let fileSearchServiceMock: jest.Mocked<FileSearchService>;
  let fileIndexTableDbServiceMock: jest.Mocked<FileIndexTableDbService>;
  let duplicateFileValidatorService: DuplicateFileValidatorService;

  beforeEach(() => {
    fileOpsMock = {
      readFileAsync: jest.fn(),
      calculateFileChecksumAsync: jest.fn(),
      compareFileBuffersBytePerByte: jest.fn(),
      getFileExtension: jest.fn(),
      getFileName: jest.fn(),
    } as unknown as jest.Mocked<FileOps>;

    fileSearchServiceMock = {
      searchAsync: jest.fn(),
    } as unknown as jest.Mocked<FileSearchService>;

    fileIndexTableDbServiceMock = {
      getByChecksum: jest.fn(),
    } as unknown as jest.Mocked<FileIndexTableDbService>;

    duplicateFileValidatorService = new DuplicateFileValidatorService({
      fileOps: fileOpsMock,
      fileIndexTableDbService: fileIndexTableDbServiceMock,
      fileSearchService: fileSearchServiceMock,
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

  it("should throw DuplicateErrorDuplicateFileValidatorService if a checksum duplicate is found", async () => {
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

  it("should not throw error if no checksum duplicate is found", async () => {
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

  it("should throw DuplicateErrorDuplicateFileValidatorService if a byte-per-byte duplicate is found", async () => {
    const criteriaStub = {
      srcFile: "path/to/source/phunt-file",
      duplicateFilterStrategy: "bpb",
      destDir: "path/to/destination",
      includeDuplicates: false,
    } as Partial<FileSyncCriteria> as FileSyncCriteria;

    const mockFileBuffer = Buffer.from("phunt-file content");
    const mockDestFileBuffer = Buffer.from("phunt-file content");

    fileOpsMock.readFileAsync.mockResolvedValueOnce(mockFileBuffer);
    fileOpsMock.readFileAsync.mockResolvedValueOnce(mockDestFileBuffer);
    fileOpsMock.compareFileBuffersBytePerByte.mockReturnValue(true);
    fileOpsMock.getFileExtension.mockReturnValue(".phunt");

    const destFileList = ["path/to/destination/phunt-file"];
    fileSearchServiceMock.searchAsync.mockResolvedValue(destFileList);

    await expect(
      duplicateFileValidatorService.validateAsync(criteriaStub),
    ).rejects.toThrowError(
      new DuplicateErrorDuplicateFileValidatorService(
        criteriaStub,
        "path/to/destination/phunt-file",
      ),
    );

    expect(fileOpsMock.readFileAsync).toHaveBeenCalledWith(
      "path/to/source/phunt-file",
    );
    expect(fileOpsMock.readFileAsync).toHaveBeenCalledWith(
      "path/to/destination/phunt-file",
    );
    expect(fileOpsMock.compareFileBuffersBytePerByte).toHaveBeenCalledWith(
      mockFileBuffer,
      mockDestFileBuffer,
    );
  });

  it("should not throw error if no byte-per-byte duplicate is found", async () => {
    const criteriaStub = {
      srcFile: "path/to/source/phunt-file",
      duplicateFilterStrategy: "bpb",
      destDir: "path/to/destination",
      includeDuplicates: false,
    } as Partial<FileSyncCriteria> as FileSyncCriteria;

    const mockFileBuffer = Buffer.from("phunt-file content");
    const mockDestFileBuffer = Buffer.from("different content");

    fileOpsMock.readFileAsync.mockResolvedValueOnce(mockFileBuffer);
    fileOpsMock.readFileAsync.mockResolvedValueOnce(mockDestFileBuffer);
    fileOpsMock.compareFileBuffersBytePerByte.mockReturnValue(false);
    fileOpsMock.getFileExtension.mockReturnValue(".phunt");

    const destFileList = ["path/to/destination/phunt-file"];
    fileSearchServiceMock.searchAsync.mockResolvedValue(destFileList);

    await expect(
      duplicateFileValidatorService.validateAsync(criteriaStub),
    ).resolves.toBeUndefined();

    expect(fileOpsMock.readFileAsync).toHaveBeenCalledWith(
      "path/to/source/phunt-file",
    );
    expect(fileOpsMock.readFileAsync).toHaveBeenCalledWith(
      "path/to/destination/phunt-file",
    );
    expect(fileOpsMock.compareFileBuffersBytePerByte).toHaveBeenCalledWith(
      mockFileBuffer,
      mockDestFileBuffer,
    );
  });
});
