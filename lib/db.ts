// NestKeep — On-device database (expo-sqlite)
//
// Prisma Client cannot run inside React Native, so all local persistence lives
// here. Tables mirror prisma/schema.prisma with SQLite-compatible types:
//   - enums          -> TEXT
//   - BigInt (money) -> INTEGER (tambala; Rule 6)
//   - String[]       -> TEXT (JSON-encoded)
//   - DateTime       -> TEXT (ISO-8601)
//   - Boolean        -> INTEGER (0/1)
// The service layer maps rows to the domain models in types/prisma.ts.

import * as SQLite from "expo-sqlite";
import { generateId } from "./utils";
import {
  Account,
  AccountStatus,
  AuditLog,
  Household,
  HouseholdMember,
  MemberRole,
  SavingsGoal,
  Settings,
  SyncStatus,
  ThemePreference,
  Transaction,
  TransactionType,
  Transfer,
} from "@/types/prisma";

const DB_NAME = "nestkeep.db";
export const DEFAULT_HOUSEHOLD_ID = "default-household";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let bootstrapPromise: Promise<void> | null = null;

/** Open (once) and return the shared database connection. */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await dbInstance.execAsync(
      "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;"
    );
  }
  return dbInstance;
}

// ─────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS households (
  id          TEXT PRIMARY KEY NOT NULL,
  name        TEXT NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'MWK',
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL,
  deletedAt   TEXT,
  syncStatus  TEXT NOT NULL DEFAULT 'PENDING',
  syncedAt    TEXT
);

CREATE TABLE IF NOT EXISTS household_members (
  id          TEXT PRIMARY KEY NOT NULL,
  householdId TEXT NOT NULL,
  userId      TEXT,
  name        TEXT NOT NULL,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'MEMBER',
  joinedAt    TEXT NOT NULL,
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL,
  deletedAt   TEXT,
  syncStatus  TEXT NOT NULL DEFAULT 'PENDING',
  syncedAt    TEXT
);
CREATE INDEX IF NOT EXISTS idx_members_household ON household_members(householdId);

CREATE TABLE IF NOT EXISTS accounts (
  id          TEXT PRIMARY KEY NOT NULL,
  householdId TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT NOT NULL DEFAULT 'wallet',
  color       TEXT NOT NULL DEFAULT '#4F46E5',
  status      TEXT NOT NULL DEFAULT 'ACTIVE',
  sortOrder   INTEGER NOT NULL DEFAULT 0,
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL,
  deletedAt   TEXT,
  syncStatus  TEXT NOT NULL DEFAULT 'PENDING',
  syncedAt    TEXT
);
CREATE INDEX IF NOT EXISTS idx_accounts_household ON accounts(householdId);
CREATE INDEX IF NOT EXISTS idx_accounts_household_status ON accounts(householdId, status);

CREATE TABLE IF NOT EXISTS transactions (
  id           TEXT PRIMARY KEY NOT NULL,
  accountId    TEXT NOT NULL,
  type         TEXT NOT NULL,
  amount       INTEGER NOT NULL,
  note         TEXT,
  tags         TEXT NOT NULL DEFAULT '[]',
  transactedAt TEXT NOT NULL,
  isReversed   INTEGER NOT NULL DEFAULT 0,
  reversesId   TEXT,
  createdAt    TEXT NOT NULL,
  updatedAt    TEXT NOT NULL,
  deletedAt    TEXT,
  syncStatus   TEXT NOT NULL DEFAULT 'PENDING',
  syncedAt     TEXT
);
CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(accountId);
CREATE INDEX IF NOT EXISTS idx_tx_account_date ON transactions(accountId, transactedAt);
CREATE INDEX IF NOT EXISTS idx_tx_account_type ON transactions(accountId, type);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(transactedAt);
CREATE INDEX IF NOT EXISTS idx_tx_sync ON transactions(syncStatus);

CREATE TABLE IF NOT EXISTS transfers (
  id                TEXT PRIMARY KEY NOT NULL,
  fromTransactionId TEXT NOT NULL UNIQUE,
  toTransactionId   TEXT NOT NULL UNIQUE,
  note              TEXT,
  createdAt         TEXT NOT NULL,
  updatedAt         TEXT NOT NULL,
  syncStatus        TEXT NOT NULL DEFAULT 'PENDING',
  syncedAt          TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id                   TEXT PRIMARY KEY NOT NULL,
  householdId          TEXT NOT NULL UNIQUE,
  currency             TEXT NOT NULL DEFAULT 'MWK',
  currencySymbol       TEXT NOT NULL DEFAULT 'MK',
  dateFormat           TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  theme                TEXT NOT NULL DEFAULT 'SYSTEM',
  language             TEXT NOT NULL DEFAULT 'en',
  pinEnabled           INTEGER NOT NULL DEFAULT 0,
  biometricsEnabled    INTEGER NOT NULL DEFAULT 0,
  notificationsEnabled INTEGER NOT NULL DEFAULT 1,
  autoLockMinutes      INTEGER NOT NULL DEFAULT 5,
  createdAt            TEXT NOT NULL,
  updatedAt            TEXT NOT NULL,
  syncStatus           TEXT NOT NULL DEFAULT 'PENDING',
  syncedAt             TEXT
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id           TEXT PRIMARY KEY NOT NULL,
  householdId  TEXT NOT NULL,
  accountId    TEXT,
  name         TEXT NOT NULL,
  targetAmount INTEGER NOT NULL,
  deadline     TEXT,
  note         TEXT,
  isCompleted  INTEGER NOT NULL DEFAULT 0,
  completedAt  TEXT,
  createdAt    TEXT NOT NULL,
  updatedAt    TEXT NOT NULL,
  deletedAt    TEXT,
  syncStatus   TEXT NOT NULL DEFAULT 'PENDING',
  syncedAt     TEXT
);
CREATE INDEX IF NOT EXISTS idx_goals_household ON savings_goals(householdId);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY NOT NULL,
  householdId TEXT NOT NULL,
  userId      TEXT,
  entityType  TEXT NOT NULL,
  entityId    TEXT NOT NULL,
  action      TEXT NOT NULL,
  oldValue    TEXT,
  newValue    TEXT,
  createdAt   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_household ON audit_logs(householdId);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(createdAt);
`;

// Rule 14: Default accounts for a new household.
const DEFAULT_ACCOUNTS = [
  { name: "Joint", icon: "people", color: "#0A63E0", sortOrder: 0 },
  { name: "Rent", icon: "home", color: "#479CFC", sortOrder: 1 },
  { name: "Business", icon: "briefcase", color: "#084FC0", sortOrder: 2 },
  { name: "Personal", icon: "person", color: "#22C55E", sortOrder: 3 },
  { name: "Mom", icon: "heart", color: "#F59E0B", sortOrder: 4 },
  { name: "Groceries", icon: "cart", color: "#EF4444", sortOrder: 5 },
  { name: "Change", icon: "cash", color: "#7C3AED", sortOrder: 6 },
];

/**
 * Create tables (idempotent) and seed the default household + accounts on first
 * launch. Safe to call multiple times; work runs at most once per app session.
 */
export function bootstrapDatabase(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const db = await getDb();
      await db.execAsync(SCHEMA_SQL);
      await seedDefaultHousehold(db);
    })().catch((err) => {
      // Reset so a later call can retry after a transient failure.
      bootstrapPromise = null;
      throw err;
    });
  }
  return bootstrapPromise;
}

async function seedDefaultHousehold(db: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM households WHERE deletedAt IS NULL LIMIT 1"
  );
  if (existing) return;

  const now = nowIso();

  await db.runAsync(
    `INSERT INTO households (id, name, currency, createdAt, updatedAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [DEFAULT_HOUSEHOLD_ID, "My Household", "MWK", now, now, SyncStatus.SYNCED]
  );

  await db.runAsync(
    `INSERT INTO settings (id, householdId, currency, currencySymbol, createdAt, updatedAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), DEFAULT_HOUSEHOLD_ID, "MWK", "MK", now, now, SyncStatus.SYNCED]
  );

  for (const account of DEFAULT_ACCOUNTS) {
    await db.runAsync(
      `INSERT INTO accounts (id, householdId, name, icon, color, status, sortOrder, createdAt, updatedAt, syncStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        DEFAULT_HOUSEHOLD_ID,
        account.name,
        account.icon,
        account.color,
        AccountStatus.ACTIVE,
        account.sortOrder,
        now,
        now,
        SyncStatus.SYNCED,
      ]
    );
  }
}

// ─────────────────────────────────────────────
// VALUE HELPERS
// ─────────────────────────────────────────────

export function nowIso(): string {
  return new Date().toISOString();
}

export function toIso(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  return date instanceof Date ? date.toISOString() : date;
}

function toDate(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

function toBool(value: number | null): boolean {
  return value === 1;
}

// ─────────────────────────────────────────────
// ROW MAPPERS (raw SQLite row -> domain model)
// ─────────────────────────────────────────────

export function mapHousehold(r: any): Household {
  return {
    id: r.id,
    name: r.name,
    currency: r.currency,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    deletedAt: toDate(r.deletedAt),
    syncStatus: r.syncStatus as SyncStatus,
    syncedAt: toDate(r.syncedAt),
  };
}

export function mapHouseholdMember(r: any): HouseholdMember {
  return {
    id: r.id,
    householdId: r.householdId,
    userId: r.userId,
    name: r.name,
    email: r.email,
    role: r.role as MemberRole,
    joinedAt: new Date(r.joinedAt),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    deletedAt: toDate(r.deletedAt),
    syncStatus: r.syncStatus as SyncStatus,
    syncedAt: toDate(r.syncedAt),
  };
}

export function mapAccount(r: any): Account {
  return {
    id: r.id,
    householdId: r.householdId,
    name: r.name,
    description: r.description,
    icon: r.icon,
    color: r.color,
    status: r.status as AccountStatus,
    sortOrder: r.sortOrder,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    deletedAt: toDate(r.deletedAt),
    syncStatus: r.syncStatus as SyncStatus,
    syncedAt: toDate(r.syncedAt),
  };
}

export function mapTransaction(r: any): Transaction {
  return {
    id: r.id,
    accountId: r.accountId,
    type: r.type as TransactionType,
    amount: BigInt(r.amount),
    note: r.note,
    tags: parseTags(r.tags),
    transactedAt: new Date(r.transactedAt),
    isReversed: toBool(r.isReversed),
    reversesId: r.reversesId,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    deletedAt: toDate(r.deletedAt),
    syncStatus: r.syncStatus as SyncStatus,
    syncedAt: toDate(r.syncedAt),
  };
}

export function mapTransfer(r: any): Transfer {
  return {
    id: r.id,
    fromTransactionId: r.fromTransactionId,
    toTransactionId: r.toTransactionId,
    note: r.note,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    syncStatus: r.syncStatus as SyncStatus,
    syncedAt: toDate(r.syncedAt),
  };
}

export function mapSettings(r: any): Settings {
  return {
    id: r.id,
    householdId: r.householdId,
    currency: r.currency,
    currencySymbol: r.currencySymbol,
    dateFormat: r.dateFormat,
    theme: r.theme as ThemePreference,
    language: r.language,
    pinEnabled: toBool(r.pinEnabled),
    biometricsEnabled: toBool(r.biometricsEnabled),
    notificationsEnabled: toBool(r.notificationsEnabled),
    autoLockMinutes: r.autoLockMinutes,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    syncStatus: r.syncStatus as SyncStatus,
    syncedAt: toDate(r.syncedAt),
  };
}

export function mapSavingsGoal(r: any): SavingsGoal {
  return {
    id: r.id,
    householdId: r.householdId,
    accountId: r.accountId,
    name: r.name,
    targetAmount: BigInt(r.targetAmount),
    deadline: toDate(r.deadline),
    note: r.note,
    isCompleted: toBool(r.isCompleted),
    completedAt: toDate(r.completedAt),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    deletedAt: toDate(r.deletedAt),
    syncStatus: r.syncStatus as SyncStatus,
    syncedAt: toDate(r.syncedAt),
  };
}

export function mapAuditLog(r: any): AuditLog {
  return {
    id: r.id,
    householdId: r.householdId,
    userId: r.userId,
    entityType: r.entityType,
    entityId: r.entityId,
    action: r.action,
    oldValue: r.oldValue,
    newValue: r.newValue,
    createdAt: new Date(r.createdAt),
  };
}

function parseTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
