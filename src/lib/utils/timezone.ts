/**
 * Get current date in UTC+7 (Jakarta/Bangkok timezone)
 * Returns date string in YYYY-MM-DD format
 */
export function getDateInUTC7(date?: Date): string {
  // Create a date object with UTC+7 offset (7 hours ahead of UTC)
  const inputDate = date || new Date();
  const utc7Offset = 7 * 60; // 7 hours in minutes
  const localOffset = inputDate.getTimezoneOffset(); // Local timezone offset in minutes
  const utc7Time = new Date(inputDate.getTime() + (utc7Offset + localOffset) * 60 * 1000);
  
  // Format as YYYY-MM-DD
  const year = utc7Time.getFullYear();
  const month = String(utc7Time.getMonth() + 1).padStart(2, '0');
  const day = String(utc7Time.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current timestamp in UTC+7
 */
export function getTimestampInUTC7(): Date {
  const now = new Date();
  const utc7Offset = 7 * 60; // 7 hours in minutes
  const localOffset = now.getTimezoneOffset(); // Local timezone offset in minutes
  return new Date(now.getTime() + (utc7Offset + localOffset) * 60 * 1000);
}

/**
 * Get start of day in UTC+7 for a given date
 */
export function startOfDayUTC7(date: Date): Date {
  const utc7Offset = 7 * 60; // 7 hours in minutes
  const localOffset = date.getTimezoneOffset(); // Local timezone offset in minutes
  const utc7Date = new Date(date.getTime() + (utc7Offset + localOffset) * 60 * 1000);
  
  // Set to start of day
  utc7Date.setHours(0, 0, 0, 0);
  
  // Convert back to local time
  return new Date(utc7Date.getTime() - (utc7Offset + localOffset) * 60 * 1000);
}

/**
 * Get end of day in UTC+7 for a given date
 */
export function endOfDayUTC7(date: Date): Date {
  const utc7Offset = 7 * 60; // 7 hours in minutes
  const localOffset = date.getTimezoneOffset(); // Local timezone offset in minutes
  const utc7Date = new Date(date.getTime() + (utc7Offset + localOffset) * 60 * 1000);
  
  // Set to end of day
  utc7Date.setHours(23, 59, 59, 999);
  
  // Convert back to local time
  return new Date(utc7Date.getTime() - (utc7Offset + localOffset) * 60 * 1000);
}