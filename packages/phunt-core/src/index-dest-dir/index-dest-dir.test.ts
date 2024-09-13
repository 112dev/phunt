import { describe, it, jest, beforeEach, expect } from "@jest/globals";
import * as fs from "fs/promises";
import { LocalFileSystemFileSearchService } from "../file-search";
import { WinstonBasedLogger } from "../logger";
import {
  FileChecksum,
  FileMetadata,
  FileSearchResult,
  Logger,
  SqliteConnection,
} from "@112dev/phunt-contracts";
import { DateParser } from "../date-parser";
import { FileIndexRecord, FileIndexTableDbService } from "../db/file-index";
import { FileOps } from "../file-ops";
import { IndexDestinationDirectoryService } from "./index-dest-dir";
import { FileIndexCriteria } from "./index-dest-dir.types";

jest.mock("fs/promises");
jest.mock("../db/file-index");
jest.mock("../file-search");
jest.mock("../file-ops");

describe("IndexDestinationDirectoryService.indexAsync", () => {
  const logger: Logger = new WinstonBasedLogger();
  const dateParser: DateParser = new DateParser();

  const testDirPath = "/test/directory";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should remove outdated indexes, process files and create new indexes", async () => {
    const fileSearchResultStub: FileSearchResult = [
      `${testDirPath}/file1.jpg`,
      `${testDirPath}/file3.jpg`,
      `${testDirPath}/file4.jpg`,
    ];

    jest
      .spyOn(LocalFileSystemFileSearchService.prototype, "searchAsync")
      .mockResolvedValue(fileSearchResultStub);

    const existingFileRecordsStub: FileIndexRecord[] = [
      {
        path: `${testDirPath}/file1.jpg`,
      } as Partial<FileIndexRecord> as FileIndexRecord,
      {
        path: `${testDirPath}/file2.jpg`,
      } as Partial<FileIndexRecord> as FileIndexRecord,
      {
        path: `${testDirPath}/file3.jpg`,
      } as Partial<FileIndexRecord> as FileIndexRecord,
    ];

    jest
      .spyOn(FileIndexTableDbService.prototype, "getAll")
      .mockReturnValue(existingFileRecordsStub);

    /**
     * Mock fs.access which is invoked from shouldRemoveFileIndexRecord
     */
    existingFileRecordsStub.forEach((existingFileIndexRecord) => {
      let srcFilePresent = false;

      for (const srcFile of fileSearchResultStub) {
        if (srcFile === existingFileIndexRecord.path) {
          srcFilePresent = true;
          break;
        }
      }

      if (srcFilePresent) {
        (
          fs.access as jest.MockedFunction<typeof fs.access>
        ).mockResolvedValueOnce(undefined);
      } else {
        (
          fs.access as jest.MockedFunction<typeof fs.access>
        ).mockRejectedValueOnce({ code: "ENOENT" });
      }
    });

    const fileChecksumStub: FileChecksum = {
      algorithm: "sha256",
      value: "checksum",
    };

    jest
      .spyOn(FileOps.prototype, "calculateFileChecksumAsync")
      .mockResolvedValue(fileChecksumStub);

    const fileMetadataStub = { Exif: {} } as Partial<FileMetadata>;

    jest
      .spyOn(FileOps.prototype, "getExifDataAsync")
      .mockResolvedValue(fileMetadataStub.Exif);

    const fileIndexCriteriaStub: FileIndexCriteria = {
      srcDir: testDirPath,
      fileExtensions: ["jpg", "png"],
      recursive: true,
    };

    const fileOps = new FileOps({
      logger: logger,
      dateParser: dateParser,
    }) as jest.Mocked<FileOps>;

    const fileSearchServiceMock =
      new LocalFileSystemFileSearchService() as jest.Mocked<LocalFileSystemFileSearchService>;

    const dbStub = {} as Partial<SqliteConnection> as SqliteConnection;

    const fileIndexTableDbServiceMock = new FileIndexTableDbService(
      dbStub,
    ) as jest.Mocked<FileIndexTableDbService>;

    const indexDestDirService = new IndexDestinationDirectoryService({
      fileOps: fileOps,
      fileSearchService: fileSearchServiceMock,
      fileIndexTableDbService: fileIndexTableDbServiceMock,
    });

    await indexDestDirService.indexAsync(fileIndexCriteriaStub);

    // Verify that obsolete index record has been removed
    expect(fileIndexTableDbServiceMock.delete).toHaveBeenCalledWith(
      `${testDirPath}/file2.jpg`,
    );

    // Verify that the new file is stored in the index
    expect(fileIndexTableDbServiceMock.insert).toHaveBeenCalledWith({
      path: `${testDirPath}/file4.jpg`,
      checksum_algorithm: fileChecksumStub.algorithm,
      checksum: fileChecksumStub.value,
      creation_date: expect.any(String),
      metadata: JSON.stringify(fileMetadataStub),
    });
  });
});
