// Remote sync against Supabase (Postgres).
//
// The device is offline-first: SQLite is the source of truth and every mutation
// is queued locally (sync-queue.service). This module pushes those queued rows
// to Supabase and can pull remote rows down. All calls are best-effort — if
// Supabase is unreachable or unconfigured, the queue simply retries later and
// the app keeps working entirely offline.

import { supabase } from "@/lib/supabase";
import { getDb } from "@/lib/db";

// Local SQLite table -> remote Supabase table (same names; Prisma @@map).
const TABLE_FOR_ENTITY: Record<string, string> = {
  transaction: "transactions",
  account: "accounts",
  transfer: "transfers",
  goal: "savings_goals",
};

/**
 * Remote sync is attempted only when Supabase env vars are present AND remote
 * sync is explicitly enabled. It stays OFF until the Supabase tables exist and
 * auth (Phase 11) is wired — otherwise every push/pull fails against missing
 * tables / RLS and just spams warnings. Enable by setting
 * EXPO_PUBLIC_ENABLE_REMOTE_SYNC=true in .env once the backend is ready.
 */
export function isSupabaseConfigured(): boolean {
  return (
    process.env.EXPO_PUBLIC_ENABLE_REMOTE_SYNC === "true" &&
    !!process.env.EXPO_PUBLIC_SUPABASE_URL &&
    !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Convert a raw SQLite row into the shape Supabase/Postgres expects. */
function toRemoteRow(table: string, row: any): Record<string, any> {
  const out: Record<string, any> = { ...row };

  // Booleans stored as 0/1 in SQLite.
  if ("isReversed" in out) out.isReversed = out.isReversed === 1;
  if ("isCompleted" in out) out.isCompleted = out.isCompleted === 1;
  if ("pinEnabled" in out) out.pinEnabled = out.pinEnabled === 1;
  if ("biometricsEnabled" in out) out.biometricsEnabled = out.biometricsEnabled === 1;
  if ("notificationsEnabled" in out) out.notificationsEnabled = out.notificationsEnabled === 1;

  // tags stored as a JSON string -> string[] for a Postgres text[] column.
  if (table === "transactions" && typeof out.tags === "string") {
    try {
      out.tags = JSON.parse(out.tags);
    } catch {
      out.tags = [];
    }
  }

  // Mark as synced remotely.
  out.syncStatus = "SYNCED";
  return out;
}

/** Convert a remote row into SQLite-storable values. */
function toLocalValues(table: string, row: any): Record<string, any> {
  const out: Record<string, any> = { ...row };
  if ("isReversed" in out) out.isReversed = out.isReversed ? 1 : 0;
  if ("isCompleted" in out) out.isCompleted = out.isCompleted ? 1 : 0;
  if ("pinEnabled" in out) out.pinEnabled = out.pinEnabled ? 1 : 0;
  if ("biometricsEnabled" in out) out.biometricsEnabled = out.biometricsEnabled ? 1 : 0;
  if ("notificationsEnabled" in out) out.notificationsEnabled = out.notificationsEnabled ? 1 : 0;
  if (table === "transactions" && Array.isArray(out.tags)) {
    out.tags = JSON.stringify(out.tags);
  }
  return out;
}

/**
 * Push a single queued entity to Supabase. Reads the current local row (source
 * of truth) and upserts it; a delete op is pushed as a soft-delete upsert so
 * history is preserved on the server too (Rule 2).
 * Throws on failure so the caller can retry via the queue.
 */
export async function pushEntity(
  entityType: "transaction" | "account" | "transfer" | "goal",
  entityId: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const table = TABLE_FOR_ENTITY[entityType];
  const db = await getDb();
  const localRow = await db.getFirstAsync<any>(
    `SELECT * FROM ${table} WHERE id = ?`,
    [entityId]
  );

  // Row was hard-removed locally — remove remotely too.
  if (!localRow) {
    const { error } = await supabase.from(table).delete().eq("id", entityId);
    if (error) throw new Error(error.message);
    return;
  }

  const remoteRow = toRemoteRow(table, localRow);
  const { error } = await supabase.from(table).upsert(remoteRow, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

type SyncedTable =
  | "accounts"
  | "transactions"
  | "transfers"
  | "households"
  | "settings"
  | "savings_goals";

/**
 * Write fetched remote rows into local SQLite. Conservative: inserts rows
 * missing locally and updates rows the server has newer, but never overwrites a
 * row with unsynced local changes (syncStatus = 'PENDING'). Returns how many
 * rows were actually applied.
 */
async function applyRemoteRows(table: SyncedTable, data: any[]): Promise<number> {
  const db = await getDb();
  let applied = 0;

  for (const remote of data) {
    const local = await db.getFirstAsync<any>(
      `SELECT id, updatedAt, syncStatus FROM ${table} WHERE id = ?`,
      [remote.id]
    );

    // Don't clobber local edits that haven't been pushed yet.
    if (local && local.syncStatus === "PENDING") continue;
    // Skip if local copy is same-or-newer.
    if (local && remote.updatedAt && local.updatedAt >= remote.updatedAt) continue;

    const values = toLocalValues(table, remote);
    const columns = Object.keys(values);
    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns.map((c) => `${c} = excluded.${c}`).join(", ");
    await db.runAsync(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})
       ON CONFLICT(id) DO UPDATE SET ${updates}`,
      columns.map((c) => values[c])
    );
    applied++;
  }

  return applied;
}

/**
 * Fetch rows for a table (optionally narrowed by `buildFilter`) and apply them
 * locally. Returns the applied count AND the fetched remote rows — callers chain
 * the rows to scope dependent tables (e.g. transactions by account id).
 */
async function fetchAndApply(
  table: SyncedTable,
  buildFilter?: (q: any) => any
): Promise<{ applied: number; rows: any[] }> {
  if (!isSupabaseConfigured()) return { applied: 0, rows: [] };
  let query: any = supabase.from(table).select("*");
  if (buildFilter) query = buildFilter(query);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return { applied: 0, rows: [] };
  const applied = await applyRemoteRows(table, data);
  return { applied, rows: data };
}

/**
 * Pull one household's data from Supabase into local SQLite. Scoped by
 * household so a device NEVER pulls another household's rows: accounts,
 * settings and goals filter on householdId directly; transactions and transfers
 * (which have no householdId column) are chained off this household's account
 * ids → transaction ids. Best-effort per table. Requires a householdId — with
 * none, it's a no-op (nothing to scope to).
 */
export async function pullAll(householdId: string): Promise<number> {
  if (!isSupabaseConfigured() || !householdId) return 0;

  const safe = async (
    label: string,
    fn: () => Promise<{ applied: number; rows: any[] }>
  ): Promise<{ applied: number; rows: any[] }> => {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Pull failed for ${label}:`, err);
      return { applied: 0, rows: [] };
    }
  };

  let total = 0;

  // Directly household-scoped tables.
  total += (await safe("households", () =>
    fetchAndApply("households", (q) => q.eq("id", householdId))
  )).applied;
  total += (await safe("settings", () =>
    fetchAndApply("settings", (q) => q.eq("householdId", householdId))
  )).applied;
  const accounts = await safe("accounts", () =>
    fetchAndApply("accounts", (q) => q.eq("householdId", householdId))
  );
  total += accounts.applied;
  total += (await safe("savings_goals", () =>
    fetchAndApply("savings_goals", (q) => q.eq("householdId", householdId))
  )).applied;

  // Transactions: scoped to this household's accounts.
  const accountIds = accounts.rows.map((r) => r.id);
  let transactions: { applied: number; rows: any[] } = { applied: 0, rows: [] };
  if (accountIds.length) {
    transactions = await safe("transactions", () =>
      fetchAndApply("transactions", (q) => q.in("accountId", accountIds))
    );
    total += transactions.applied;
  }

  // Transfers: scoped to this household's transactions.
  const transactionIds = transactions.rows.map((r) => r.id);
  if (transactionIds.length) {
    total += (await safe("transfers", () =>
      fetchAndApply("transfers", (q) => q.in("fromTransactionId", transactionIds))
    )).applied;
  }

  return total;
}

// Households and settings aren't queued like transactions/accounts, so they're
// pushed explicitly (on create / rename) — this is what makes a household
// discoverable by others via its share code.

/** Push a single household row to Supabase. Throws on failure so callers can surface it. */
export async function pushHousehold(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const db = await getDb();
  const row = await db.getFirstAsync<any>(`SELECT * FROM households WHERE id = ?`, [id]);
  if (!row) return;
  const { error } = await supabase
    .from("households")
    .upsert(toRemoteRow("households", row), { onConflict: "id" });
  if (error) throw new Error(error.message);
}

/** Push a household's settings row to Supabase. */
export async function pushSettings(householdId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM settings WHERE householdId = ?`,
    [householdId]
  );
  if (!row) return;
  const { error } = await supabase
    .from("settings")
    .upsert(toRemoteRow("settings", row), { onConflict: "id" });
  if (error) throw new Error(error.message);
}

/** Look up a household in Supabase by id (used when joining via a share code). */
export async function fetchRemoteHousehold(id: string): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from("households").select("*").eq("id", id).limit(1);
  if (error) throw new Error(error.message);
  return data && data.length ? data[0] : null;
}

// Tables watched for live updates from other household members.
const REALTIME_TABLES = [
  "accounts",
  "transactions",
  "transfers",
  "savings_goals",
  "households",
  "settings",
] as const;

/**
 * Subscribe to remote row changes (inserts/updates/deletes) across the synced
 * tables. Fires `onChange` whenever another device writes to Supabase, so the
 * local device can pull + refresh in near real time. Best-effort: a no-op if
 * Supabase/Realtime isn't configured. Returns an unsubscribe function.
 *
 * NOTE: for this to deliver events, Realtime must be enabled for these tables
 * in the Supabase dashboard (Database → Replication → add tables to the
 * `supabase_realtime` publication). If it isn't, the periodic pull in
 * sync.service still keeps devices converged — this just makes it instant.
 */
export function subscribeToRemoteChanges(onChange: () => void): () => void {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase.channel("nestkeep-sync");
  for (const table of REALTIME_TABLES) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => onChange()
    );
  }
  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
