import { PrismaClient } from "@/types/prisma";
import { BackupMetadata } from "@/types/export";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import dayjs from "dayjs";

const prisma = new PrismaClient();

/**
 * Database Backup Service
 * Creates and restores database backups
 */

/**
 * Create a full database backup
 */
export async function createBackup(): Promise<{ success: boolean; filePath?: string; metadata?: BackupMetadata; error?: string }> {
  try {
    // Fetch all data
    const accounts = await prisma.account.findMany({ where: { deletedAt: null } });
    const transactions = await prisma.transaction.findMany({ where: { deletedAt: null } });
    const transfers = await prisma.transfer.findMany();
    const households = await prisma.household.findMany({ where: { deletedAt: null } });
    const settings = await prisma.settings.findMany();

    // Create backup object
    const backup = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      data: {
        households,
        accounts,
        transactions,
        transfers,
        settings,
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
        accounts: accounts.length,
        transactions: transactions.length,
        transfers: transfers.length,
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
    const backupJson = await FileSystem.readAsStringAsync(filePath);
    const backup = JSON.parse(backupJson);

    // Validate backup format
    if (!backup.version || !backup.data) {
      throw new Error("Invalid backup format");
    }

    // Restore data (in transaction for consistency)
    await prisma.$transaction(async (tx) => {
      // Clear existing data
      await tx.transfer.deleteMany();
      await tx.transaction.deleteMany();
      await tx.account.deleteMany();
      await tx.household.deleteMany();
      await tx.settings.deleteMany();

      // Restore households
      for (const household of backup.data.households) {
        await tx.household.create({ data: household });
      }

      // Restore accounts
      for (const account of backup.data.accounts) {
        await tx.account.create({ data: account });
      }

      // Restore transactions
      for (const transaction of backup.data.transactions) {
        await tx.transaction.create({ data: transaction });
      }

      // Restore transfers
      for (const transfer of backup.data.transfers) {
        await tx.transfer.create({ data: transfer });
      }

      // Restore settings
      for (const setting of backup.data.settings) {
        await tx.settings.create({ data: setting });
      }
    });

    const restoredCount = {
      households: backup.data.households.length,
      accounts: backup.data.accounts.length,
      transactions: backup.data.transactions.length,
      transfers: backup.data.transfers.length,
      settings: backup.data.settings.length,
    };

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
