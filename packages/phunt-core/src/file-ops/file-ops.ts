import crypto from "crypto";
import { Tags } from "exifreader";
import ExifReader from "exifreader";
import path from "path";
import fs from "fs/promises";
import {
  FileChecksum,
  FileExifData,
  FileMetadata,
  FileStats,
  Logger,
  ShaAlgorithm,
} from "@112dev/phunt-contracts";
import { DateParser } from "../date-parser/date-parser";
import { objectContainsCodeProperty } from "@112dev/phunt-typeguards";

type FileOpsParams = {
  readonly logger: Logger;
  readonly dateParser: DateParser;
};

export class FileOps {
  private readonly logger: Logger;
  private readonly dateParser: DateParser;
  private readonly readFileCache = new Map<string, Buffer>();

  constructor(params: FileOpsParams) {
    this.logger = params.logger;
    this.dateParser = params.dateParser;
  }

  async calculateFileChecksumAsync(file: Buffer): Promise<FileChecksum> {
    let algorithm: ShaAlgorithm = "sha256";

    if (
      (process.arch === "x64" || process.arch === "arm64") &&
      crypto.getHashes().includes("sha512")
    ) {
      algorithm = "sha512"; // On 64bit architectures sha512 is more performant
    }

    try {
      const hash = crypto.createHash(algorithm);
      hash.update(file);
      return {
        algorithm: algorithm,
        value: hash.digest("hex"),
      };
    } catch (error) {
      throw new Error(
        "An error occurred while trying to calculate file checksum!",
        {
          cause: error,
        },
      );
    }
  }

  public async readFileAsync(
    filePath: string,
    forceReread: boolean = false,
  ): Promise<Buffer> {
    if (!forceReread && this.readFileCache.has(filePath)) {
      return this.readFileCache.get(filePath)!;
    }

    const fileBuffer = await fs.readFile(filePath);

    this.readFileCache.set(filePath, fileBuffer);

    return fileBuffer;
  }

  public clearReadFileCache(): void {
    this.readFileCache.clear();
  }

  async getFileStatsAsync(filePath: string): Promise<FileStats> {
    return await fs.stat(filePath);
  }

  async getExifDataAsync(
    file: Buffer,
    throwOnError?: boolean,
  ): Promise<FileExifData | undefined> {
    let exifTags: Tags;

    try {
      exifTags = await ExifReader.load(file);
    } catch (error: unknown) {
      if (throwOnError) {
        throw error;
      }

      this.logger.logDebug(
        "An error occurred during reading Exif data!",
        error,
      );
      return;
    }

    if (Object.keys(exifTags).length === 0) {
      return;
    }

    const exifData: FileExifData = {};

    exifData.DateTimeOriginal = this.extractExifDate(
      exifTags,
      "DateTimeOriginal",
    );
    exifData.DateTime = this.extractExifDate(exifTags, "DateTime");

    return exifData;
  }

  private extractExifDate(exifTags: Tags, fieldName: string): Date | undefined {
    if (exifTags[fieldName] && exifTags[fieldName].description !== undefined) {
      try {
        return this.parseExifDateTagFromDescription(
          exifTags[fieldName].description,
        );
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.logger.logDebug(
            `Error parsing EXIF field ${fieldName}: ${error.message}`,
          );
        } else {
          this.logger.logDebug(
            `Unknown error parsing EXIF field ${fieldName}`,
            error,
          );
        }
      }
    }

    return undefined;
  }

  private parseExifDateTagFromDescription(description: unknown): Date {
    if (typeof description === "string") {
      return this.parseExifDateFormatFromStringInput(description);
    }

    if (
      Array.isArray(description) &&
      description.length === 1 &&
      typeof description[0] === "string"
    ) {
      return this.parseExifDateFormatFromStringInput(description[0]);
    }

    if (typeof description === "object" && description !== null) {
      const descObj = description as { date?: string; time?: string };
      if (
        typeof descObj.date === "string" &&
        typeof descObj.time === "string"
      ) {
        return this.parseExifDateFormatFromStringInput(
          `${descObj.date} ${descObj.time}`,
        );
      }
    }

    throw new Error("Invalid EXIF date format: Unable to parse description");
  }

  private parseExifDateFormatFromStringInput(input: string): Date {
    const now = new Date();

    // Handle ISO-like format 'YYYY-MM-DDThh-mm-ss'
    if (/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/.test(input)) {
      return this.dateParser.parse(input, "yyyy-MM-dd'T'HH-mm-ss", now);
    }

    // Handle traditional EXIF format 'YYYY:MM:DD hh:mm:ss'
    else if (/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(input)) {
      return this.dateParser.parse(input, "yyyy:MM:dd HH:mm:ss", now);
    }

    // Handle EXIF format 'YYYY: MM:DD HH:MM:SS' with leading zeroes
    if (/^\d{4}:\s?\d{2}:\d{2}\s\d{2}:\d{2}:\d{2}$/.test(input)) {
      return this.dateParser.parse(input, "yyyy: MM:dd HH:mm:ss", now);
    }

    // Handle EXIF format 'YYYY: M:D HH:MM:SS' without leading zeroes
    else if (/^\d{4}:\s?\d{1,2}:\s?\d{1,2}\s\d{2}:\d{2}:\d{2}$/.test(input)) {
      return this.dateParser.parse(input, "yyyy: M:d HH:mm:ss", now);
    }

    // Handle basic ISO format 'YYYY-MM-DDTHH:MM:SS'
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(input)) {
      return this.dateParser.parse(input, "yyyy-MM-dd'T'HH:mm:ss", now);
    }

    // Handle ISO format with milliseconds 'YYYY-MM-DDTHH:MM:SS.sss'
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(input)) {
      return this.dateParser.parse(input, "yyyy-MM-dd'T'HH:mm:ss.SSS", now);
    }

    // Handle ISO format with timezone 'YYYY-MM-DDTHH:MM:SSZ'
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(input)) {
      return this.dateParser.parse(input, "yyyy-MM-dd'T'HH:mm:ssX", now);
    }

    // Handle format with slashes 'YYYY/MM/DD HH:mm:ss'
    else if (/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(input)) {
      return this.dateParser.parse(input, "yyyy/MM/dd HH:mm:ss", now);
    }

    // Handle date format with slashes and no time 'YYYY/MM/DD'
    else if (/^\d{4}\/\d{2}\/\d{2}$/.test(input)) {
      return this.dateParser.parse(input, "yyyy/MM/dd", now);
    }

    throw new Error(`Unrecognized date format: ${input}`);
  }

  getFileExtension(filePath: string): string {
    const { ext } = path.parse(filePath);
    return ext;
  }

  async getFileMetadataFromBufferAsync(
    buffer: Buffer,
  ): Promise<FileMetadata | null> {
    let fileMetadata: FileMetadata | null = null;

    const fileExifData = await this.getExifDataAsync(buffer);

    if (fileExifData !== undefined) {
      fileMetadata = {
        Exif: fileExifData,
      };
    }

    return fileMetadata;
  }

  getFileName(filePath: string, includeExtension?: boolean): string {
    const { base, name } = path.parse(filePath);
    return includeExtension ? base : name;
  }

  async getShortHashAsync(file: Buffer, length?: number): Promise<string> {
    const fileChecksum = await this.calculateFileChecksumAsync(file);
    return fileChecksum.value.substring(0, length);
  }

  async moveFileAsync(srcPath: string, destPath: string): Promise<void> {
    // Create the directory structure if it doesn't exist
    await fs.mkdir(path.dirname(destPath), {
      recursive: true,
    });

    try {
      await fs.rename(srcPath, destPath);
    } catch (e: unknown) {
      if (objectContainsCodeProperty(e) && e.code === "EXDEV") {
        await fs.copyFile(srcPath, destPath);
        await fs.unlink(srcPath);
        return;
      }

      throw e;
    }
  }

  async writeFileFromBufferAsync(buffer: Buffer, dest: string): Promise<void> {
    // Create the directory structure if it doesn't exist
    await fs.mkdir(path.dirname(dest), {
      recursive: true,
    });

    await fs.writeFile(dest, buffer);
  }

  async removeFileAsync(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }
}
