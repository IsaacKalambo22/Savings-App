import { create } from "zustand";
import { Transaction, TransactionType } from "@/types/prisma";
import { TransactionWithAccount } from "@/types/transaction";

interface TransactionState {
  transactions: TransactionWithAccount[];
  filteredTransactions: TransactionWithAccount[];
  selectedTransactionId: string | null;
  isLoading: boolean;
  filter: {
    accountId?: string;
    type?: TransactionType;
    search?: string;
  };

  setTransactions: (transactions: TransactionWithAccount[]) => void;
  addTransaction: (transaction: TransactionWithAccount) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  reverseTransaction: (id: string) => void;
  setSelectedTransaction: (id: string | null) => void;
  setFilter: (filter: Partial<TransactionState["filter"]>) => void;
  setLoading: (loading: boolean) => void;
  applyFilter: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  filteredTransactions: [],
  selectedTransactionId: null,
  isLoading: false,
  filter: {},

  setTransactions: (transactions) => {
    set({ transactions });
    get().applyFilter();
  },

  addTransaction: (transaction) => {
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    }));
    get().applyFilter();
  },

  updateTransaction: (id, updates) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
    get().applyFilter();
  },

  reverseTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, isReversed: true } : t
      ),
    }));
    get().applyFilter();
  },

  setSelectedTransaction: (id) => set({ selectedTransactionId: id }),

  setFilter: (newFilter) => {
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
    }));
    get().applyFilter();
  },

  setLoading: (isLoading) => set({ isLoading }),

  applyFilter: () => {
    const { transactions, filter } = get();
    let filtered = transactions;

    if (filter.accountId) {
      filtered = filtered.filter((t) => t.accountId === filter.accountId);
    }

    if (filter.type) {
      filtered = filtered.filter((t) => t.type === filter.type);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.note?.toLowerCase().includes(searchLower) ||
          t.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }

    set({ filteredTransactions: filtered });
  },
}));
