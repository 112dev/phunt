import { createFileIndexTableIfNotExists } from "./file-index/file-index";
import { createSqliteConnection } from "@112dev/phunt-db";
import { SqliteConnection } from "@112dev/phunt-contracts";

export * from "./file-index/file-index";

export const getDefaultDatabaseFileName = (): string => {
  return `phunt.db`;
};

export const initDb = (path: string): SqliteConnection => {
  const db = createSqliteConnection({
    file: path,
    options: {
      createDatabaseIfNotExists: true,
      readonly: false,
    },
  });

  createFileIndexTableIfNotExists(db);

  return db;
};
