import { create } from "zustand";
import { Account, AccountStatus } from "@/types/prisma";
import { AccountWithBalance } from "@/types/account";

interface AccountState {
  accounts: AccountWithBalance[];
  activeAccounts: AccountWithBalance[];
  archivedAccounts: AccountWithBalance[];
  selectedAccountId: string | null;
  isLoading: boolean;
  
  setAccounts: (accounts: AccountWithBalance[]) => void;
  addAccount: (account: AccountWithBalance) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  archiveAccount: (id: string) => void;
  restoreAccount: (id: string) => void;
  setSelectedAccount: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  activeAccounts: [],
  archivedAccounts: [],
  selectedAccountId: null,
  isLoading: false,

  setAccounts: (accounts) => {
    const active = accounts.filter((a) => a.status === AccountStatus.ACTIVE);
    const archived = accounts.filter((a) => a.status === AccountStatus.ARCHIVED);
    set({ accounts, activeAccounts: active, archivedAccounts: archived });
  },

  addAccount: (account) => {
    set((state) => {
      const newAccounts = [...state.accounts, account];
      const active = newAccounts.filter((a) => a.status === AccountStatus.ACTIVE);
      return { accounts: newAccounts, activeAccounts: active };
    });
  },

  updateAccount: (id, updates) => {
    set((state) => {
      const newAccounts = state.accounts.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      const active = newAccounts.filter((a) => a.status === AccountStatus.ACTIVE);
      const archived = newAccounts.filter((a) => a.status === AccountStatus.ARCHIVED);
      return { accounts: newAccounts, activeAccounts: active, archivedAccounts: archived };
    });
  },

  archiveAccount: (id) => {
    set((state) => {
      const newAccounts = state.accounts.map((a) =>
        a.id === id ? { ...a, status: AccountStatus.ARCHIVED } : a
      );
      const active = newAccounts.filter((a) => a.status === AccountStatus.ACTIVE);
      const archived = newAccounts.filter((a) => a.status === AccountStatus.ARCHIVED);
      return { accounts: newAccounts, activeAccounts: active, archivedAccounts: archived };
    });
  },

  restoreAccount: (id) => {
    set((state) => {
      const newAccounts = state.accounts.map((a) =>
        a.id === id ? { ...a, status: AccountStatus.ACTIVE } : a
      );
      const active = newAccounts.filter((a) => a.status === AccountStatus.ACTIVE);
      const archived = newAccounts.filter((a) => a.status === AccountStatus.ARCHIVED);
      return { accounts: newAccounts, activeAccounts: active, archivedAccounts: archived };
    });
  },

  setSelectedAccount: (id) => set({ selectedAccountId: id }),
  setLoading: (isLoading) => set({ isLoading }),
}));
