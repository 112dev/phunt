import { Logger, LogLevel } from "@112dev/phunt-contracts";
import winston from "winston";

export class WinstonBasedLogger implements Logger {
  private winstonLogLevelTransformer(logLevel: LogLevel): string {
    let winstonLogLevel: string;

    switch (logLevel) {
      case "debug":
        winstonLogLevel = "debug";
        break;
      case "info":
        winstonLogLevel = "info";
        break;
      case "error":
        winstonLogLevel = "error";
        break;
      case "warning":
        winstonLogLevel = "warn";
        break;
      default:
        throw new Error("Unsupported LogLevel provided!");
    }

    return winstonLogLevel;
  }

  public log(logLevel: LogLevel, message: string, ...meta: any[]): void {
    const winstonLogLevel = this.winstonLogLevelTransformer(logLevel);

    const logger = winston.createLogger({
      transports: [
        new winston.transports.Console({
          level: winstonLogLevel,
          format: winston.format.combine(
            winston.format.json(),
            winston.format.timestamp(),
            winston.format.prettyPrint(),
            winston.format.colorize(),
          ),
        }),
      ],
    });

    logger.log(winstonLogLevel, message, ...meta);
  }

  public logDebug(message: string, ...meta: any[]): void {
    this.log("debug", message, ...meta);
  }

  public logError(message: string, ...meta: any[]): void {
    this.log("error", message, ...meta);
  }

  public logInfo(message: string, ...meta: any[]): void {
    this.log("info", message, ...meta);
  }

  public logWarning(message: string, ...meta: any[]): void {
    this.log("warning", message, ...meta);
  }
}
