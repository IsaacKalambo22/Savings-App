export type SyncStatus = "synced" | "syncing" | "offline" | "error";

export type SyncOperation = "create" | "update" | "delete";

export interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  entityType: "transaction" | "account" | "transfer" | "goal";
  entityId: string;
  data: Record<string, any>;
  timestamp: Date;
  retryCount: number;
  lastError?: string;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncTime?: Date;
  pendingItems: number;
  isOnline: boolean;
}
