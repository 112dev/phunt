import fs from "fs/promises";
import path from "path";
import {
  FileSearchService,
  FileSearchCriteria,
  FileSearchResult,
} from "@112dev/phunt-contracts/file-search";

export class LocalFileSystemFileSearchService implements FileSearchService {
  async searchAsync(criteria: FileSearchCriteria): Promise<FileSearchResult> {
    const result: string[] = [];

    const files = await fs.readdir(criteria.srcDir);

    for (const file of files) {
      const filePath = path.join(criteria.srcDir, file);
      const fileStat = await fs.stat(filePath);

      if (fileStat.isDirectory() && criteria.recursive) {
        const subDirResult = await this.searchAsync({
          ...criteria,
          srcDir: filePath,
        });
        result.push(...subDirResult);
      } else if (criteria.fileExtensions.some((ext) => file.endsWith(ext))) {
        result.push(filePath);
      }
    }

    return result;
  }
}
