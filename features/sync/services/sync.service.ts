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
import { pushEntity, pullAll, subscribeToRemoteChanges } from "./supabase-sync";
import { AppState, AppStateStatus } from "react-native";
import { useAppStore } from "@/store/app.store";

/** The household whose data this device should pull (null before onboarding). */
function activeHouseholdId(): string | null {
  return useAppStore.getState().householdId;
}

/**
 * Mark a local row as synced. Deletes in NestKeep are soft (Rule 2) — the row
 * stays with deletedAt set — so this only updates sync bookkeeping and never
 * removes the local row.
 */
async function markSynced(
  table: "transactions" | "accounts" | "transfers",
  entityId: string
): Promise<void> {
  const db = await getDb();
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
 * Handler invoked after a pull applies remote rows, so the app can reload the
 * on-screen stores from local SQLite. Registered by the app on startup (see
 * lib/hydrate.ts) to avoid a circular import between the sync and data layers.
 */
let dataChangeHandler: (() => void | Promise<void>) | null = null;

export function registerDataChangeHandler(
  handler: (() => void | Promise<void>) | null
): void {
  dataChangeHandler = handler;
}

/**
 * Pull remote changes into local SQLite and, if anything was applied, refresh
 * the app's stores. Safe to call often — it's a no-op when offline or when
 * Supabase isn't configured. Debounced callers (realtime) can hit this freely.
 */
export async function pullAndReload(): Promise<number> {
  if (!isOnline()) return 0;
  const householdId = activeHouseholdId();
  if (!householdId) return 0;
  const applied = await pullAll(householdId);
  if (applied > 0 && dataChangeHandler) {
    await dataChangeHandler();
  }
  return applied;
}

/**
 * Initialize sync service. Runs a bidirectional sync (push queued edits, then
 * pull remote changes) on an interval, on reconnect, when the app returns to
 * the foreground, and instantly via Supabase Realtime when another member's
 * device writes.
 */
export function initializeSync(onStatusChange: (status: SyncStatus) => void) {
  const runSync = (announce: boolean) => {
    if (!isOnline() || syncInProgress) return;
    if (announce) onStatusChange("syncing");
    performSync()
      .then(() => announce && onStatusChange("synced"))
      .catch((err) => {
        console.error(err);
        if (announce) onStatusChange("error");
      });
  };

  // Periodic bidirectional sync (also the fallback if Realtime isn't enabled).
  syncInterval = setInterval(() => runSync(false), 30000);

  // Listen for network changes.
  const unsubscribeNetwork = onNetworkChange((isOnlineStatus) => {
    if (isOnlineStatus) {
      runSync(true);
    } else {
      onStatusChange("offline");
    }
  });

  // Pull fresh data whenever the app comes back to the foreground.
  const appStateSub = AppState.addEventListener(
    "change",
    (state: AppStateStatus) => {
      if (state === "active") runSync(false);
    }
  );

  // Instant updates: pull + reload as soon as another device writes remotely.
  // Debounced so a burst of row events triggers a single pull.
  let realtimeTimer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribeRealtime = subscribeToRemoteChanges(() => {
    if (realtimeTimer) clearTimeout(realtimeTimer);
    realtimeTimer = setTimeout(() => {
      pullAndReload().catch(console.error);
    }, 400);
  });

  return () => {
    if (syncInterval) clearInterval(syncInterval);
    if (realtimeTimer) clearTimeout(realtimeTimer);
    unsubscribeNetwork();
    appStateSub.remove();
    unsubscribeRealtime();
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
    // 1. Push local edits up.
    for (const item of pendingItems) {
      await syncItem(item);
    }

    // 2. Pull remote edits (other members' changes) down, and refresh the
    //    on-screen stores if anything changed. Best-effort — a pull failure
    //    must not lose the push work above.
    try {
      const householdId = activeHouseholdId();
      const applied = householdId ? await pullAll(householdId) : 0;
      if (applied > 0 && dataChangeHandler) {
        await dataChangeHandler();
      }
    } catch (err) {
      console.warn("Pull during sync failed (continuing):", err);
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
 * Sync a transaction: push to Supabase (best-effort), then mark synced locally.
 * A push failure throws so syncItem records the retry.
 */
async function syncTransaction(item: SyncQueueItem): Promise<void> {
  await pushEntity("transaction", item.entityId);
  await markSynced("transactions", item.entityId);
}

async function syncAccount(item: SyncQueueItem): Promise<void> {
  await pushEntity("account", item.entityId);
  await markSynced("accounts", item.entityId);
}

async function syncTransfer(item: SyncQueueItem): Promise<void> {
  await pushEntity("transfer", item.entityId);
  await markSynced("transfers", item.entityId);
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
