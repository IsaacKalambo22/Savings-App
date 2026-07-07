// Shared data access for export services (CSV / Excel / PDF).
// Reads through the on-device services so exports stay consistent with the app.

import { ExportOptions } from "@/types/export";
import { TransactionWithAccount } from "@/types/transaction";
import { AccountWithBalance } from "@/types/account";
import { getTransactions } from "@/features/transactions/services/transaction.service";
import {
  ensureDefaultHousehold,
  getAccountsWithBalance,
} from "@/features/accounts/services/account.service";
import dayjs from "dayjs";

/** Transactions matching the export filters (account + date range). */
export async function getExportTransactions(
  options: ExportOptions
): Promise<TransactionWithAccount[]> {
  let transactions = await getTransactions(options.accountId);

  if (options.startDate) {
    const start = dayjs(options.startDate);
    transactions = transactions.filter((t) => !dayjs(t.transactedAt).isBefore(start));
  }
  if (options.endDate) {
    const end = dayjs(options.endDate);
    transactions = transactions.filter((t) => !dayjs(t.transactedAt).isAfter(end));
  }

  return transactions;
}

/** All non-archived accounts with computed balances. */
export async function getExportAccounts(): Promise<AccountWithBalance[]> {
  const householdId = await ensureDefaultHousehold();
  return getAccountsWithBalance(householdId);
}
