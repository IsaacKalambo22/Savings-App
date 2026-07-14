import { type ClassValue, clsx } from "clsx";
import * as Crypto from "expo-crypto";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function generateId(): string {
  // expo-crypto provides a synchronous, RN-safe UUID v4.
  // (globalThis.crypto.randomUUID / the `uuid` package are unreliable on Hermes.)
  return Crypto.randomUUID();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────
// HOUSEHOLD JOIN CODES
// A household's id encodes its share code: id = "hh-<CODE>". The code ⇄ id
// mapping is a pure function, so a member who types the code lands on exactly
// the same household id (and therefore the same synced data) with no server
// lookup required. Alphabet excludes visually ambiguous characters (0/O, 1/I/L).
// ─────────────────────────────────────────────

const HH_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const HH_ID_PREFIX = "hh-";

/** Generate a fresh 6-character household share code (e.g. "BND47Q"). */
export function generateHouseholdCode(length = 6): string {
  const bytes = Crypto.getRandomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += HH_CODE_ALPHABET[bytes[i] % HH_CODE_ALPHABET.length];
  }
  return out;
}

/** Canonicalise a user-typed code: uppercase, strip anything non-alphanumeric. */
export function normalizeHouseholdCode(input: string): string {
  return (input ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Deterministic household id for a given code. */
export function householdIdFromCode(code: string): string {
  return HH_ID_PREFIX + normalizeHouseholdCode(code);
}

/** Recover the share code from a household id (null for legacy ids). */
export function codeFromHouseholdId(id: string): string | null {
  return id.startsWith(HH_ID_PREFIX) ? id.slice(HH_ID_PREFIX.length) : null;
}

/** Human-friendly display of a code: "BND47Q" -> "BND-47Q". */
export function formatHouseholdCode(code: string | null | undefined): string {
  const c = normalizeHouseholdCode(code ?? "");
  if (!c) return "";
  return c.length > 3 ? `${c.slice(0, 3)}-${c.slice(3)}` : c;
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
