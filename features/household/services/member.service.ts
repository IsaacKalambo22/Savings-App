import { AuditLog, HouseholdMember, MemberRole, SyncStatus } from "@/types/prisma";
import { getDb, mapAuditLog, mapHouseholdMember, nowIso } from "@/lib/db";
import { generateId } from "@/lib/utils";

/** List active members of a household (owner first, then by join date). */
export async function getMembers(householdId: string): Promise<HouseholdMember[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM household_members
     WHERE householdId = ? AND deletedAt IS NULL
     ORDER BY CASE role WHEN 'OWNER' THEN 0 WHEN 'ADMIN' THEN 1 WHEN 'MEMBER' THEN 2 ELSE 3 END, joinedAt ASC`,
    [householdId]
  );
  return rows.map(mapHouseholdMember);
}

/** Add a member and record an activity-log entry. */
export async function addMember(
  householdId: string,
  data: { name: string; email?: string; role: MemberRole }
): Promise<HouseholdMember> {
  const db = await getDb();
  const id = generateId();
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO household_members
       (id, householdId, name, email, role, joinedAt, createdAt, updatedAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, householdId, data.name, data.email ?? null, data.role, now, now, now, SyncStatus.PENDING]
  );

  await logActivity(householdId, "member", id, "added", null, { name: data.name, role: data.role });

  const row = await db.getFirstAsync<any>("SELECT * FROM household_members WHERE id = ?", [id]);
  return mapHouseholdMember(row);
}

/** Change a member's role. */
export async function updateMemberRole(
  householdId: string,
  id: string,
  role: MemberRole
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE household_members SET role = ?, updatedAt = ?, syncStatus = ? WHERE id = ?",
    [role, nowIso(), SyncStatus.PENDING, id]
  );
  await logActivity(householdId, "member", id, "role_changed", null, { role });
}

/** Soft-remove a member (Owner cannot be removed). */
export async function removeMember(householdId: string, id: string): Promise<void> {
  const db = await getDb();
  const member = await db.getFirstAsync<any>(
    "SELECT role, name FROM household_members WHERE id = ?",
    [id]
  );
  if (member?.role === MemberRole.OWNER) {
    throw new Error("The household owner cannot be removed.");
  }
  await db.runAsync(
    "UPDATE household_members SET deletedAt = ?, updatedAt = ?, syncStatus = ? WHERE id = ?",
    [nowIso(), nowIso(), SyncStatus.PENDING, id]
  );
  await logActivity(householdId, "member", id, "removed", { name: member?.name }, null);
}

/** Ensure an Owner member exists (created lazily the first time the screen opens). */
export async function ensureOwner(householdId: string, name = "You"): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM household_members WHERE householdId = ? AND role = 'OWNER' AND deletedAt IS NULL",
    [householdId]
  );
  if ((existing?.count ?? 0) > 0) return;
  await addMember(householdId, { name, role: MemberRole.OWNER });
}

// ─────────────────────────────────────────────
// ACTIVITY LOG (AuditLog)
// ─────────────────────────────────────────────

export async function logActivity(
  householdId: string,
  entityType: string,
  entityId: string,
  action: string,
  oldValue: Record<string, any> | null,
  newValue: Record<string, any> | null
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO audit_logs (id, householdId, entityType, entityId, action, oldValue, newValue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      householdId,
      entityType,
      entityId,
      action,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      nowIso(),
    ]
  );
}

export async function getActivityLog(householdId: string, limit = 30): Promise<AuditLog[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM audit_logs WHERE householdId = ? ORDER BY createdAt DESC LIMIT ?",
    [householdId, limit]
  );
  return rows.map(mapAuditLog);
}
