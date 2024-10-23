import {
  SqliteConnection,
  SqliteConnectionOptions,
  SqliteQueryParams,
} from "@112dev/phunt-contracts";
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

type CreateSqliteConnectionParams = {
  file: string | Buffer;
  options: SqliteConnectionOptions;
  id?: string;
};

export const createSqliteConnection = (
  params: CreateSqliteConnectionParams,
): SqliteConnection => {
  const db = new Database(params.file, {
    fileMustExist: !params.options.createDatabaseIfNotExists,
    readonly: params.options.readonly,
  });

  const connectionId = params.id ?? randomUUID();

  const sqliteConnection: SqliteConnection & {
    readonly db: Database.Database;
  } = {
    db: db,

    id: connectionId,

    run(query: string, params?: SqliteQueryParams): unknown {
      const stmt = this.db.prepare(query);

      const result = params === undefined ? stmt.run() : stmt.run(params);

      return result;
    },

    getFirst(query: string, params?: SqliteQueryParams): unknown {
      const stmt = this.db.prepare(query);

      const result = params === undefined ? stmt.get() : stmt.get(params);

      return result;
    },

    getAll(query: string, params?: SqliteQueryParams): unknown[] {
      const stmt = this.db.prepare(query);

      const result = params === undefined ? stmt.all() : stmt.all(params);

      return result;
    },
  };

  return sqliteConnection;
};
