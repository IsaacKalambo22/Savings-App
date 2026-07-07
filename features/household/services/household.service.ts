import { Household, Settings, SyncStatus } from "@/types/prisma";
import {
  getDb,
  mapHousehold,
  mapSettings,
  nowIso,
} from "@/lib/db";

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

  const updated = await getHousehold(id);
  return updated!;
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
