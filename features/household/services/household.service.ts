import { Household, Settings, SyncStatus } from "@/types/prisma";
import {
  getDb,
  mapHousehold,
  mapSettings,
  nowIso,
} from "@/lib/db";
import {
  generateId,
  generateHouseholdCode,
  householdIdFromCode,
  normalizeHouseholdCode,
} from "@/lib/utils";
import {
  pushHousehold,
  pushSettings,
  fetchRemoteHousehold,
  pullAll,
} from "@/features/sync/services/supabase-sync";
import { useAppStore } from "@/store/app.store";

/** Get a household by id. */
export async function getHousehold(id: string): Promise<Household | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    "SELECT * FROM households WHERE id = ? AND deletedAt IS NULL",
    [id]
  );
  return row ? mapHousehold(row) : null;
}

/** Get the settings row for a household (created during seeding). */
export async function getSettings(householdId: string): Promise<Settings | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    "SELECT * FROM settings WHERE householdId = ?",
    [householdId]
  );
  return row ? mapSettings(row) : null;
}

/** Update household name and/or currency. Keeps settings.currency in sync. */
export async function updateHousehold(
  id: string,
  data: { name?: string; currency?: string }
): Promise<Household> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.currency !== undefined) {
    fields.push("currency = ?");
    values.push(data.currency);
  }
  fields.push("updatedAt = ?", "syncStatus = ?");
  values.push(nowIso(), SyncStatus.PENDING, id);

  await db.runAsync(`UPDATE households SET ${fields.join(", ")} WHERE id = ?`, values);

  if (data.currency !== undefined) {
    await db.runAsync(
      "UPDATE settings SET currency = ?, updatedAt = ?, syncStatus = ? WHERE householdId = ?",
      [data.currency, nowIso(), SyncStatus.PENDING, id]
    );
  }

  // Push the household (and settings, if currency changed) so it stays
  // joinable and members converge on the new name/currency. Best-effort.
  try {
    await pushHousehold(id);
    if (data.currency !== undefined) await pushSettings(id);
  } catch {
    /* offline — the row is marked PENDING and syncs later */
  }

  const updated = await getHousehold(id);
  return updated!;
}

export interface CreateHouseholdResult {
  household: Household;
  code: string;
}

/**
 * Create a brand-new household with a fresh share code, make it the active
 * household, and push it so others can join by code.
 */
export async function createHousehold(
  name: string,
  currency = "MWK"
): Promise<CreateHouseholdResult> {
  const db = await getDb();
  const code = generateHouseholdCode();
  const id = householdIdFromCode(code);
  const now = nowIso();

  await db.runAsync(
    `INSERT OR IGNORE INTO households (id, name, currency, createdAt, updatedAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name.trim() || "My Household", currency, now, now, SyncStatus.PENDING]
  );

  const hasSettings = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM settings WHERE householdId = ?",
    [id]
  );
  if (!hasSettings) {
    await db.runAsync(
      `INSERT INTO settings (id, householdId, currency, currencySymbol, createdAt, updatedAt, syncStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), id, currency, "MK", now, now, SyncStatus.PENDING]
    );
  }

  useAppStore.getState().setHouseholdId(id);

  try {
    await pushHousehold(id);
    await pushSettings(id);
  } catch {
    /* offline — pushes retry when back online */
  }

  const household = await getHousehold(id);
  return { household: household!, code };
}

/**
 * Join an existing household by its share code. Resolves the deterministic id,
 * verifies the household exists (remotely or already pulled locally), makes it
 * active, and pulls its data. Throws if the code doesn't match any household.
 */
export async function joinHouseholdByCode(rawCode: string): Promise<Household> {
  const code = normalizeHouseholdCode(rawCode);
  if (code.length < 4) {
    throw new Error("Enter a valid household code.");
  }
  const id = householdIdFromCode(code);
  const db = await getDb();

  let remote: any = null;
  try {
    remote = await fetchRemoteHousehold(id);
  } catch {
    /* offline / unconfigured — fall back to a locally-known household */
  }
  const local = await db.getFirstAsync<any>(
    "SELECT * FROM households WHERE id = ?",
    [id]
  );

  if (!remote && !local) {
    throw new Error(
      "No household found with that code. Check the code and your connection."
    );
  }

  const now = nowIso();
  if (remote) {
    await db.runAsync(
      `INSERT INTO households (id, name, currency, createdAt, updatedAt, deletedAt, syncStatus, syncedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, currency = excluded.currency,
         updatedAt = excluded.updatedAt, syncStatus = 'SYNCED'`,
      [
        id,
        remote.name ?? "Household",
        remote.currency ?? "MWK",
        remote.createdAt ?? now,
        remote.updatedAt ?? now,
        remote.deletedAt ?? null,
        SyncStatus.SYNCED,
        now,
      ]
    );
    const hasSettings = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM settings WHERE householdId = ?",
      [id]
    );
    if (!hasSettings) {
      await db.runAsync(
        `INSERT INTO settings (id, householdId, currency, currencySymbol, createdAt, updatedAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateId(), id, remote.currency ?? "MWK", "MK", now, now, SyncStatus.SYNCED]
      );
    }
  }

  useAppStore.getState().setHouseholdId(id);

  // Pull the household's accounts/transactions into local storage.
  try {
    await pullAll(id);
  } catch {
    /* best-effort — queued/pending data still resolves on the next sync */
  }

  const household = await getHousehold(id);
  return household!;
}

/** Update settings fields for a household. */
export async function updateSettings(
  householdId: string,
  data: Partial<Pick<Settings, "currency" | "currencySymbol" | "dateFormat" | "notificationsEnabled">>
): Promise<Settings> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.currency !== undefined) {
    fields.push("currency = ?");
    values.push(data.currency);
  }
  if (data.currencySymbol !== undefined) {
    fields.push("currencySymbol = ?");
    values.push(data.currencySymbol);
  }
  if (data.dateFormat !== undefined) {
    fields.push("dateFormat = ?");
    values.push(data.dateFormat);
  }
  if (data.notificationsEnabled !== undefined) {
    fields.push("notificationsEnabled = ?");
    values.push(data.notificationsEnabled ? 1 : 0);
  }
  fields.push("updatedAt = ?", "syncStatus = ?");
  values.push(nowIso(), SyncStatus.PENDING, householdId);

  await db.runAsync(
    `UPDATE settings SET ${fields.join(", ")} WHERE householdId = ?`,
    values
  );

  const updated = await getSettings(householdId);
  return updated!;
}
