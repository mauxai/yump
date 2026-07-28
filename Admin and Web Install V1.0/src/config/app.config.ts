export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "6amStudio",
  version: "1.0.0",
  description: "AI-powered image editing platform",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  credits: {
    freeOnSignup: 10,
    costPerEdit: 1,
    costPerGenerate: 2,
    costPerEnhance: 1,
  },

  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  upload: {
    maxFileSizeMb: 15,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },

  api: {
    maxKeysPerUser: 5,
    keyPrefix: "6ai_",
  },
} as const;
