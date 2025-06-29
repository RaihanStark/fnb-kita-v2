# Date & Time Formatting Guide for UTC+7

## Overview
The application stores all timestamps in UTC (database standard), but displays them in UTC+7 (Jakarta/Bangkok timezone) for Indonesian users.

## Usage

### Import the utilities
```typescript
import { formatDateUTC7, formatTimeWIB, formatDateTimeWIB } from '@/lib/utils/format-date';
```

### Format timestamps from the database

1. **Time only (with WIB indicator)**
   ```typescript
   formatTimeWIB(opening.createdAt) // "14:30 WIB"
   ```

2. **Date and time (with WIB indicator)**
   ```typescript
   formatDateTimeWIB(opening.completedAt) // "29 Jun 2025 14:30 WIB"
   ```

3. **Custom format**
   ```typescript
   formatDateUTC7(opening.createdAt, 'EEEE, dd MMMM yyyy') // "Sabtu, 29 Juni 2025"
   formatDateUTC7(opening.createdAt, 'dd/MM/yyyy HH:mm') // "29/06/2025 14:30"
   ```

## Examples

### In React Components
```tsx
// Opening procedure summary
<span>Waktu Mulai: {formatTimeWIB(opening.createdAt)}</span>
<span>Selesai pada: {formatDateTimeWIB(opening.completedAt)}</span>

// Table or list
<td>{formatDateUTC7(record.updatedAt, 'dd MMM yyyy HH:mm')}</td>
```

### Common Formats
- Full date: `'EEEE, dd MMMM yyyy'` → "Sabtu, 29 Juni 2025"
- Short date: `'dd MMM yyyy'` → "29 Jun 2025"
- Date time: `'dd MMM yyyy HH:mm'` → "29 Jun 2025 14:30"
- Time only: `'HH:mm'` → "14:30"

## Important Notes
1. Always use these utilities when displaying timestamps to users
2. Database stores in UTC - no conversion needed when saving
3. The `date` field (YYYY-MM-DD) is already in UTC+7, no conversion needed
4. All `createdAt`, `updatedAt`, and completion timestamps need conversion