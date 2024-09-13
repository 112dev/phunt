import fs from "fs/promises";
import { FileIndexCriteria } from "./index-dest-dir.types";
import { FileIndexRecord, FileIndexTableDbService } from "../db/file-index";
import { objectContainsCodeProperty } from "@112dev/phunt-typeguards";
import { FileMetadata, FileSearchService } from "@112dev/phunt-contracts";
import { FileOps } from "../file-ops";

type IndexDestinationDirectoryServiceParams = {
  readonly fileOps: FileOps;
  readonly fileSearchService: FileSearchService;
  readonly fileIndexTableDbService: FileIndexTableDbService;
};

export class IndexDestinationDirectoryService {
  private readonly fileOps: FileOps;
  private readonly fileSearchService: FileSearchService;
  private readonly fileIndexTableDbService: FileIndexTableDbService;

  constructor(params: IndexDestinationDirectoryServiceParams) {
    this.fileOps = params.fileOps;
    this.fileSearchService = params.fileSearchService;
    this.fileIndexTableDbService = params.fileIndexTableDbService;
  }

  public async indexAsync(criteria: FileIndexCriteria): Promise<void> {
    const fileSearchResult = await this.fileSearchService.searchAsync({
      srcDir: criteria.srcDir,
      fileExtensions: criteria.fileExtensions,
      recursive: criteria.recursive,
    });

    const existingFileIndexRecords = this.fileIndexTableDbService.getAll();

    const existingFileIndexPaths = await this.handleExistingFileRecords(
      existingFileIndexRecords,
    );

    await this.processNewFiles(fileSearchResult, existingFileIndexPaths);
  }

  private async handleExistingFileRecords(
    existingFileIndexRecords: FileIndexRecord[],
  ): Promise<Set<string>> {
    const existingFileIndexPaths = new Set<string>();

    for (const [index, record] of Object.entries(existingFileIndexRecords)) {
      if (await this.shouldRemoveFileIndexRecord(record)) {
        this.fileIndexTableDbService.delete(record.path);
        existingFileIndexRecords.splice(Number(index), 1);
      } else {
        existingFileIndexPaths.add(record.path);
      }
    }

    return existingFileIndexPaths;
  }

  private async shouldRemoveFileIndexRecord(
    record: FileIndexRecord,
  ): Promise<boolean> {
    try {
      await fs.access(record.path);
      return false;
    } catch (error: unknown) {
      return objectContainsCodeProperty(error) && error.code === "ENOENT";
    }
  }

  private async processNewFiles(
    fileSearchResult: string[],
    existingFileIndexPaths: Set<string>,
  ): Promise<void> {
    for (const filePath of fileSearchResult) {
      if (!existingFileIndexPaths.has(filePath)) {
        const fileChecksum = await this.fileOps.calculateFileChecksumAsync(
          await fs.readFile(filePath),
        );
        const fileMetadata = await this.getFileMetadata(filePath);

        this.fileIndexTableDbService.insert({
          path: filePath,
          checksum_algorithm: fileChecksum.algorithm,
          checksum: fileChecksum.value,
          creation_date: new Date().toISOString(),
          metadata: fileMetadata ? JSON.stringify(fileMetadata) : null,
        });
      }
    }
  }

  private async getFileMetadata(
    filePath: string,
  ): Promise<FileMetadata | null> {
    const fileExifData = await this.fileOps.getExifDataAsync(
      await fs.readFile(filePath),
    );
    return fileExifData ? { Exif: fileExifData } : null;
  }
}
