import { createFileIndexTableIfNotExists } from "./file-index.js";
import { createSqliteConnection } from "@112dev/phunt-db";
import { SqliteConnection } from "@112dev/phunt-contracts/db";

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
