import { createMMKV } from "react-native-mmkv";
import { SyncQueueItem, SyncOperation } from "@/types/sync";
import { v4 as uuidv4 } from "uuid";

const SYNC_QUEUE_KEY = "sync_queue";
const syncStorage = createMMKV();

/**
 * Sync Queue Service
 * Manages pending operations that need to be synced
 */

/**
 * Get all pending sync items
 */
export function getSyncQueue(): SyncQueueItem[] {
  try {
    const data = syncStorage.getString(SYNC_QUEUE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading sync queue:", error);
    return [];
  }
}

/**
 * Save sync queue to storage
 */
function saveSyncQueue(queue: SyncQueueItem[]) {
  try {
    syncStorage.set(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error saving sync queue:", error);
  }
}

/**
 * Add item to sync queue
 */
export function addToSyncQueue(
  operation: SyncOperation,
  entityType: "transaction" | "account" | "transfer",
  entityId: string,
  data: Record<string, any>
): SyncQueueItem {
  const queue = getSyncQueue();
  const item: SyncQueueItem = {
    id: uuidv4(),
    operation,
    entityType,
    entityId,
    data,
    timestamp: new Date(),
    retryCount: 0,
  };
  queue.push(item);
  saveSyncQueue(queue);
  return item;
}

/**
 * Remove item from sync queue
 */
export function removeFromSyncQueue(itemId: string) {
  const queue = getSyncQueue();
  const filtered = queue.filter((item) => item.id !== itemId);
  saveSyncQueue(filtered);
}

/**
 * Update item in sync queue
 */
export function updateSyncQueueItem(itemId: string, updates: Partial<SyncQueueItem>) {
  const queue = getSyncQueue();
  const index = queue.findIndex((item) => item.id === itemId);
  if (index !== -1) {
    queue[index] = { ...queue[index], ...updates };
    saveSyncQueue(queue);
  }
}

/**
 * Get pending items for a specific entity
 */
export function getPendingItemsForEntity(
  entityType: "transaction" | "account" | "transfer",
  entityId: string
): SyncQueueItem[] {
  const queue = getSyncQueue();
  return queue.filter(
    (item) => item.entityType === entityType && item.entityId === entityId
  );
}

/**
 * Get all pending items
 */
export function getPendingItems(): SyncQueueItem[] {
  const queue = getSyncQueue();
  return queue.filter((item) => item.retryCount < 3);
}

/**
 * Clear all sync queue items
 */
export function clearSyncQueue() {
  syncStorage.set(SYNC_QUEUE_KEY, "");
}

/**
 * Get queue size
 */
export function getQueueSize(): number {
  return getSyncQueue().length;
}
