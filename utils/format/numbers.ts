/**
 * Formats a number with thousands separators
 * @param num - The number to format
 * @returns Formatted string (e.g., "1,234,567" or "N/A" if null/undefined)
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat().format(num);
}; 