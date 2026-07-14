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
import { initializeNetworkMonitoring, isOnline } from "@/features/sync/services/network.service";
import { pullAll, pushHousehold, pushSettings } from "@/features/sync/services/supabase-sync";
import { initializeAppSync } from "@/features/sync/store/sync.store";

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

  // Start network monitoring so sync reacts to connectivity changes.
  initializeNetworkMonitoring();

  // Best-effort pull of remote data before first render (no-op if offline or
  // Supabase isn't configured — the app is fully usable either way).
  if (isOnline()) {
    // Push the active household + settings so members can always join it by
    // code, even if the user never renamed it. Idempotent upsert.
    try {
      await pushHousehold(householdId);
      await pushSettings(householdId);
    } catch (err) {
      console.warn("Household push failed (continuing):", err);
    }
    try {
      await pullAll();
    } catch (err) {
      console.warn("Initial pull failed (continuing offline):", err);
    }
  }

  await Promise.all([reloadAccounts(householdId), reloadTransactions()]);

  // Kick off background sync (drains the queue on interval + on reconnect).
  initializeAppSync();
}
