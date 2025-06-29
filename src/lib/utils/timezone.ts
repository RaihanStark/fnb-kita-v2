/**
 * Get current date in UTC+7 (Jakarta/Bangkok timezone)
 * Returns date string in YYYY-MM-DD format
 */
export function getDateInUTC7(): string {
  // Create a date object with UTC+7 offset (7 hours ahead of UTC)
  const now = new Date();
  const utc7Offset = 7 * 60; // 7 hours in minutes
  const localOffset = now.getTimezoneOffset(); // Local timezone offset in minutes
  const utc7Time = new Date(now.getTime() + (utc7Offset + localOffset) * 60 * 1000);
  
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