export interface FileSearchService {
  searchAsync(criteria: FileSearchCriteria): Promise<FileSearchResult>;
}

export type FileSearchCriteria = {
  srcDir: string;
  fileExtensions: Array<string>;
  recursive: boolean;
};

export type FileSearchResult = Array<string>;
