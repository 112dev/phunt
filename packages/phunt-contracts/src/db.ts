export type SqliteConnectionOptions = {
  createDatabaseIfNotExists: boolean;
  readonly: boolean;
};

export type SqliteQueryParams = Record<string, unknown>;

export interface SqliteConnection {
  readonly id: string;

  run(query: string, params?: SqliteQueryParams): unknown;

  getFirst(query: string, params?: SqliteQueryParams): unknown;

  getAll(query: string, params?: SqliteQueryParams): unknown[];
}
