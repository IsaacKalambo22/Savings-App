import { TransactionWithAccount } from "@/types/transaction";
import { SearchFilters, SortOption } from "@/types/search";
import { fromBigInt } from "@/features/transactions/services/transaction.service";
import dayjs from "dayjs";

/**
 * Filter transactions based on search criteria
 */
export function filterTransactions(
  transactions: TransactionWithAccount[],
  filters: SearchFilters
): TransactionWithAccount[] {
  let filtered = [...transactions];

  // Search query (note, account name)
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter((t) =>
      t.note?.toLowerCase().includes(query) ||
      t.account.name.toLowerCase().includes(query) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Account filter
  if (filters.accountId) {
    filtered = filtered.filter((t) => t.accountId === filters.accountId);
  }

  // Type filter
  if (filters.type) {
    filtered = filtered.filter((t) => t.type === filters.type);
  }

  // Date range filter
  if (filters.startDate) {
    filtered = filtered.filter((t) => dayjs(t.transactedAt).isAfter(filters.startDate));
  }
  if (filters.endDate) {
    filtered = filtered.filter((t) => dayjs(t.transactedAt).isBefore(filters.endDate));
  }

  // Amount range filter
  if (filters.minAmount !== undefined) {
    filtered = filtered.filter((t) => fromBigInt(t.amount) >= filters.minAmount!);
  }
  if (filters.maxAmount !== undefined) {
    filtered = filtered.filter((t) => fromBigInt(t.amount) <= filters.maxAmount!);
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((t) =>
      filters.tags!.some((tag) => t.tags?.includes(tag))
    );
  }

  return filtered;
}

/**
 * Sort transactions based on sort option
 */
export function sortTransactions(
  transactions: TransactionWithAccount[],
  sortBy: SortOption
): TransactionWithAccount[] {
  const sorted = [...transactions];

  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => b.transactedAt.getTime() - a.transactedAt.getTime());
    case "oldest":
      return sorted.sort((a, b) => a.transactedAt.getTime() - b.transactedAt.getTime());
    case "amount-high":
      return sorted.sort((a, b) => Number(b.amount) - Number(a.amount));
    case "amount-low":
      return sorted.sort((a, b) => Number(a.amount) - Number(b.amount));
    default:
      return sorted;
  }
}

/**
 * Apply filters and sort
 */
export function searchTransactions(
  transactions: TransactionWithAccount[],
  filters: SearchFilters,
  sortBy: SortOption = "newest"
): TransactionWithAccount[] {
  const filtered = filterTransactions(transactions, filters);
  return sortTransactions(filtered, sortBy);
}

/**
 * Get unique tags from transactions
 */
export function getUniqueTags(transactions: TransactionWithAccount[]): string[] {
  const tags = new Set<string>();
  transactions.forEach((t) => {
    t.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Reset filters to default
 */
export function resetFilters(): SearchFilters {
  return {
    searchQuery: "",
    accountId: undefined,
    type: undefined,
    startDate: undefined,
    endDate: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    tags: undefined,
  };
}
