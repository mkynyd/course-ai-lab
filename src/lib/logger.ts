const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

function getConfiguredLevel(): LogLevel {
  const env = process.env.LOG_LEVEL;
  if (env && (LOG_LEVELS as readonly string[]).includes(env)) {
    return env as LogLevel;
  }
  return process.env.NODE_ENV === "production" ? "warn" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  const configured = getConfiguredLevel();
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(configured);
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const base = { timestamp, level, message, ...meta };
  return JSON.stringify(base);
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", message, meta));
    }
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("info")) {
      console.info(formatMessage("info", message, meta));
    }
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", message, meta));
    }
  },
  error(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("error")) {
      console.error(formatMessage("error", message, meta));
    }
  },
};
