export const ROUTES = {
  TABS: {
    HOME:         "/(tabs)/",
    ACCOUNTS:     "/(tabs)/accounts",
    TRANSACTIONS: "/(tabs)/transactions",
    REPORTS:      "/(tabs)/reports",
    SETTINGS:     "/(tabs)/settings",
  },
  ACCOUNT: {
    DETAIL: (id: string) => `/account/${id}` as const,
  },
  TRANSACTION: {
    ADD:      "/transaction/add",
    EDIT:     "/transaction/edit",
    TRANSFER: "/transaction/transfer",
  },
  REPORTS: {
    MONTH: (month: string) => `/reports/${month}` as const,
  },
  MODAL: {
    ACCOUNT_PICKER: "/modal/account-picker",
    ICON_PICKER:    "/modal/icon-picker",
    COLOR_PICKER:   "/modal/color-picker",
  },
  ONBOARDING: "/onboarding",
} as const;
