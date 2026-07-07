import { BackupMetadata } from "@/types/export";
import { bootstrapDatabase, getDb } from "@/lib/db";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import dayjs from "dayjs";

/**
 * Database Backup Service
 * Creates and restores database backups
 */

// Tables included in a full backup, in FK-safe restore order.
const BACKUP_TABLES = [
  "households",
  "settings",
  "household_members",
  "accounts",
  "transactions",
  "transfers",
  "savings_goals",
] as const;

async function dumpTable(table: string): Promise<any[]> {
  const db = await getDb();
  return db.getAllAsync<any>(`SELECT * FROM ${table}`);
}

/**
 * Create a full database backup
 */
export async function createBackup(): Promise<{ success: boolean; filePath?: string; metadata?: BackupMetadata; error?: string }> {
  try {
    await bootstrapDatabase();

    const tables: Record<string, any[]> = {};
    for (const table of BACKUP_TABLES) {
      tables[table] = await dumpTable(table);
    }

    // Create backup object (raw SQLite rows keep money as integer tambala).
    const backup = {
      version: "2.0",
      createdAt: new Date().toISOString(),
      tables,
      // Back-compat aliases for older readers.
      data: {
        households: tables.households,
        accounts: tables.accounts,
        transactions: tables.transactions,
        transfers: tables.transfers,
        settings: tables.settings,
      },
    };

    const backupJson = JSON.stringify(backup, null, 2);
    const filename = `nestkeep_backup_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.json`;
    const fileUri = (FileSystem as any).documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, backupJson, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const metadata: BackupMetadata = {
      id: filename.replace(".json", ""),
      createdAt: new Date(),
      recordCount: {
        accounts: tables.accounts.length,
        transactions: tables.transactions.length,
        transfers: tables.transfers.length,
      },
      fileSize: backupJson.length,
    };

    return {
      success: true,
      filePath: fileUri,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Restore database from backup
 */
export async function restoreBackup(filePath: string): Promise<{ success: boolean; error?: string; restoredCount?: any }> {
  try {
    await bootstrapDatabase();
    const backupJson = await FileSystem.readAsStringAsync(filePath);
    const backup = JSON.parse(backupJson);

    // Accept both v2 (tables) and legacy v1 (data) formats.
    const tables: Record<string, any[]> =
      backup.tables ?? backup.data ?? null;
    if (!backup.version || !tables) {
      throw new Error("Invalid backup format");
    }

    const db = await getDb();
    const restoredCount: Record<string, number> = {};

    await db.withTransactionAsync(async () => {
      // Clear existing data (reverse FK order).
      for (const table of [...BACKUP_TABLES].reverse()) {
        await db.runAsync(`DELETE FROM ${table}`);
      }

      // Restore each table from its rows.
      for (const table of BACKUP_TABLES) {
        const rows = tables[table] ?? [];
        for (const row of rows) {
          await insertRow(table, row);
        }
        restoredCount[table] = rows.length;
      }
    });

    return {
      success: true,
      restoredCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Insert a raw row object into a table by its own column keys. */
async function insertRow(table: string, row: Record<string, any>): Promise<void> {
  const db = await getDb();
  const columns = Object.keys(row);
  if (columns.length === 0) return;
  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map((c) => row[c]);
  await db.runAsync(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    values
  );
}

/**
 * Share backup file
 */
export async function shareBackup(filePath: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: "application/json",
      dialogTitle: "Share Backup",
    });
  }
}

/**
 * List local backups
 */
export async function listBackups(): Promise<BackupMetadata[]> {
  try {
    const directory = (FileSystem as any).documentDirectory;
    const files = await FileSystem.readDirectoryAsync(directory);
    const backupFiles = files.filter((f) => f.startsWith("nestkeep_backup_") && f.endsWith(".json"));

    const backups: BackupMetadata[] = [];

    for (const file of backupFiles as string[]) {
      const fileUri = directory + file;
      const info = await FileSystem.getInfoAsync(fileUri);
      
      if (info.exists && info.size) {
        const filename = file.replace(".json", "");
        const dateMatch = filename.match(/nestkeep_backup_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
        const createdAt = dateMatch ? dayjs(dateMatch[1], "YYYY-MM-DD_HH-mm-ss").toDate() : new Date();

        backups.push({
          id: filename,
          createdAt,
          recordCount: {
            accounts: 0,
            transactions: 0,
            transfers: 0,
          },
          fileSize: info.size,
        });
      }
    }

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error listing backups:", error);
    return [];
  }
}

/**
 * Delete backup file
 */
export async function deleteBackup(filename: string): Promise<boolean> {
  try {
    const directory = (FileSystem as any).documentDirectory;
    const fileUri = directory + filename + ".json";
    await FileSystem.deleteAsync(fileUri);
    return true;
  } catch (error) {
    console.error("Error deleting backup:", error);
    return false;
  }
}
