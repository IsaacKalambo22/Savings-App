import { SyncQueueItem, SyncStatus } from "@/types/sync";
import {
  getPendingItems,
  removeFromSyncQueue,
  updateSyncQueueItem,
  addToSyncQueue,
} from "./sync-queue.service";
import { isOnline, onNetworkChange } from "./network.service";
import { getDb, nowIso } from "@/lib/db";
import { SyncStatus as SyncStatusEnum } from "@/types/prisma";

/**
 * Mark a local row as synced (or delete it for delete operations).
 * NOTE: Remote push/pull to Supabase is implemented in Stage 3; for now this
 * settles the local sync state so the queue drains and UI reflects "synced".
 */
async function settleLocal(
  table: "transactions" | "accounts" | "transfers",
  operation: string,
  entityId: string
): Promise<void> {
  const db = await getDb();
  if (operation === "delete") {
    await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [entityId]);
    return;
  }
  await db.runAsync(
    `UPDATE ${table} SET syncStatus = ?, syncedAt = ? WHERE id = ?`,
    [SyncStatusEnum.SYNCED, nowIso(), entityId]
  );
}

/**
 * Sync Service
 * Handles background synchronization and conflict resolution
 */

let syncInProgress = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize sync service
 */
export function initializeSync(onStatusChange: (status: SyncStatus) => void) {
  // Start periodic sync every 30 seconds
  syncInterval = setInterval(() => {
    if (isOnline() && !syncInProgress) {
      performSync().catch(console.error);
    }
  }, 30000);

  // Listen for network changes
  const unsubscribe = onNetworkChange((isOnlineStatus) => {
    if (isOnlineStatus && !syncInProgress) {
      onStatusChange("syncing");
      performSync()
        .then(() => onStatusChange("synced"))
        .catch(() => onStatusChange("error"));
    } else {
      onStatusChange("offline");
    }
  });

  return () => {
    if (syncInterval) clearInterval(syncInterval);
    unsubscribe();
  };
}

/**
 * Perform sync of all pending items
 */
export async function performSync(): Promise<void> {
  if (syncInProgress) return;
  if (!isOnline()) {
    throw new Error("No network connection");
  }

  syncInProgress = true;
  const pendingItems = getPendingItems();

  try {
    for (const item of pendingItems) {
      await syncItem(item);
    }
  } finally {
    syncInProgress = false;
  }
}

/**
 * Sync a single item
 */
async function syncItem(item: SyncQueueItem): Promise<void> {
  try {
    switch (item.entityType) {
      case "transaction":
        await syncTransaction(item);
        break;
      case "account":
        await syncAccount(item);
        break;
      case "transfer":
        await syncTransfer(item);
        break;
    }
    removeFromSyncQueue(item.id);
  } catch (error) {
    console.error(`Sync failed for item ${item.id}:`, error);
    updateSyncQueueItem(item.id, {
      retryCount: item.retryCount + 1,
      lastError: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Sync transaction
 */
async function syncTransaction(item: SyncQueueItem): Promise<void> {
  await settleLocal("transactions", item.operation, item.entityId);
}

/**
 * Sync account
 */
async function syncAccount(item: SyncQueueItem): Promise<void> {
  await settleLocal("accounts", item.operation, item.entityId);
}

/**
 * Sync transfer
 */
async function syncTransfer(item: SyncQueueItem): Promise<void> {
  await settleLocal("transfers", item.operation, item.entityId);
}

/**
 * Resolve conflict (server wins strategy)
 */
export function resolveConflict(localData: any, serverData: any): any {
  // Simple conflict resolution: server wins
  // In a real app, you might implement more sophisticated strategies
  return serverData;
}

/**
 * Trigger manual sync
 */
export async function triggerManualSync(): Promise<void> {
  if (!isOnline()) {
    throw new Error("No network connection");
  }
  return performSync();
}
