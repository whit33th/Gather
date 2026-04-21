import { format, parseISO } from "date-fns";

export function formatHomeTripRange(start: string, end: string) {
  return `${format(parseISO(start), "MMM d")} – ${format(parseISO(end), "MMM d, yyyy")}`;
}
