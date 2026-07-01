import { TransactionType } from "./prisma";

export type SortOption = "newest" | "oldest" | "amount-high" | "amount-low";

export interface SearchFilters {
  searchQuery: string;
  accountId?: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
}

export interface SearchOptions {
  filters: SearchFilters;
  sortBy: SortOption;
}
