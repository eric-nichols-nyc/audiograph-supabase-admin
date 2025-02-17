/**
 * Formats a date string into a localized date format
 * @param dateString - ISO date string to format
 * @returns Formatted date string (e.g., "January 1, 2024" or "N/A" if invalid)
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 