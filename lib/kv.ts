// Synchronous key-value store backed by expo-sqlite.
//
// Drop-in replacement for the small synchronous MMKV API we used for the sync
// queue. react-native-mmkv v4 depends on Nitro native modules that aren't
// available in Expo Go and require a custom native build; SQLite ships with
// Expo and exposes a synchronous API, so it works everywhere.
//
// The connection is opened lazily on first use (not at import time) so a
// failure here can never break module evaluation of the screens that import it.

import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

function getKvDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("nestkeep-kv.db");
    db.execSync(
      "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);"
    );
  }
  return db;
}

export const kv = {
  getString(key: string): string | undefined {
    const row = getKvDb().getFirstSync<{ value: string }>(
      "SELECT value FROM kv WHERE key = ?",
      [key]
    );
    return row?.value ?? undefined;
  },
  set(key: string, value: string): void {
    getKvDb().runSync(
      "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, value]
    );
  },
  delete(key: string): void {
    getKvDb().runSync("DELETE FROM kv WHERE key = ?", [key]);
  },
};
