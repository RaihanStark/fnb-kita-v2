# Opening Procedures Implementation Plan

## Overview
Implement a multi-step digital opening procedure system for FnB Kita that guides employees through the daily opening checklist, ensuring consistent preparation and proper record-keeping.

## Core Features

### 1. Multi-Step Checklist System
- Interactive step-by-step guide based on the SOP
- Progress tracking with visual indicators
- Ability to go back to previous steps
- Mandatory completion of each step before proceeding
- Time stamping for each completed step

### 2. Step Categories (Based on SOP)
1. **Hygiene & Cleanliness** (Kebersihan)
   - Hand washing confirmation
   - Area cleaning checklist
   - Food safety preparation

2. **Stock Management** (Cek & Susun Stok)
   - Initial stock count by product type
   - Stock condition assessment
   - Preparation requirements (e.g., frying needed)

3. **Display Preparation** (Siapkan untuk Display)
   - Product arrangement confirmation
   - Labeling verification
   - Temperature control checks

4. **Financial Setup** (Catat Modal Awal)
   - Starting cash float recording
   - Change denomination breakdown

5. **Final Checklist** (Checklist Harian)
   - Summary of all completed tasks
   - Digital signature/confirmation

### 3. Data Recording Features
- Stock counts with product categorization
- Damaged/unusable items tracking
- Photo upload capability for visual documentation
- Notes/comments for each step
- Automatic timestamp and user tracking
- Date constraints using UTC+7 timezone (Jakarta/Bangkok time)

## Technical Implementation

### Database Schema

```sql
-- Opening procedures template
opening_procedure_templates (
  id: uuid
  name: string
  product_type: string (e.g., 'risol', 'bakso', etc.)
  steps: jsonb (array of step definitions)
  created_at: timestamp
  updated_at: timestamp
)

-- Opening procedure instances (actual daily records)
opening_procedures (
  id: uuid
  template_id: uuid (FK)
  user_id: uuid (FK)
  branch_id: uuid (optional for multi-branch)
  status: enum ('in_progress', 'completed', 'cancelled')
  started_at: timestamp
  completed_at: timestamp
  created_at: timestamp
)

-- Individual step completions
opening_procedure_steps (
  id: uuid
  procedure_id: uuid (FK)
  step_index: int
  step_name: string
  completed: boolean
  completed_at: timestamp
  notes: text
  data: jsonb (step-specific data like stock counts)
)

-- Stock counts during opening
opening_stock_counts (
  id: uuid
  procedure_id: uuid (FK)
  product_name: string
  product_variant: string
  initial_count: int
  prepared_count: int
  damaged_count: int
  notes: text
)

-- Financial records
opening_cash_records (
  id: uuid
  procedure_id: uuid (FK)
  total_cash: decimal
  denominations: jsonb
  notes: text
)
```

### API Endpoints

```typescript
// Get opening procedure template
GET /api/procedures/opening/template
Response: { template with steps }

// Start new opening procedure
POST /api/procedures/opening/start
Body: { templateId, branchId? }
Response: { procedureId, firstStep }

// Get current procedure status
GET /api/procedures/opening/:id
Response: { procedure details, completed steps, current step }

// Complete a step
POST /api/procedures/opening/:id/steps/:stepIndex/complete
Body: { data: step-specific data, notes? }
Response: { nextStep or completion status }

// Update stock count
POST /api/procedures/opening/:id/stock
Body: { productName, variant, counts }

// Save cash record
POST /api/procedures/opening/:id/cash
Body: { totalCash, denominations }

// Complete entire procedure
POST /api/procedures/opening/:id/complete
Response: { summary, timestamp }

// Get opening history
GET /api/procedures/opening/history
Query: { startDate?, endDate?, userId? }
```

### UI/UX Design

#### Mobile-First Interface
1. **Progress Header**
   - Step counter (e.g., "Step 3 of 5")
   - Progress bar
   - Time elapsed

2. **Step Card Design**
   - Clear step title
   - Descriptive instructions
   - Action buttons/inputs
   - Optional photo upload
   - Notes field

3. **Navigation**
   - Back button (with confirmation if data entered)
   - Next button (disabled until requirements met)
   - Save & Exit option

#### Desktop Interface
- Side navigation showing all steps
- Current step highlighted
- Preview of completed data
- Print-friendly summary view

### Component Structure

```
src/components/procedures/
├── opening/
│   ├── OpeningProcedureFlow.tsx      // Main container
│   ├── OpeningStepRenderer.tsx       // Renders current step
│   ├── steps/
│   │   ├── HygieneStep.tsx          // Step 1
│   │   ├── StockCountStep.tsx       // Step 2
│   │   ├── DisplayPrepStep.tsx      // Step 3
│   │   ├── CashSetupStep.tsx        // Step 4
│   │   └── FinalChecklistStep.tsx   // Step 5
│   ├── OpeningProgressBar.tsx        // Progress indicator
│   └── OpeningSummary.tsx            // Completion summary
```

### State Management

```typescript
// Zustand store for opening procedure
interface OpeningProcedureStore {
  currentProcedure: OpeningProcedure | null
  currentStepIndex: number
  stepData: Record<number, any>
  
  startProcedure: (templateId: string) => Promise<void>
  completeStep: (data: any) => Promise<void>
  goToPreviousStep: () => void
  saveAndExit: () => Promise<void>
  completeProcedure: () => Promise<void>
}
```

### Validation & Business Rules

1. **Time Constraints**
   - Must be started within allowed time window (e.g., 12 hours before opening)
   - Auto-save progress every 30 seconds
   - Session timeout after 30 minutes of inactivity

2. **Data Validation**
   - Required fields per step
   - Numeric validation for counts
   - Photo size limits
   - Character limits for notes

3. **Role Permissions**
   - EMPLOYEE: Can perform opening procedures
   - MANAGER: Can perform + view all history + modify templates

### Error Handling
- Network failure: Save to local storage, sync when online
- Incomplete procedure: Save as draft, resume later
- Validation errors: Clear inline messages
- System errors: Fallback to manual entry with export option

### Analytics & Reporting
- Average completion time per step
- Common issues/notes by category
- Stock discrepancy patterns
- Compliance rate (procedures completed on time)

## Implementation Phases

### Phase 1: Core Functionality (Week 1-2)
- Database schema and migrations
- Basic API endpoints
- Simple multi-step form UI
- Stock count functionality

### Phase 2: Enhanced Features (Week 3)
- Photo upload support
- Auto-save and resume
- Mobile optimizations
- Cash record management

### Phase 3: Polish & Testing (Week 4)
- Comprehensive validation
- Error handling
- E2E tests
- Performance optimization

### Phase 4: Advanced Features (Future)
- Template customization
- Multi-branch support
- Offline mode with sync
- Analytics dashboard
- Integration with inventory system

## Testing Strategy

### Unit Tests
- Step validation logic
- Data transformation functions
- Store actions

### Integration Tests
- API endpoint flows
- Database operations
- Authentication/authorization

### E2E Tests
- Complete opening procedure flow
- Step navigation
- Data persistence
- Error scenarios

## Success Metrics
- Procedure completion rate > 95%
- Average completion time < 15 minutes
- User satisfaction score > 4/5
- Data accuracy improvement
- Reduction in opening-related issues