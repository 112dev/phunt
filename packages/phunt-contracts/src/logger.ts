export interface Logger {
  log(logLevel: LogLevel, message: string, ...meta: any[]): void;

  logInfo(message: string, ...meta: any[]): void;

  logError(message: string, ...meta: any[]): void;

  logWarning(message: string, ...meta: any[]): void;

  logDebug(message: string, ...meta: any[]): void;
}

export type LogLevelDebug = "debug";
export type LogLevelInfo = "info";
export type LogLevelWarning = "warning";
export type LogLevelError = "error";
export type LogLevel =
  | LogLevelDebug
  | LogLevelInfo
  | LogLevelWarning
  | LogLevelError;
