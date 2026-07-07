import { Account, AccountStatus, SyncStatus, TransactionType } from "@/types/prisma";
import { AccountWithBalance, AccountFormData } from "@/types/account";
import {
  DEFAULT_HOUSEHOLD_ID,
  bootstrapDatabase,
  getDb,
  mapAccount,
  nowIso,
} from "@/lib/db";
import { generateId } from "@/lib/utils";
import { addToSyncQueue } from "@/features/sync/services/sync-queue.service";

/**
 * Ensure the default household exists.
 * Bootstrapping (schema + seed) is idempotent, so this simply guarantees the
 * database is ready and returns the default household id.
 */
export async function ensureDefaultHousehold(): Promise<string> {
  await bootstrapDatabase();
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM households WHERE deletedAt IS NULL ORDER BY createdAt ASC LIMIT 1"
  );
  return row?.id ?? DEFAULT_HOUSEHOLD_ID;
}

/**
 * Calculate account balance from transaction history.
 * Rule 1: Transactions are the source of truth
 * Rule 6: Money stored as BigInt (tambala)
 */
export async function calculateAccountBalance(accountId: string): Promise<bigint> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ deposits: number | null; withdrawals: number | null }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) AS deposits,
       COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) AS withdrawals
     FROM transactions
     WHERE accountId = ? AND deletedAt IS NULL AND isReversed = 0`,
    [TransactionType.DEPOSIT, TransactionType.WITHDRAWAL, accountId]
  );
  const deposits = BigInt(row?.deposits ?? 0);
  const withdrawals = BigInt(row?.withdrawals ?? 0);
  return deposits - withdrawals;
}

async function countTransactions(accountId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM transactions WHERE accountId = ? AND deletedAt IS NULL",
    [accountId]
  );
  return row?.count ?? 0;
}

async function withBalance(account: Account): Promise<AccountWithBalance> {
  const [balance, transactionCount] = await Promise.all([
    calculateAccountBalance(account.id),
    countTransactions(account.id),
  ]);
  return { ...account, balance, transactionCount };
}

/**
 * Get all accounts with calculated balances.
 */
export async function getAccountsWithBalance(householdId: string): Promise<AccountWithBalance[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM accounts
     WHERE householdId = ? AND deletedAt IS NULL
     ORDER BY sortOrder ASC, createdAt DESC`,
    [householdId]
  );
  return Promise.all(rows.map((r) => withBalance(mapAccount(r))));
}

/**
 * Get a single account with balance.
 */
export async function getAccountWithBalance(id: string): Promise<AccountWithBalance | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    "SELECT * FROM accounts WHERE id = ? AND deletedAt IS NULL",
    [id]
  );
  if (!row) return null;
  return withBalance(mapAccount(row));
}

/**
 * Create a new account.
 */
export async function createAccount(
  householdId: string,
  data: AccountFormData
): Promise<Account> {
  const db = await getDb();

  const max = await db.getFirstAsync<{ sortOrder: number | null }>(
    "SELECT MAX(sortOrder) AS sortOrder FROM accounts WHERE householdId = ? AND deletedAt IS NULL",
    [householdId]
  );
  const sortOrder = (max?.sortOrder ?? -1) + 1;

  const id = generateId();
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO accounts
       (id, householdId, name, description, icon, color, status, sortOrder, createdAt, updatedAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      householdId,
      data.name,
      data.description ?? null,
      data.icon,
      data.color,
      data.status ?? AccountStatus.ACTIVE,
      sortOrder,
      now,
      now,
      SyncStatus.PENDING,
    ]
  );

  addToSyncQueue("create", "account", id, { ...data, householdId, sortOrder });

  const created = await getAccountWithBalance(id);
  return created!;
}

/**
 * Update an account.
 */
export async function updateAccount(
  id: string,
  data: Partial<AccountFormData>
): Promise<Account> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push("description = ?");
    values.push(data.description);
  }
  if (data.icon !== undefined) {
    fields.push("icon = ?");
    values.push(data.icon);
  }
  if (data.color !== undefined) {
    fields.push("color = ?");
    values.push(data.color);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }

  fields.push("updatedAt = ?", "syncStatus = ?");
  values.push(nowIso(), SyncStatus.PENDING, id);

  await db.runAsync(`UPDATE accounts SET ${fields.join(", ")} WHERE id = ?`, values);
  addToSyncQueue("update", "account", id, data);

  const updated = await getAccountWithBalance(id);
  return updated!;
}

/**
 * Archive an account (soft delete).
 * Rule 4: Accounts with history are archived, not deleted
 */
export async function archiveAccount(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE accounts SET status = ?, updatedAt = ?, syncStatus = ? WHERE id = ?",
    [AccountStatus.ARCHIVED, nowIso(), SyncStatus.PENDING, id]
  );
  addToSyncQueue("update", "account", id, { status: AccountStatus.ARCHIVED });
}

/**
 * Restore an archived account.
 */
export async function restoreAccount(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE accounts SET status = ?, updatedAt = ?, syncStatus = ? WHERE id = ?",
    [AccountStatus.ACTIVE, nowIso(), SyncStatus.PENDING, id]
  );
  addToSyncQueue("update", "account", id, { status: AccountStatus.ACTIVE });
}

/**
 * Reorder accounts.
 */
export async function reorderAccounts(accountIds: string[]): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.withTransactionAsync(async () => {
    for (let index = 0; index < accountIds.length; index++) {
      await db.runAsync(
        "UPDATE accounts SET sortOrder = ?, updatedAt = ?, syncStatus = ? WHERE id = ?",
        [index, now, SyncStatus.PENDING, accountIds[index]]
      );
    }
  });
}
