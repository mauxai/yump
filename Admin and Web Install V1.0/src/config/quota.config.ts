export const quotaConfig = {
  creditCosts: {
    generate: 2,
    edit:      1,
    enhance:   1,
  },

  limits: {
    maxProjectsPerUser:  100,
    maxEditsPerProject:  500,
    maxApiKeysPerUser:   5,
    maxImageSizeMb:      15,
    maxPromptLength:     2000,
  },

  warnings: {
    lowCreditThresholdPct: 20,
    criticalCreditThresholdPct: 5,
  },
} as const;

export type CreditOperationType = keyof typeof quotaConfig.creditCosts;
