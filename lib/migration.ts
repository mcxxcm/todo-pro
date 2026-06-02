import AsyncStorage from "@react-native-async-storage/async-storage";

const SCHEMA_VERSION_KEY = "@todopro:schema_version";
const CURRENT_SCHEMA_VERSION = 2;

interface Migration {
  version: number;
  description: string;
  migrate: () => Promise<void>;
}

const TASKS_KEY = "@todopro:tasks";

const MIGRATIONS: Migration[] = [
  {
    version: 2,
    description: "Add v2 fields (subtasks, recurrence, estimatedMinutes, actualMinutes, completedAt, xp, focusSessions) to existing tasks",
    migrate: async () => {
      const raw = await AsyncStorage.getItem(TASKS_KEY);
      if (!raw) return;
      const tasks = JSON.parse(raw);
      if (!Array.isArray(tasks)) return;
      // All new fields are optional — existing tasks are forward-compatible.
      // Migration exists to stamp the schema version; no data transform needed.
    },
  },
];

async function getCurrentVersion(): Promise<number> {
  const stored = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
  if (!stored) return 0; // First install or pre-migration data
  const version = parseInt(stored, 10);
  return isNaN(version) ? 0 : version;
}

async function setCurrentVersion(version: number): Promise<void> {
  await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(version));
}

/**
 * Run all pending data migrations on app startup.
 * Safe to call multiple times — only runs migrations with version > current.
 *
 * @returns The final schema version after all migrations have run.
 */
export async function runMigrations(): Promise<number> {
  const currentVersion = await getCurrentVersion();

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return currentVersion;
  }

  const pendingMigrations = MIGRATIONS
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pendingMigrations) {
    console.log(
      `[migration] Running v${migration.version}: ${migration.description}`,
    );
    try {
      await migration.migrate();
      await setCurrentVersion(migration.version);
      console.log(`[migration] v${migration.version} complete`);
    } catch (err) {
      console.error(
        `[migration] v${migration.version} FAILED:`,
        err instanceof Error ? err.message : err,
      );
      // Stop migration chain on failure to prevent data corruption
      return migration.version - 1;
    }
  }

  // Stamp current version even if no migrations ran (first install)
  await setCurrentVersion(CURRENT_SCHEMA_VERSION);
  return CURRENT_SCHEMA_VERSION;
}

export { CURRENT_SCHEMA_VERSION };
