import { CURRENCIES } from "./locale-options";
import { getSetting } from "./settings";

export type CurrencyInfo = { code: string; symbol: string; label: string };

const DEFAULT: CurrencyInfo = { code: "USD", symbol: "$", label: "US Dollar" };

export function getCurrencyInfo(code: string): CurrencyInfo {
  const match = CURRENCIES.find((c) => c.code === code);
  return match ? { code: match.code, symbol: match.symbol, label: match.label } : DEFAULT;
}

export async function getSystemCurrency(): Promise<CurrencyInfo> {
  const code = await getSetting("general.currency", "USD");
  return getCurrencyInfo(code);
}

export function formatPrice(amount: number, currency: CurrencyInfo): string {
  return `${currency.symbol}${amount.toFixed(2)}`;
}
