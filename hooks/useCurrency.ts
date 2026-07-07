import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { DEFAULT_CURRENCY_SYMBOL, formatCurrency } from "@/constants/currency";
import { ensureDefaultHousehold } from "@/features/accounts/services/account.service";
import { getSettings } from "@/features/household/services/household.service";

/**
 * Provides the household's currency symbol and a formatter that turns a stored
 * tambala amount (Rule 6) into a display string.
 */
export function useCurrency() {
  const [symbol, setSymbol] = useState(DEFAULT_CURRENCY_SYMBOL);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const id = await ensureDefaultHousehold();
          const settings = await getSettings(id);
          if (settings) setSymbol(settings.currencySymbol);
        } catch {
          // keep default
        }
      })();
    }, [])
  );

  const format = useCallback(
    (tambala: number | bigint) => formatCurrency(tambala, symbol),
    [symbol]
  );

  return { symbol, format };
}
