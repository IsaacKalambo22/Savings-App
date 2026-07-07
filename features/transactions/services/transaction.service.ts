import { Transaction, TransactionType, SyncStatus, Account } from "@/types/prisma";
import { TransactionWithAccount, TransactionFormData, TransferFormData } from "@/types/transaction";
import { getDb, mapTransaction, mapAccount, nowIso, toIso } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { addToSyncQueue } from "@/features/sync/services/sync-queue.service";

/**
 * Convert decimal amount to BigInt (tambala)
 * Rule 6: Money stored as BigInt
 */
export function toBigInt(amount: number): bigint {
  return BigInt(Math.round(amount * 100));
}

/**
 * Convert BigInt to decimal amount for display
 */
export function fromBigInt(amount: bigint): number {
  return Number(amount) / 100;
}

/**
 * Attach account objects to transaction rows (single extra query — no N+1).
 */
async function attachAccounts(transactions: Transaction[]): Promise<TransactionWithAccount[]> {
  if (transactions.length === 0) return [];
  const db = await getDb();
  const ids = Array.from(new Set(transactions.map((t) => t.accountId)));
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM accounts WHERE id IN (${placeholders})`,
    ids
  );
  const accountsById = new Map<string, Account>(rows.map((r) => [r.id, mapAccount(r)]));
  return transactions.map((t) => ({
    ...t,
    account: accountsById.get(t.accountId)!,
  }));
}

/**
 * Get transactions with account info.
 */
export async function getTransactions(accountId?: string): Promise<TransactionWithAccount[]> {
  const db = await getDb();
  const rows = accountId
    ? await db.getAllAsync<any>(
        "SELECT * FROM transactions WHERE accountId = ? AND deletedAt IS NULL ORDER BY transactedAt DESC",
        [accountId]
      )
    : await db.getAllAsync<any>(
        "SELECT * FROM transactions WHERE deletedAt IS NULL ORDER BY transactedAt DESC"
      );
  return attachAccounts(rows.map(mapTransaction));
}

/**
 * Get a single transaction with account.
 */
export async function getTransaction(id: string): Promise<TransactionWithAccount | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    "SELECT * FROM transactions WHERE id = ? AND deletedAt IS NULL",
    [id]
  );
  if (!row) return null;
  const [withAccount] = await attachAccounts([mapTransaction(row)]);
  return withAccount;
}

/**
 * Insert a transaction row. Shared by createTransaction/transfer/reversal.
 */
async function insertTransaction(fields: {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: bigint;
  note?: string | null;
  tags?: string[];
  transactedAt: Date;
  reversesId?: string | null;
}): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO transactions
       (id, accountId, type, amount, note, tags, transactedAt, isReversed, reversesId, createdAt, updatedAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    [
      fields.id,
      fields.accountId,
      fields.type,
      Number(fields.amount),
      fields.note ?? null,
      JSON.stringify(fields.tags ?? []),
      toIso(fields.transactedAt)!,
      fields.reversesId ?? null,
      now,
      now,
      SyncStatus.PENDING,
    ]
  );
}

/**
 * Create a new transaction.
 * Rule 3: Every transaction requires account, type, amount, date
 * Rule 6: Amount stored as BigInt
 */
export async function createTransaction(data: TransactionFormData): Promise<TransactionWithAccount> {
  const id = generateId();
  await insertTransaction({
    id,
    accountId: data.accountId,
    type: data.type,
    amount: toBigInt(data.amount),
    note: data.note,
    tags: data.tags,
    transactedAt: data.transactedAt,
  });

  addToSyncQueue("create", "transaction", id, data);

  const created = await getTransaction(id);
  return created!;
}

/**
 * Update a transaction.
 * Rule 13: Immutable once synced — corrections should use reversal instead.
 */
export async function updateTransaction(
  id: string,
  data: Partial<TransactionFormData>
): Promise<Transaction> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.amount !== undefined) {
    fields.push("amount = ?");
    values.push(Number(toBigInt(data.amount)));
  }
  if (data.note !== undefined) {
    fields.push("note = ?");
    values.push(data.note);
  }
  if (data.tags !== undefined) {
    fields.push("tags = ?");
    values.push(JSON.stringify(data.tags));
  }
  if (data.type !== undefined) {
    fields.push("type = ?");
    values.push(data.type);
  }
  if (data.transactedAt !== undefined) {
    fields.push("transactedAt = ?");
    values.push(toIso(data.transactedAt));
  }

  fields.push("updatedAt = ?", "syncStatus = ?");
  values.push(nowIso(), SyncStatus.PENDING, id);

  await db.runAsync(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`, values);
  addToSyncQueue("update", "transaction", id, data);

  const updated = await getTransaction(id);
  return updated!;
}

/**
 * Reverse a transaction.
 * Rule 2: Never delete — reverse instead
 * Rule 13: Corrections via reversal
 */
export async function reverseTransaction(id: string, note?: string): Promise<Transaction> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>("SELECT * FROM transactions WHERE id = ?", [id]);
  if (!row) throw new Error("Transaction not found");
  const original = mapTransaction(row);

  const reversalType =
    original.type === TransactionType.DEPOSIT
      ? TransactionType.WITHDRAWAL
      : TransactionType.DEPOSIT;

  const reversalId = generateId();

  await db.withTransactionAsync(async () => {
    await insertTransaction({
      id: reversalId,
      accountId: original.accountId,
      type: reversalType,
      amount: original.amount,
      note: note || "Reversal of transaction",
      tags: original.tags,
      transactedAt: new Date(),
      reversesId: original.id,
    });
    await db.runAsync(
      "UPDATE transactions SET isReversed = 1, updatedAt = ?, syncStatus = ? WHERE id = ?",
      [nowIso(), SyncStatus.PENDING, id]
    );
  });

  addToSyncQueue("update", "transaction", id, { isReversed: true });
  addToSyncQueue("create", "transaction", reversalId, {
    accountId: original.accountId,
    type: reversalType,
    amount: fromBigInt(original.amount),
    note: note || "Reversal of transaction",
    tags: original.tags,
    transactedAt: new Date(),
    reversesId: original.id,
  });

  const reversal = await getTransaction(reversalId);
  return reversal!;
}

/**
 * Create a transfer between accounts.
 * Rule 9: Transfers do not change total savings — creates two linked transactions.
 */
export async function createTransfer(data: TransferFormData): Promise<{
  fromTransaction: Transaction;
  toTransaction: Transaction;
  transferId: string;
}> {
  const db = await getDb();
  const amount = toBigInt(data.amount);
  const fromId = generateId();
  const toId = generateId();
  const transferId = generateId();
  const noteText = data.note ? `Transfer: ${data.note}` : "Transfer";
  const now = nowIso();

  await db.withTransactionAsync(async () => {
    await insertTransaction({
      id: fromId,
      accountId: data.fromAccountId,
      type: TransactionType.WITHDRAWAL,
      amount,
      note: noteText,
      transactedAt: data.transactedAt,
    });
    await insertTransaction({
      id: toId,
      accountId: data.toAccountId,
      type: TransactionType.DEPOSIT,
      amount,
      note: noteText,
      transactedAt: data.transactedAt,
    });
    await db.runAsync(
      `INSERT INTO transfers (id, fromTransactionId, toTransactionId, note, createdAt, updatedAt, syncStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [transferId, fromId, toId, data.note ?? null, now, now, SyncStatus.PENDING]
    );
  });

  addToSyncQueue("create", "transfer", transferId, data);
  addToSyncQueue("create", "transaction", fromId, {
    accountId: data.fromAccountId,
    type: TransactionType.WITHDRAWAL,
    amount: data.amount,
    note: noteText,
    transactedAt: data.transactedAt,
  });
  addToSyncQueue("create", "transaction", toId, {
    accountId: data.toAccountId,
    type: TransactionType.DEPOSIT,
    amount: data.amount,
    note: noteText,
    transactedAt: data.transactedAt,
  });

  const [fromTransaction, toTransaction] = await Promise.all([
    getTransaction(fromId),
    getTransaction(toId),
  ]);

  return { fromTransaction: fromTransaction!, toTransaction: toTransaction!, transferId };
}

/**
 * Soft delete a transaction.
 * Rule 2: Never permanently delete
 */
export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE transactions SET deletedAt = ?, updatedAt = ?, syncStatus = ? WHERE id = ?",
    [nowIso(), nowIso(), SyncStatus.PENDING, id]
  );
  addToSyncQueue("delete", "transaction", id, {});
}

/**
 * Get transaction statistics for an account.
 */
export async function getTransactionStats(accountId: string) {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    count: number;
    deposits: number | null;
    withdrawals: number | null;
  }>(
    `SELECT
       COUNT(*) AS count,
       COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) AS deposits,
       COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) AS withdrawals
     FROM transactions
     WHERE accountId = ? AND deletedAt IS NULL AND isReversed = 0`,
    [TransactionType.DEPOSIT, TransactionType.WITHDRAWAL, accountId]
  );

  const deposits = BigInt(row?.deposits ?? 0);
  const withdrawals = BigInt(row?.withdrawals ?? 0);

  return {
    totalTransactions: row?.count ?? 0,
    totalDeposits: fromBigInt(deposits),
    totalWithdrawals: fromBigInt(withdrawals),
    balance: fromBigInt(deposits - withdrawals),
  };
}
