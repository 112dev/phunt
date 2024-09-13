import {
  assertIsFileIndexRecordType,
  FileIndexRecord,
} from "./file-index.types";
import { SqliteConnection } from "@112dev/phunt-contracts";

export class FileIndexTableDbService {
  constructor(private readonly db: SqliteConnection) {}

  public getAll(): FileIndexRecord[] {
    const result = this.db.getAll(`
        SELECT
          path,
          checksum,
          checksum_algorithm,
          metadata,
          creation_date
        FROM file_index
      `) as FileIndexRecord[];

    if (result.length === 0) {
      return result;
    }

    assertIsFileIndexRecordType(result[0]);

    return result;
  }

  public getByChecksum(checksum: string): FileIndexRecord | undefined {
    const result: FileIndexRecord | undefined = this.db.getFirst(
      `
          SELECT
            path,
            checksum,
            checksum_algorithm,
            metadata,
            creation_date
          FROM file_index
          WHERE checksum = :checksum
        `,
      {
        checksum: checksum,
      },
    ) as FileIndexRecord | undefined;

    if (result !== undefined) {
      assertIsFileIndexRecordType(result);
    }

    return result;
  }

  public insert(record: FileIndexRecord): void {
    this.db.run(
      `
          INSERT INTO file_index
          (
            path,
            checksum,
            checksum_algorithm,
            metadata,
            creation_date
          )
          VALUES
          (
            :path,
            :checksum,
            :checksum_algorithm,
            :metadata,
            :creation_date
          )
        `,
      {
        path: record.path,
        checksum: record.checksum,
        checksum_algorithm: record.checksum_algorithm,
        metadata: record.metadata,
        creation_date: record.creation_date,
      },
    );
  }

  public delete(path: string): void {
    this.db.run(
      `
          DELETE
          FROM file_index
          WHERE path = :path
        `,
      {
        path: path,
      },
    );
  }
}

export const createFileIndexTableIfNotExists = (db: SqliteConnection): void => {
  db.run(`
    CREATE TABLE IF NOT EXISTS
      file_index
      (
          path TEXT PRIMARY KEY,
          checksum TEXT NOT NULL,
          checksum_algorithm TEXT NOT NULL,
          metadata JSON NULL DEFAULT NULL,
          creation_date TIMESTAMP NOT NULL
      )
  `);
};
