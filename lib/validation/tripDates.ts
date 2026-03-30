import { z } from "zod";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string) {
  if (!ISO_DATE_RE.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const tripDateSchema = z
  .string()
  .trim()
  .refine((value) => value.length > 0, {
    message: "Choose a date.",
  })
  .refine(isValidIsoDate, {
    message: "Use a valid date.",
  })
  .refine(
    (value) => {
      const year = parseInt(value.slice(0, 4), 10);
      const currentYear = new Date().getFullYear();
      return year >= currentYear - 1;
    },
    {
      message: "Trip date cannot be earlier than last year.",
    }
  );

export const tripDateRangeSchema = z
  .object({
    startDate: tripDateSchema,
    endDate: tripDateSchema,
  })
  .refine(({ startDate, endDate }) => endDate >= startDate, {
    path: ["endDate"],
    message: "End date must be the same as or later than the start date.",
  });
