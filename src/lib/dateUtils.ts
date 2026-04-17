/**
 * Centralized date helpers to avoid UTC off-by-one issues when working with
 * "YYYY-MM-DD" strings coming from Supabase (date columns).
 *
 * Always parse dates at local noon to ensure the date displayed in any
 * timezone matches the date stored in the database.
 */

/**
 * Parse a date string (YYYY-MM-DD or full ISO) as local time.
 * - For "YYYY-MM-DD" strings, anchors at local noon.
 * - For full ISO strings (with time), parses normally.
 */
export const parseLocalDate = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) return dateStr;
  // If only YYYY-MM-DD, anchor at noon local time
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T12:00:00");
  }
  return new Date(dateStr);
};

/**
 * Format a date string (YYYY-MM-DD) to pt-BR locale without timezone shift.
 */
export const formatDateBR = (
  dateStr: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string => {
  if (!dateStr) return "—";
  return parseLocalDate(dateStr).toLocaleDateString("pt-BR", options);
};

/**
 * Add N months to a date string (YYYY-MM-DD), returning YYYY-MM-DD.
 */
export const addMonthsISO = (dateStr: string, months: number): string => {
  const d = parseLocalDate(dateStr);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
};

/**
 * Convert a Date to YYYY-MM-DD using local components (no UTC shift).
 */
export const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Today as YYYY-MM-DD (local timezone).
 */
export const todayISO = (): string => toISODate(new Date());

/**
 * Get the year/month key (YYYY-MM) from a date string, local-safe.
 */
export const monthKey = (dateStr: string | Date): string => {
  const d = parseLocalDate(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Get the year as a number from a date string, local-safe.
 */
export const getYear = (dateStr: string | Date): number => {
  return parseLocalDate(dateStr).getFullYear();
};

/**
 * Get the month (1-12) from a date string, local-safe.
 */
export const getMonth = (dateStr: string | Date): number => {
  return parseLocalDate(dateStr).getMonth() + 1;
};
