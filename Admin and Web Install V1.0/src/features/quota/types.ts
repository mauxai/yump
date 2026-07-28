export interface QuotaStatus {
  creditsUsed:      number;
  creditsTotal:     number;
  creditsRemaining: number;
  pct:              number;
  isLow:            boolean;
  isCritical:       boolean;
  isDepleted:       boolean;
}

export function computeQuotaStatus(
  creditsUsed: number,
  creditsTotal: number,
): QuotaStatus {
  const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);
  const pct              = creditsTotal > 0 ? Math.min(100, Math.round((creditsUsed / creditsTotal) * 100)) : 100;
  return {
    creditsUsed,
    creditsTotal,
    creditsRemaining,
    pct,
    isLow:      pct >= 70,
    isCritical: pct >= 90,
    isDepleted: creditsRemaining === 0,
  };
}
