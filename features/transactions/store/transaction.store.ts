import { create } from "zustand";
import { Transaction, TransactionType } from "@/types/prisma";
import { TransactionWithAccount } from "@/types/transaction";
import { SearchFilters, SortOption } from "@/types/search";
import { searchTransactions, resetFilters } from "@/features/search/services/search.service";

interface TransactionState {
  transactions: TransactionWithAccount[];
  filteredTransactions: TransactionWithAccount[];
  selectedTransactionId: string | null;
  isLoading: boolean;
  searchFilters: SearchFilters;
  sortBy: SortOption;

  setTransactions: (transactions: TransactionWithAccount[]) => void;
  addTransaction: (transaction: TransactionWithAccount) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  reverseTransaction: (id: string) => void;
  setSelectedTransaction: (id: string | null) => void;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  setSortBy: (sortBy: SortOption) => void;
  resetSearchFilters: () => void;
  setLoading: (loading: boolean) => void;
  applySearch: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  filteredTransactions: [],
  selectedTransactionId: null,
  isLoading: false,
  searchFilters: resetFilters(),
  sortBy: "newest",

  setTransactions: (transactions) => {
    set({ transactions });
    get().applySearch();
  },

  addTransaction: (transaction) => {
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    }));
    get().applySearch();
  },

  updateTransaction: (id, updates) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
    get().applySearch();
  },

  reverseTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, isReversed: true } : t
      ),
    }));
    get().applySearch();
  },

  setSelectedTransaction: (id) => set({ selectedTransactionId: id }),

  setSearchFilters: (newFilters) => {
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...newFilters },
    }));
    get().applySearch();
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    get().applySearch();
  },

  resetSearchFilters: () => {
    set({ searchFilters: resetFilters(), sortBy: "newest" });
    get().applySearch();
  },

  setLoading: (isLoading) => set({ isLoading }),

  applySearch: () => {
    const { transactions, searchFilters, sortBy } = get();
    const filtered = searchTransactions(transactions, searchFilters, sortBy);
    set({ filteredTransactions: filtered });
  },
}));
