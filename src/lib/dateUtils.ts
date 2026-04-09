/**
 * Parse a date string (YYYY-MM-DD) as local time to avoid UTC off-by-one issues.
 */
export const parseLocalDate = (dateStr: string): Date => {
  return new Date(dateStr + "T12:00:00");
};

/**
 * Format a date string (YYYY-MM-DD) to pt-BR locale without timezone shift.
 */
export const formatDateBR = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  return parseLocalDate(dateStr).toLocaleDateString("pt-BR");
};
