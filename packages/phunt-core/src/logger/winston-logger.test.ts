import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { LogLevel } from "@112dev/phunt-contracts";
import { WinstonBasedLogger } from "./winston-logger";

describe("WinstonBasedLogger", () => {
  const logger = new WinstonBasedLogger();

  const testData = [{ key: "value" }];
  const testMessage = "test";

  let logSpy: jest.SpiedFunction<
    (logLevel: LogLevel, message: string, ...meta: any[]) => void
  >;

  beforeEach(() => {
    logSpy = jest.spyOn(logger, "log").mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("logInfo", () => {
    it("should call log with 'info' level", () => {
      logger.logInfo(testMessage, testData);
      expect(logSpy).toHaveBeenCalledWith("info", testMessage, testData);
    });
  });

  describe("logWarning", () => {
    it("should call log with 'warning' level", () => {
      logger.logWarning(testMessage, testData);
      expect(logSpy).toHaveBeenCalledWith("warning", testMessage, testData);
    });
  });

  describe("logError", () => {
    it("should call log with 'error' level", () => {
      logger.logError(testMessage, testData);
      expect(logSpy).toHaveBeenCalledWith("error", testMessage, testData);
    });
  });

  describe("logDebug", () => {
    it("should call log with 'debug' level", () => {
      logger.logDebug(testMessage, testData);
      expect(logSpy).toHaveBeenCalledWith("debug", testMessage, testData);
    });
  });
});
