import {
  jest,
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
} from "@jest/globals";
import * as ExifReader from "exifreader";
import fs from "fs/promises";
import path from "path";
import { Logger } from "@112dev/phunt-contracts/logger";
import { ObjectWithCodeProperty } from "@112dev/phunt-typeguards";
import { FileOps } from "./file-ops.js";
import { DateParser } from "../date-parser/date-parser.js";
import { WinstonBasedLogger } from "../logger/winston-logger.js";
import { Buffer } from "buffer";

jest.mock("exifreader");
jest.mock("fs/promises");
jest.mock("path");
jest.mock("../logger/winston-logger.js");

describe("FileOps", () => {
  const dateParser: DateParser = new DateParser();
  let loggerMock: jest.Mocked<Logger>;
  let fileOps: FileOps;

  beforeEach(() => {
    loggerMock = new WinstonBasedLogger() as jest.Mocked<WinstonBasedLogger>;

    fileOps = new FileOps({
      dateParser: dateParser,
      logger: loggerMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("FileOps.getExifDataAsync", () => {
    const mockBuffer = Buffer.from("mock data");

    it("should return Exif data when ExifReader.load succeeds", async () => {
      const mockExifTags: ExifReader.Tags = {
        DateTimeOriginal: { description: "2023:08:17 12:00:00" },
      } as Partial<ExifReader.Tags> as ExifReader.Tags;

      (
        ExifReader.load as jest.MockedFunction<typeof ExifReader.load>
      ).mockResolvedValue(mockExifTags);

      const result = await fileOps.getExifDataAsync(mockBuffer);

      expect(result).toEqual({
        DateTimeOriginal: new Date("2023-08-17T12:00:00"),
        DateTime: undefined,
      });

      expect(ExifReader.load).toHaveBeenCalledWith(mockBuffer);
      expect(loggerMock.logDebug).not.toHaveBeenCalled();
    });

    it("should return undefined and log debug message when ExifReader.load fails and throwOnError is false", async () => {
      const mockError = new Error("Exif error");

      (
        ExifReader.load as jest.MockedFunction<typeof ExifReader.load>
      ).mockRejectedValue(mockError);

      const result = await fileOps.getExifDataAsync(mockBuffer);

      expect(result).toBeUndefined();
      expect(ExifReader.load).toHaveBeenCalledWith(mockBuffer);
      expect(loggerMock.logDebug).toHaveBeenCalledWith(
        "An error occurred during reading Exif data!",
        mockError,
      );
    });

    it("should throw an error when ExifReader.load fails and throwOnError is true", async () => {
      const mockError = new Error("Exif error");

      (
        ExifReader.load as jest.MockedFunction<typeof ExifReader.load>
      ).mockRejectedValue(mockError);

      await expect(fileOps.getExifDataAsync(mockBuffer, true)).rejects.toThrow(
        mockError,
      );
      expect(ExifReader.load).toHaveBeenCalledWith(mockBuffer);
      expect(loggerMock.logDebug).not.toHaveBeenCalled();
    });

    it("should return undefined when ExifReader.load returns empty tags", async () => {
      (
        ExifReader.load as jest.MockedFunction<typeof ExifReader.load>
      ).mockResolvedValue({} as Partial<ExifReader.Tags> as ExifReader.Tags);

      const result = await fileOps.getExifDataAsync(mockBuffer);

      expect(result).toBeUndefined();
      expect(ExifReader.load).toHaveBeenCalledWith(mockBuffer);
      expect(loggerMock.logDebug).not.toHaveBeenCalled();
    });

    it("should log an error when parsing DateTimeOriginal fails", async () => {
      const mockExifTags: ExifReader.Tags = {
        DateTimeOriginal: { description: "invalid format" },
      } as Partial<ExifReader.Tags> as ExifReader.Tags;

      (
        ExifReader.load as jest.MockedFunction<typeof ExifReader.load>
      ).mockResolvedValue(mockExifTags);

      const result = await fileOps.getExifDataAsync(mockBuffer);

      expect(result).toEqual({
        DateTimeOriginal: undefined,
        DateTime: undefined,
      });

      expect(loggerMock.logDebug).toHaveBeenCalledWith(
        "Error parsing EXIF field DateTimeOriginal: Unrecognized date format: invalid format",
      );
    });
  });

  describe("FileOps.moveFileAsync", () => {
    const mockSrcPath = "/mock/src/file.txt";
    const mockDestPath = "/mock/dest/file.txt";

    it("should create directory and rename the file successfully", async () => {
      (fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(
        undefined,
      );

      (fs.rename as jest.MockedFunction<typeof fs.rename>).mockResolvedValue(
        undefined,
      );

      await fileOps.moveFileAsync(mockSrcPath, mockDestPath);

      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(mockDestPath), {
        recursive: true,
      });
      expect(fs.rename).toHaveBeenCalledWith(mockSrcPath, mockDestPath);
    });

    it("should copy and delete the file if rename fails with EXDEV error", async () => {
      (fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(
        undefined,
      );

      const exdevError: ObjectWithCodeProperty = {
        code: "EXDEV",
      };

      (fs.rename as jest.MockedFunction<typeof fs.rename>).mockRejectedValue(
        exdevError,
      );

      (
        fs.copyFile as jest.MockedFunction<typeof fs.copyFile>
      ).mockResolvedValue(undefined);

      (fs.unlink as jest.MockedFunction<typeof fs.unlink>).mockResolvedValue(
        undefined,
      );

      await fileOps.moveFileAsync(mockSrcPath, mockDestPath);

      expect(fs.rename).toHaveBeenCalledWith(mockSrcPath, mockDestPath);
      expect(fs.copyFile).toHaveBeenCalledWith(mockSrcPath, mockDestPath);
      expect(fs.unlink).toHaveBeenCalledWith(mockSrcPath);
    });

    it("should throw an error if the rename fails with a non-EXDEV error", async () => {
      (fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(
        undefined,
      );

      const otherError: ObjectWithCodeProperty = {
        code: "other-error",
      };

      (fs.rename as jest.MockedFunction<typeof fs.rename>).mockRejectedValue(
        otherError,
      );

      await expect(
        fileOps.moveFileAsync(mockSrcPath, mockDestPath),
      ).rejects.toEqual(otherError);

      expect(fs.rename).toHaveBeenCalledWith(mockSrcPath, mockDestPath);
      expect(fs.copyFile).not.toHaveBeenCalled();
      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });

  describe("FileOps.readFileAsync", () => {
    const mockFilePath = "/mock/path/file.txt";
    const mockFileBuffer = Buffer.from("mock file data");

    it("should return cached file buffer if present and forceReread is false", async () => {
      Reflect.get(fileOps, "readFileCache").set(mockFilePath, mockFileBuffer);

      const result = await fileOps.readFileAsync(mockFilePath, false);

      expect(result).toBe(mockFileBuffer);
      expect(fs.readFile).not.toHaveBeenCalled();
    });

    it("should read the file from the file system and cache it if not cached", async () => {
      fileOps.clearReadFileCache();

      (
        fs.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(mockFileBuffer);

      const result = await fileOps.readFileAsync(mockFilePath, false);

      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath);
      expect(result).toBe(mockFileBuffer);
      expect(Reflect.get(fileOps, "readFileCache").get(mockFilePath)).toBe(
        mockFileBuffer,
      );
    });

    it("should re-read the file from the file system if forceReread is true", async () => {
      const cachedBuffer = Buffer.from("old data");
      Reflect.get(fileOps, "readFileCache").set(mockFilePath, cachedBuffer);

      (
        fs.readFile as jest.MockedFunction<typeof fs.readFile>
      ).mockResolvedValue(mockFileBuffer);

      const result = await fileOps.readFileAsync(mockFilePath, true);

      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath);
      expect(result).toBe(mockFileBuffer);
      expect(Reflect.get(fileOps, "readFileCache").get(mockFilePath)).toBe(
        mockFileBuffer,
      );
    });
  });

  describe("FileOps.clearReadFileCache", () => {
    it("should clear the file cache", () => {
      const mockFilePath = "/mock/path/file.txt";
      const mockFileBuffer = Buffer.from("mock file data");

      Reflect.get(fileOps, "readFileCache").set(mockFilePath, mockFileBuffer);

      expect(Reflect.get(fileOps, "readFileCache").has(mockFilePath)).toBe(
        true,
      );

      fileOps.clearReadFileCache();

      expect(Reflect.get(fileOps, "readFileCache").size).toBe(0);
    });
  });

  describe("FileOps.compareFileBuffersBytePerByte", () => {
    it("should return true for identical buffers", () => {
      const buffer1 = Buffer.from([0x01, 0x02, 0x03]);
      const buffer2 = Buffer.from([0x01, 0x02, 0x03]);

      const result = fileOps.compareFileBuffersBytePerByte(buffer1, buffer2);

      expect(result).toBe(true);
    });

    it("should return false for different buffers", () => {
      const buffer1 = Buffer.from([0x01, 0x02, 0x03]);
      const buffer2 = Buffer.from([0x01, 0x02, 0x04]);

      const result = fileOps.compareFileBuffersBytePerByte(buffer1, buffer2);

      expect(result).toBe(false);
    });

    it("should return false for buffers with different lengths", () => {
      const buffer1 = Buffer.from([0x01, 0x02, 0x03]);
      const buffer2 = Buffer.from([0x01, 0x02]);

      const result = fileOps.compareFileBuffersBytePerByte(buffer1, buffer2);

      expect(result).toBe(false);
    });

    it("should return true for empty buffers", () => {
      const buffer1 = Buffer.from([]);
      const buffer2 = Buffer.from([]);

      const result = fileOps.compareFileBuffersBytePerByte(buffer1, buffer2);

      expect(result).toBe(true);
    });

    it("should return false when one buffer is empty and the other is not", () => {
      const buffer1 = Buffer.from([0x01]);
      const buffer2 = Buffer.from([]);

      const result = fileOps.compareFileBuffersBytePerByte(buffer1, buffer2);

      expect(result).toBe(false);
    });
  });
});
