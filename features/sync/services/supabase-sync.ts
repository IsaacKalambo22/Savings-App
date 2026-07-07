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
  entityType: "transaction" | "account" | "transfer",
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

/**
 * Pull remote rows for a table into local SQLite. Conservative: inserts rows
 * missing locally and updates rows the server has newer, but never overwrites a
 * row with unsynced local changes (syncStatus = 'PENDING'). Best-effort.
 */
export async function pullTable(
  table: "accounts" | "transactions" | "transfers" | "households" | "settings"
): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return 0;

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

/** Pull all core tables from Supabase (initial device hydration). */
export async function pullAll(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  let total = 0;
  for (const table of ["households", "settings", "accounts", "transactions", "transfers"] as const) {
    try {
      total += await pullTable(table);
    } catch (err) {
      console.warn(`Pull failed for ${table}:`, err);
    }
  }
  return total;
}
