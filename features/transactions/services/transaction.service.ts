import { PrismaClient, Transaction, TransactionType } from "@/types/prisma";
import { TransactionWithAccount, TransactionFormData, TransferFormData } from "@/types/transaction";

const prisma = new PrismaClient();

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
 * Get transactions with account info
 */
export async function getTransactions(accountId?: string): Promise<TransactionWithAccount[]> {
  return prisma.transaction.findMany({
    where: {
      accountId,
      deletedAt: null,
    },
    include: {
      account: true,
    },
    orderBy: { transactedAt: "desc" },
  });
}

/**
 * Get a single transaction with account
 */
export async function getTransaction(id: string): Promise<TransactionWithAccount | null> {
  return prisma.transaction.findUnique({
    where: { id, deletedAt: null },
    include: { account: true },
  });
}

/**
 * Create a new transaction
 * Rule 3: Every transaction requires account, type, amount, date
 * Rule 6: Amount stored as BigInt
 */
export async function createTransaction(data: TransactionFormData): Promise<Transaction> {
  return prisma.transaction.create({
    data: {
      accountId: data.accountId,
      type: data.type,
      amount: toBigInt(data.amount),
      note: data.note,
      tags: data.tags,
      transactedAt: data.transactedAt,
    },
    include: { account: true },
  });
}

/**
 * Update a transaction
 * Rule 13: Immutable once synced - only allow updates before sync
 */
export async function updateTransaction(
  id: string,
  data: Partial<TransactionFormData>
): Promise<Transaction> {
  const updateData: any = {
    ...data,
  };

  if (data.amount !== undefined) {
    updateData.amount = toBigInt(data.amount);
  }

  return prisma.transaction.update({
    where: { id },
    data: updateData,
    include: { account: true },
  });
}

/**
 * Reverse a transaction
 * Rule 2: Never delete - reverse instead
 * Rule 13: Corrections via reversal
 */
export async function reverseTransaction(
  id: string,
  note?: string
): Promise<Transaction> {
  const original = await prisma.transaction.findUniqueOrThrow({
    where: { id },
  });

  // Create reversal transaction
  const reversalType =
    original.type === TransactionType.DEPOSIT
      ? TransactionType.WITHDRAWAL
      : TransactionType.DEPOSIT;

  const reversal = await prisma.transaction.create({
    data: {
      accountId: original.accountId,
      type: reversalType,
      amount: original.amount,
      note: note || `Reversal of transaction`,
      tags: original.tags,
      transactedAt: new Date(),
      reversesId: original.id,
    },
  });

  // Mark original as reversed
  await prisma.transaction.update({
    where: { id },
    data: { isReversed: true },
  });

  return reversal;
}

/**
 * Create a transfer between accounts
 * Rule 9: Transfers do not change total savings
 * Creates two linked transactions
 */
export async function createTransfer(data: TransferFormData): Promise<{
  fromTransaction: Transaction;
  toTransaction: Transaction;
  transfer: any;
}> {
  const amount = toBigInt(data.amount);

  const [fromTransaction, toTransaction] = await prisma.$transaction([
    // Withdrawal from source account
    prisma.transaction.create({
      data: {
        accountId: data.fromAccountId,
        type: TransactionType.WITHDRAWAL,
        amount,
        note: data.note ? `Transfer: ${data.note}` : "Transfer",
        transactedAt: data.transactedAt,
      },
    }),
    // Deposit to destination account
    prisma.transaction.create({
      data: {
        accountId: data.toAccountId,
        type: TransactionType.DEPOSIT,
        amount,
        note: data.note ? `Transfer: ${data.note}` : "Transfer",
        transactedAt: data.transactedAt,
      },
    }),
  ]);

  // Create transfer record linking both transactions
  const transfer = await prisma.transfer.create({
    data: {
      fromTransactionId: fromTransaction.id,
      toTransactionId: toTransaction.id,
      note: data.note,
    },
  });

  return { fromTransaction, toTransaction, transfer };
}

/**
 * Soft delete a transaction
 * Rule 2: Never permanently delete
 */
export async function deleteTransaction(id: string): Promise<Transaction> {
  return prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Get transaction statistics for an account
 */
export async function getTransactionStats(accountId: string) {
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId,
      deletedAt: null,
      isReversed: false,
    },
  });

  const deposits = transactions
    .filter((t: any) => t.type === TransactionType.DEPOSIT)
    .reduce((sum: bigint, t: any) => sum + t.amount, BigInt(0));

  const withdrawals = transactions
    .filter((t: any) => t.type === TransactionType.WITHDRAWAL)
    .reduce((sum: bigint, t: any) => sum + t.amount, BigInt(0));

  const transfersOut = transactions
    .filter((t: any) => t.type === TransactionType.WITHDRAWAL)
    .reduce((sum: bigint, t: any) => sum + t.amount, BigInt(0));

  return {
    totalTransactions: transactions.length,
    totalDeposits: fromBigInt(deposits),
    totalWithdrawals: fromBigInt(withdrawals),
    balance: fromBigInt(BigInt(deposits) - BigInt(withdrawals)),
  };
}
