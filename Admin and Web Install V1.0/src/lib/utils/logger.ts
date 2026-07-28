type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV !== "production";

function log(level: LogLevel, context: string, ...args: unknown[]) {
  if (level === "debug" && !isDev) return;
  const prefix = `[${level.toUpperCase()}][${context}]`;
  if (level === "error") {
    console.error(prefix, ...args);
  } else if (level === "warn") {
    console.warn(prefix, ...args);
  } else {
    console.log(prefix, ...args);
  }
}

export const logger = {
  debug: (ctx: string, ...args: unknown[]) => log("debug", ctx, ...args),
  info:  (ctx: string, ...args: unknown[]) => log("info",  ctx, ...args),
  warn:  (ctx: string, ...args: unknown[]) => log("warn",  ctx, ...args),
  error: (ctx: string, ...args: unknown[]) => log("error", ctx, ...args),
};
