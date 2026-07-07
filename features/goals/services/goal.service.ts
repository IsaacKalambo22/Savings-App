import { SavingsGoal, SyncStatus } from "@/types/prisma";
import { getDb, mapSavingsGoal, nowIso, toIso } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { toBigInt } from "@/features/transactions/services/transaction.service";
import { calculateAccountBalance } from "@/features/accounts/services/account.service";

export type GoalWithProgress = SavingsGoal & {
  /** Current amount in tambala (from the linked account balance, if any). */
  currentAmount: bigint;
  /** 0–1 fraction of the target reached. */
  progress: number;
};

export type GoalFormData = {
  name: string;
  targetAmount: number; // in kwacha (UI); stored as tambala
  accountId?: string | null;
  deadline?: Date | null;
  note?: string;
};

async function withProgress(goal: SavingsGoal): Promise<GoalWithProgress> {
  let currentAmount = BigInt(0);
  if (goal.accountId) {
    currentAmount = await calculateAccountBalance(goal.accountId);
    if (currentAmount < BigInt(0)) currentAmount = BigInt(0);
  }
  const target = Number(goal.targetAmount);
  const progress = target > 0 ? Math.min(1, Number(currentAmount) / target) : 0;
  return { ...goal, currentAmount, progress };
}

export async function getGoals(householdId: string): Promise<GoalWithProgress[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM savings_goals
     WHERE householdId = ? AND deletedAt IS NULL
     ORDER BY isCompleted ASC, createdAt DESC`,
    [householdId]
  );
  return Promise.all(rows.map((r) => withProgress(mapSavingsGoal(r))));
}

export async function createGoal(
  householdId: string,
  data: GoalFormData
): Promise<SavingsGoal> {
  const db = await getDb();
  const id = generateId();
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO savings_goals
       (id, householdId, accountId, name, targetAmount, deadline, note, isCompleted, createdAt, updatedAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [
      id,
      householdId,
      data.accountId ?? null,
      data.name,
      Number(toBigInt(data.targetAmount)),
      toIso(data.deadline ?? null),
      data.note ?? null,
      now,
      now,
      SyncStatus.PENDING,
    ]
  );
  const row = await db.getFirstAsync<any>("SELECT * FROM savings_goals WHERE id = ?", [id]);
  return mapSavingsGoal(row);
}

export async function updateGoal(
  id: string,
  data: Partial<GoalFormData>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.targetAmount !== undefined) {
    fields.push("targetAmount = ?");
    values.push(Number(toBigInt(data.targetAmount)));
  }
  if (data.accountId !== undefined) {
    fields.push("accountId = ?");
    values.push(data.accountId);
  }
  if (data.deadline !== undefined) {
    fields.push("deadline = ?");
    values.push(toIso(data.deadline));
  }
  if (data.note !== undefined) {
    fields.push("note = ?");
    values.push(data.note);
  }
  fields.push("updatedAt = ?", "syncStatus = ?");
  values.push(nowIso(), SyncStatus.PENDING, id);
  await db.runAsync(`UPDATE savings_goals SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function setGoalCompleted(id: string, completed: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE savings_goals SET isCompleted = ?, completedAt = ?, updatedAt = ?, syncStatus = ? WHERE id = ?",
    [completed ? 1 : 0, completed ? nowIso() : null, nowIso(), SyncStatus.PENDING, id]
  );
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE savings_goals SET deletedAt = ?, updatedAt = ?, syncStatus = ? WHERE id = ?",
    [nowIso(), nowIso(), SyncStatus.PENDING, id]
  );
}
