// App data initialization & store hydration.
// Called once on launch (see app/_layout.tsx) and reused by screens that need
// to refresh after a mutation.

import { bootstrapDatabase } from "@/lib/db";
import {
  ensureDefaultHousehold,
  getAccountsWithBalance,
} from "@/features/accounts/services/account.service";
import { getTransactions } from "@/features/transactions/services/transaction.service";
import { getGoals } from "@/features/goals/services/goal.service";
import { useAccountStore } from "@/features/accounts/store/account.store";
import { useTransactionStore } from "@/features/transactions/store/transaction.store";
import { useGoalStore } from "@/features/goals/store/goal.store";
import { initializeNetworkMonitoring, isOnline } from "@/features/sync/services/network.service";
import { pullAll, pushHousehold, pushSettings } from "@/features/sync/services/supabase-sync";
import { registerDataChangeHandler } from "@/features/sync/services/sync.service";
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

/** Reload all savings goals (with progress) into the goal store. */
export async function reloadGoals(householdId?: string): Promise<void> {
  const id = householdId ?? (await ensureDefaultHousehold());
  const goals = await getGoals(id);
  useGoalStore.getState().setGoals(goals);
}

/**
 * Refresh every store the UI renders from, in one call. Used after a sync pull
 * so remote changes from other household members appear live, without a restart.
 */
export async function reloadAll(householdId?: string): Promise<void> {
  const id = householdId ?? (await ensureDefaultHousehold());
  await Promise.all([reloadAccounts(id), reloadTransactions(), reloadGoals(id)]);
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

  await reloadAll(householdId);

  // When a sync pull applies remote changes, refresh the on-screen stores so
  // other members' edits appear live (no restart needed).
  registerDataChangeHandler(() => reloadAll());

  // Kick off background sync: pushes the queue AND pulls remote changes on an
  // interval, on reconnect, on foreground, and instantly via Supabase Realtime.
  initializeAppSync();
}
