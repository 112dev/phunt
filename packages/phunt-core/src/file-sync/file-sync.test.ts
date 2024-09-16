import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  SqliteConnection,
  FileExifData,
  FileStats,
} from "@112dev/phunt-contracts";
import { FileIndexTableDbService } from "../db/file-index";
import { DateParser } from "../date-parser";
import { FileOps } from "../file-ops";
import { WinstonBasedLogger } from "../logger";
import { FileSyncService } from "./file-sync";

describe("FileSyncService", () => {
  let loggerMock: jest.Mocked<WinstonBasedLogger>;
  let dateParserMock: jest.Mocked<DateParser>;
  let fileOpsMock: jest.Mocked<FileOps>;
  let dbMock: SqliteConnection;
  let fileIndexTableDbServiceMock: jest.Mocked<FileIndexTableDbService>;
  let fileSyncService: FileSyncService;

  beforeEach(() => {
    jest.clearAllMocks();

    loggerMock = new WinstonBasedLogger() as jest.Mocked<WinstonBasedLogger>;
    dateParserMock = new DateParser() as jest.Mocked<DateParser>;

    fileOpsMock = new FileOps({
      dateParser: dateParserMock,
      logger: loggerMock,
    }) as jest.Mocked<FileOps>;

    dbMock = {} as Partial<SqliteConnection> as SqliteConnection;

    fileIndexTableDbServiceMock = new FileIndexTableDbService(
      dbMock,
    ) as jest.Mocked<FileIndexTableDbService>;

    fileSyncService = new FileSyncService({
      logger: loggerMock,
      fileOps: fileOpsMock,
      fileIndexTableDbService: fileIndexTableDbServiceMock,
    });
  });

  const destPattern = "{yyyy}/{mm}/{dd}_{short-hash}{src-ext}";
  const destDir = "/test/dest";
  const srcFile = "/test/src/file1.jpg";
  const srcFileBuffer = Buffer.from("mock phunt-file data");
  const srcFileCreationDate = new Date();
  const duplicateFilterStrategy = "checksum";

  describe("FileSyncService.syncAsync", () => {
    it("should transfer files regardless if it is a duplicate or not", async () => {
      // Mock read src phunt-file
      jest
        .spyOn(fileOpsMock, "readFileAsync")
        .mockResolvedValueOnce(srcFileBuffer);

      // Mock read src phunt-file exif data
      const srcFileExifDataMock = {} as Partial<FileExifData>;
      jest
        .spyOn(fileOpsMock, "getExifDataAsync")
        .mockResolvedValueOnce(srcFileExifDataMock);

      // Mock phunt-file transfer
      const srcFileStatsStub = {
        mtime: srcFileCreationDate,
        birthtime: srcFileCreationDate,
      } as Partial<FileStats> as FileStats;

      jest
        .spyOn(fileOpsMock, "getFileStatsAsync")
        .mockResolvedValue(srcFileStatsStub);

      jest
        .spyOn(fileOpsMock, "writeFileFromBufferAsync")
        .mockResolvedValueOnce(undefined);

      // Mock read dest phunt-file
      jest
        .spyOn(fileOpsMock, "readFileAsync")
        .mockResolvedValueOnce(srcFileBuffer);

      // Mock read dest phunt-file exif data which is used by readFileMetadataAsync
      jest
        .spyOn(fileOpsMock, "getExifDataAsync")
        .mockResolvedValueOnce(srcFileExifDataMock);

      // Mock dest phunt-file checksum calculation
      jest
        .spyOn(fileOpsMock, "calculateFileChecksumAsync")
        .mockResolvedValueOnce({
          value: "checksum data",
          algorithm: "sha256",
        });

      // Mock the insert new index record operation
      jest
        .spyOn(fileIndexTableDbServiceMock, "insert")
        .mockImplementation(jest.fn());

      await fileSyncService.syncAsync({
        destDir: destDir,
        destPattern: destPattern,
        removeSrc: false,
        includeDuplicates: true,
        duplicateFilterStrategy: duplicateFilterStrategy,
        srcFile: srcFile,
      });

      expect(fileOpsMock.readFileAsync).toHaveBeenCalledTimes(2);
      expect(fileOpsMock.writeFileFromBufferAsync).toHaveBeenCalledTimes(1);
      expect(fileIndexTableDbServiceMock.insert).toHaveBeenCalledTimes(1);
    });
  });
});
