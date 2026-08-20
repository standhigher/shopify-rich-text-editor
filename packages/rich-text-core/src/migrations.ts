import type { RichTextDocument } from "./types";

export interface Migration {
  from: string;
  to: string;
  migrate: (document: RichTextDocument) => RichTextDocument;
}

export type MigrationErrorCode = "MISSING_MIGRATION" | "DUPLICATE_MIGRATION" | "MIGRATION_CYCLE";

export class MigrationError extends Error {
  readonly code: MigrationErrorCode;

  constructor(code: MigrationErrorCode, message: string) {
    super(message);
    this.name = "MigrationError";
    this.code = code;
  }
}

export function migrateDocument(
  document: RichTextDocument,
  targetSchemaVersion: string,
  migrations: readonly Migration[]
): RichTextDocument {
  const byFrom = new Map<string, Migration>();
  for (const migration of migrations) {
    if (byFrom.has(migration.from)) {
      throw new MigrationError(
        "DUPLICATE_MIGRATION",
        `More than one migration starts at schema version ${migration.from}`
      );
    }
    byFrom.set(migration.from, migration);
  }

  assertAcyclic(migrations);
  if (document.schemaVersion === targetSchemaVersion) return cloneDocument(document);

  const path: Migration[] = [];
  const visited = new Set<string>();
  let currentVersion = document.schemaVersion;
  while (currentVersion !== targetSchemaVersion) {
    if (visited.has(currentVersion)) {
      throw new MigrationError("MIGRATION_CYCLE", `Migration cycle includes schema version ${currentVersion}`);
    }
    visited.add(currentVersion);
    const migration = byFrom.get(currentVersion);
    if (!migration) {
      throw new MigrationError(
        "MISSING_MIGRATION",
        `No migration exists from schema version ${currentVersion} to ${targetSchemaVersion}`
      );
    }
    path.push(migration);
    currentVersion = migration.to;
  }

  let migrated = cloneDocument(document);
  for (const migration of path) {
    migrated = migration.migrate(cloneDocument(migrated));
  }
  return cloneDocument(migrated);
}

function assertAcyclic(migrations: readonly Migration[]): void {
  const outgoing = new Map<string, string>();
  for (const migration of migrations) outgoing.set(migration.from, migration.to);

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (version: string): void => {
    if (visited.has(version) || !outgoing.has(version)) return;
    if (visiting.has(version)) {
      throw new MigrationError("MIGRATION_CYCLE", `Migration cycle includes schema version ${version}`);
    }
    visiting.add(version);
    visit(outgoing.get(version)!);
    visiting.delete(version);
    visited.add(version);
  };

  for (const migration of migrations) visit(migration.from);
}

function cloneDocument(document: RichTextDocument): RichTextDocument {
  return JSON.parse(JSON.stringify(document)) as RichTextDocument;
}
