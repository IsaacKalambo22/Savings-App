// App data initialization & store hydration.
// Called once on launch (see app/_layout.tsx) and reused by screens that need
// to refresh after a mutation.

import { bootstrapDatabase } from "@/lib/db";
import {
  ensureDefaultHousehold,
  getAccountsWithBalance,
} from "@/features/accounts/services/account.service";
import { getTransactions } from "@/features/transactions/services/transaction.service";
import { useAccountStore } from "@/features/accounts/store/account.store";
import { useTransactionStore } from "@/features/transactions/store/transaction.store";

/** Reload all accounts (with balances) into the account store. */
export async function reloadAccounts(householdId?: string): Promise<void> {
  const id = householdId ?? (await ensureDefaultHousehold());
  const accounts = await getAccountsWithBalance(id);
  useAccountStore.getState().setAccounts(accounts);
}

/** Reload all transactions into the transaction store. */
export async function reloadTransactions(): Promise<void> {
  const transactions = await getTransactions();
  useTransactionStore.getState().setTransactions(transactions);
}

/**
 * Initialize the database and hydrate the stores. Safe to call on every launch;
 * schema creation and seeding are idempotent.
 */
export async function initializeApp(): Promise<void> {
  await bootstrapDatabase();
  const householdId = await ensureDefaultHousehold();
  await Promise.all([reloadAccounts(householdId), reloadTransactions()]);
}
