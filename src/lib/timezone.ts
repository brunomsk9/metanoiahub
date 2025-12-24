/**
 * Timezone utilities for handling Brazil timezone (UTC-3)
 * 
 * The database stores timestamps in UTC, but users interact with local time.
 * These utilities help convert between local time and UTC correctly.
 */

const BRAZIL_OFFSET_HOURS = -3;

/**
 * Parses a local datetime-local input value and returns an ISO string in UTC
 * that represents that exact local time.
 * 
 * For example: If user selects "2025-12-28T10:00" in Brazil (UTC-3),
 * this returns "2025-12-28T13:00:00.000Z" (10:00 Brazil = 13:00 UTC)
 */
export function localDateTimeToUTC(localDateTimeString: string): string {
  if (!localDateTimeString) return '';
  
  // Create a date from the local string
  // When parsing "YYYY-MM-DDTHH:mm", JavaScript treats it as local time
  const localDate = new Date(localDateTimeString);
  
  // Return ISO string which is in UTC
  return localDate.toISOString();
}

/**
 * Parses a local time string (HH:mm) and a date, and returns an ISO string in UTC.
 * 
 * @param date - The base date
 * @param timeString - Time in "HH:mm" format (local time)
 */
export function localTimeToUTC(date: Date, timeString: string): string {
  if (!timeString) return date.toISOString();
  
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Create a new date with the specified time in local timezone
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);
  
  // Return ISO string which converts to UTC
  return localDate.toISOString();
}

/**
 * Formats a UTC ISO string to a datetime-local input value in local time.
 * 
 * For example: If database has "2025-12-28T13:00:00.000Z",
 * this returns "2025-12-28T10:00" for a user in Brazil (UTC-3)
 */
export function utcToLocalDateTimeValue(utcString: string): string {
  if (!utcString) return '';
  
  const date = new Date(utcString);
  
  // Format as datetime-local value (YYYY-MM-DDTHH:mm)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Creates a Date object that represents the correct local time when displayed.
 * Use this when you need to format a UTC timestamp for display.
 * 
 * Note: In most cases, just use `new Date(utcString)` directly with date-fns format,
 * as JavaScript automatically converts to local time. This is here for edge cases.
 */
export function parseUTCToLocalDate(utcString: string): Date {
  return new Date(utcString);
}
