import { Stats } from "node:fs";

export type FileExifData = {
  DateTimeOriginal?: Date;
  DateTime?: Date;
};

export type FileMetadata = {
  Exif?: FileExifData;
};

export type ShaAlgorithm = "sha256" | "sha512";

export type FileChecksum = {
  value: string;
  algorithm: ShaAlgorithm;
};

export type FileStats = Stats;
