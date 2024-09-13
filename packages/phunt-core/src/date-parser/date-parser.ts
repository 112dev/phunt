import { parse } from "date-fns";

export class DateParser {
  /**
   * Parses a date string into a Date object based on the provided format string and reference date.
   * @param dateStr The date string to parse.
   * @param formatStr The format string that describes the format of the date string.
   * @param referenceDate The reference date to use when parsing the date string.
   * @returns The parsed Date object.
   * @throws {Error} Throws an error if the date string cannot be parsed.
   */
  parse(dateStr: string, formatStr: string, referenceDate: Date): Date {
    const parsedDate = parse(dateStr, formatStr, referenceDate);

    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    throw new Error(
      `Could not parse date string '${dateStr}'! Check if provided date string is valid!`,
    );
  }
}
