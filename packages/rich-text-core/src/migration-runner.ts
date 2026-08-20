import {
  CURRENT_RICH_TEXT_SCHEMA_VERSION,
  migrateDocument,
  RICH_TEXT_MIGRATIONS,
  type Migration
} from "./migrations";
import type { RichTextDocument } from "./types";

export type RichTextMigrationFailureCode = "MIGRATION_FAILED";

export interface RichTextMigrationSuccess {
  ok: true;
  document: RichTextDocument;
  schemaVersion: string;
  migrationsApplied: string[];
}

export interface RichTextMigrationFailure {
  ok: false;
  code: RichTextMigrationFailureCode;
  message: string;
  document: RichTextDocument;
  targetSchemaVersion: string;
}

export type RichTextMigrationResult = RichTextMigrationSuccess | RichTextMigrationFailure;

export interface RunRichTextMigrationsOptions {
  targetSchemaVersion?: string;
  migrations?: readonly Migration[];
}

export function runRichTextMigrations(
  document: RichTextDocument,
  options: RunRichTextMigrationsOptions = {}
): RichTextMigrationResult {
  const targetSchemaVersion = options.targetSchemaVersion ?? CURRENT_RICH_TEXT_SCHEMA_VERSION;
  const migrations = options.migrations ?? RICH_TEXT_MIGRATIONS;
  const original = cloneDocument(document);

  try {
    const migrated = migrateDocument(document, targetSchemaVersion, migrations);
    return {
      ok: true,
      document: migrated,
      schemaVersion: migrated.schemaVersion,
      migrationsApplied: collectMigrationPath(document.schemaVersion, targetSchemaVersion, migrations)
    };
  } catch (error) {
    return {
      ok: false,
      code: "MIGRATION_FAILED",
      message: error instanceof Error ? error.message : "Rich text schema migration failed",
      document: original,
      targetSchemaVersion
    };
  }
}

function collectMigrationPath(
  fromSchemaVersion: string,
  targetSchemaVersion: string,
  migrations: readonly Migration[]
): string[] {
  if (fromSchemaVersion === targetSchemaVersion) return [];

  const byFrom = new Map(migrations.map((migration) => [migration.from, migration]));
  const path: string[] = [];
  const visited = new Set<string>();
  let current = fromSchemaVersion;

  while (current !== targetSchemaVersion) {
    if (visited.has(current)) return path;
    visited.add(current);
    const migration = byFrom.get(current);
    if (!migration) return path;
    path.push(`${migration.from}->${migration.to}`);
    current = migration.to;
  }

  return path;
}

function cloneDocument(document: RichTextDocument): RichTextDocument {
  return JSON.parse(JSON.stringify(document)) as RichTextDocument;
}
