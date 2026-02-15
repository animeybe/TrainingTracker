interface Logger {
  info(msg: string, meta?: Record<string, any>): void;
  error(msg: string, meta?: Record<string, any>): void;
  warn(msg: string, meta?: Record<string, any>): void;
  debug(msg: string, meta?: Record<string, any>): void;
}

export const logger: Logger = {
  info: (msg: string, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} ${msg}`, meta || "");
  },
  error: (msg: string, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} ${msg}`, meta || "");
  },
  warn: (msg: string, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} ${msg}`, meta || "");
  },
  debug: (msg: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString();
      console.log(`[DEBUG] ${timestamp} ${msg}`, meta || "");
    }
  },
};
