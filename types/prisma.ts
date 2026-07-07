// NestKeep — Domain models & enums
//
// These mirror prisma/schema.prisma but are plain TypeScript so they run
// on-device. Prisma Client cannot execute inside React Native, so the app
// persists data via expo-sqlite (see lib/db.ts). The Prisma schema is kept
// as the design source-of-truth and for the remote Supabase (Postgres) side.

export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER = "TRANSFER",
}

export enum AccountStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum MemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export enum SyncStatus {
  PENDING = "PENDING",
  SYNCED = "SYNCED",
  FAILED = "FAILED",
  CONFLICT = "CONFLICT",
}

export enum ThemePreference {
  LIGHT = "LIGHT",
  DARK = "DARK",
  SYSTEM = "SYSTEM",
}

export type Household = {
  id: string;
  name: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  syncStatus: SyncStatus;
  syncedAt: Date | null;
};

export type HouseholdMember = {
  id: string;
  householdId: string;
  userId: string | null;
  name: string;
  email: string | null;
  role: MemberRole;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  syncStatus: SyncStatus;
  syncedAt: Date | null;
};

export type Account = {
  id: string;
  householdId: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  status: AccountStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  syncStatus: SyncStatus;
  syncedAt: Date | null;
};

export type Transaction = {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: bigint;
  note: string | null;
  tags: string[];
  transactedAt: Date;
  isReversed: boolean;
  reversesId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  syncStatus: SyncStatus;
  syncedAt: Date | null;
};

export type Transfer = {
  id: string;
  fromTransactionId: string;
  toTransactionId: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
  syncedAt: Date | null;
};

export type Settings = {
  id: string;
  householdId: string;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  theme: ThemePreference;
  language: string;
  pinEnabled: boolean;
  biometricsEnabled: boolean;
  notificationsEnabled: boolean;
  autoLockMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
  syncedAt: Date | null;
};

export type SavingsGoal = {
  id: string;
  householdId: string;
  accountId: string | null;
  name: string;
  targetAmount: bigint;
  deadline: Date | null;
  note: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  syncStatus: SyncStatus;
  syncedAt: Date | null;
};

export type AuditLog = {
  id: string;
  householdId: string;
  userId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
};
