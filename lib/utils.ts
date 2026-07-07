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

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
