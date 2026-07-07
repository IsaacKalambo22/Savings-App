// Rule 6: Money is stored as integers (tambala).
// 1 MWK = 100 tambala.

export const DEFAULT_CURRENCY = "MWK";
export const DEFAULT_CURRENCY_SYMBOL = "MK";
export const SMALLEST_UNIT = 100; // tambala per kwacha

// Supported currencies (Rule 15: one default currency per household).
export const CURRENCIES = [
  { code: "MWK", symbol: "MK", name: "Malawian Kwacha" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
] as const;

export function toTambala(kwacha: number): number {
  return Math.round(kwacha * SMALLEST_UNIT);
}

export function toKwacha(tambala: number): number {
  return tambala / SMALLEST_UNIT;
}

export function formatCurrency(
  tambala: number | bigint,
  symbol: string = DEFAULT_CURRENCY_SYMBOL
): string {
  const amount = Number(tambala) / SMALLEST_UNIT;
  return `${symbol} ${amount.toLocaleString("en-MW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
