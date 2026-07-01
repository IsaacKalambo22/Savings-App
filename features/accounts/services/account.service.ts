import { PrismaClient, Account, AccountStatus, TransactionType } from "@prisma/client";
import { AccountWithBalance, CreateAccountFormData } from "@/types/account";

const prisma = new PrismaClient();

/**
 * Calculate account balance from transaction history
 * Rule 1: Transactions are the source of truth
 * Rule 6: Money stored as BigInt (tambala)
 */
export async function calculateAccountBalance(accountId: string): Promise<bigint> {
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId,
      deletedAt: null,
      isReversed: false,
    },
  });

  const deposits = transactions
    .filter((t) => t.type === TransactionType.DEPOSIT)
    .reduce((sum, t) => sum + t.amount, BigInt(0));

  const withdrawals = transactions
    .filter((t) => t.type === TransactionType.WITHDRAWAL)
    .reduce((sum, t) => sum + t.amount, BigInt(0));

  return deposits - withdrawals;
}

/**
 * Get all accounts with calculated balances
 */
export async function getAccountsWithBalance(householdId: string): Promise<AccountWithBalance[]> {
  const accounts = await prisma.account.findMany({
    where: {
      householdId,
      deletedAt: null,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const accountsWithBalance = await Promise.all(
    accounts.map(async (account) => {
      const balance = await calculateAccountBalance(account.id);
      const transactionCount = await prisma.transaction.count({
        where: {
          accountId: account.id,
          deletedAt: null,
        },
      });

      return {
        ...account,
        balance,
        transactionCount,
      };
    })
  );

  return accountsWithBalance;
}

/**
 * Get a single account with balance
 */
export async function getAccountWithBalance(id: string): Promise<AccountWithBalance | null> {
  const account = await prisma.account.findUnique({
    where: { id, deletedAt: null },
  });

  if (!account) return null;

  const balance = await calculateAccountBalance(account.id);
  const transactionCount = await prisma.transaction.count({
    where: {
      accountId: account.id,
      deletedAt: null,
    },
  });

  return {
    ...account,
    balance,
    transactionCount,
  };
}

/**
 * Create a new account
 */
export async function createAccount(
  householdId: string,
  data: CreateAccountFormData
): Promise<Account> {
  const maxSortOrder = await prisma.account.findFirst({
    where: { householdId, deletedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const sortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;

  return prisma.account.create({
    data: {
      ...data,
      householdId,
      sortOrder,
    },
  });
}

/**
 * Update an account
 */
export async function updateAccount(
  id: string,
  data: Partial<CreateAccountFormData>
): Promise<Account> {
  return prisma.account.update({
    where: { id },
    data,
  });
}

/**
 * Archive an account (soft delete)
 * Rule 4: Accounts with history are archived, not deleted
 */
export async function archiveAccount(id: string): Promise<Account> {
  return prisma.account.update({
    where: { id },
    data: {
      status: AccountStatus.ARCHIVED,
      deletedAt: new Date(),
    },
  });
}

/**
 * Restore an archived account
 */
export async function restoreAccount(id: string): Promise<Account> {
  return prisma.account.update({
    where: { id },
    data: {
      status: AccountStatus.ACTIVE,
      deletedAt: null,
    },
  });
}

/**
 * Reorder accounts
 */
export async function reorderAccounts(accountIds: string[]): Promise<void> {
  await prisma.$transaction(
    accountIds.map((id, index) =>
      prisma.account.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
}
