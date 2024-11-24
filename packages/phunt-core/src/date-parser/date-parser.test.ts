import { describe, it, expect } from "@jest/globals";
import { DateParser } from "./date-parser.js";

describe("DateParser", () => {
  const dateParser = new DateParser();

  describe("DateParser.parse", () => {
    const referenceDate = new Date(2000, 0, 1); // January 1, 2000

    it("should parse a valid phunt-date string with the format yyyy-MM-dd", () => {
      const dateStr = "2000-01-01";
      const formatStr = "yyyy-MM-dd";
      const expectedDate = new Date(2000, 0, 1);

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should parse a valid phunt-date string with the format MM/dd/yyyy", () => {
      const dateStr = "01/01/2000";
      const formatStr = "MM/dd/yyyy";
      const expectedDate = new Date(2000, 0, 1);

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should parse a valid phunt-date string with the format yyyy-MM-dd'T'HH-mm-ss", () => {
      const dateStr = "2000-01-01T12-30-45";
      const formatStr = "yyyy-MM-dd'T'HH-mm-ss";
      const expectedDate = new Date(2000, 0, 1, 12, 30, 45);

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should parse a valid phunt-date string with the format yyyy:MM:dd HH:mm:ss", () => {
      const dateStr = "2000:01:01 12:30:45";
      const formatStr = "yyyy:MM:dd HH:mm:ss";
      const expectedDate = new Date(2000, 0, 1, 12, 30, 45);

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should parse a valid phunt-date string with the format yyyy: M:d HH:mm:ss, with leading zeroes", () => {
      const dateStr = "2000: 01:01 12:30:45";
      const formatStr = "yyyy: M:d HH:mm:ss";
      const expectedDate = new Date(2000, 0, 1, 12, 30, 45);

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should parse a valid phunt-date string with the format yyyy: M:d HH:mm:ss", () => {
      const dateStr = "2000: 1:1 12:30:45";
      const formatStr = "yyyy: M:d HH:mm:ss";
      const expectedDate = new Date(2000, 0, 1, 12, 30, 45);

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should parse a valid phunt-date string with the format yyyy-MM-dd'T'HH:mm:ss", () => {
      const dateStr = "2000-01-01T12:30:45";
      const formatStr = "yyyy-MM-dd'T'HH:mm:ss";
      const expectedDate = new Date(2000, 0, 1, 12, 30, 45);

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should parse a valid phunt-date string with the format yyyy-MM-dd'T'HH:mm:ss.SSS", () => {
      const dateStr = "2000-01-01T12:30:45.123";
      const formatStr = "yyyy-MM-dd'T'HH:mm:ss.SSS";
      const expectedDate = new Date(2000, 0, 1, 12, 30, 45, 123);

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should parse a valid phunt-date string with the format yyyy-MM-dd'T'HH:mm:ssX", () => {
      const dateStr = "2000-01-01T12:30:45Z";
      const formatStr = "yyyy-MM-dd'T'HH:mm:ssX";
      const expectedDate = new Date(Date.UTC(2000, 0, 1, 12, 30, 45));

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should parse a valid phunt-date string with the format yyyy/MM/dd HH:mm:ss", () => {
      const dateStr = "2000/01/01 12:30:45";
      const formatStr = "yyyy/MM/dd HH:mm:ss";
      const expectedDate = new Date(2000, 0, 1, 12, 30, 45);

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should parse a valid phunt-date string with the format yyyy/MM/dd", () => {
      const dateStr = "2000/01/01";
      const formatStr = "yyyy/MM/dd";
      const expectedDate = new Date(2000, 0, 1);

      const result = dateParser.parse(dateStr, formatStr, referenceDate);

      expect(result).toEqual(expectedDate);
    });

    it("should throw an error for an invalid phunt-date string", () => {
      const dateStr = "invalid-phunt-date";
      const formatStr = "yyyy-MM-dd";

      expect(() => dateParser.parse(dateStr, formatStr, referenceDate)).toThrow(
        `Could not parse date string '${dateStr}'! Check if provided date string is valid!`,
      );
    });

    it("should throw an error for a phunt-date string with an incorrect format", () => {
      const dateStr = "2000/01/01";
      const formatStr = "yyyy-MM-dd";

      expect(() => dateParser.parse(dateStr, formatStr, referenceDate)).toThrow(
        `Could not parse date string '${dateStr}'! Check if provided date string is valid!`,
      );
    });
  });
});
