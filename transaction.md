# Transaction Module Implementation Plan

## Overview
The transaction module is the main module for recording daily sales and non-sales transactions (damaged, bonus, disposal) for the risol business.

## Transaction Types
1. **Sales** - Regular sales transactions with amount in rupiah
2. **Non-Sales** - Transactions without monetary value:
   - Rusak (Damaged)
   - Bonus (Free/Promotional)
   - Buang (Disposal/Waste)

## Features
1. **Transaction List**
   - View all transactions for the day
   - Filter by type (sales/non-sales)
   - Edit existing transactions
   - Delete transactions

2. **Add/Edit Transaction**
   - Select transaction type
   - Add product variants and quantities
   - Input amount (for sales only)
   - Timestamp automatically recorded

3. **Transaction Details**
   - Product variants sold
   - Quantity per variant
   - Total amount (sales only)
   - Transaction type
   - Created/updated timestamps

## Database Schema

```sql
-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL, -- 'sales', 'damaged', 'bonus', 'disposal'
  items JSONB NOT NULL, -- Array of {productId, name, variant, quantity}
  total_amount DECIMAL(10,2), -- NULL for non-sales
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE NOT NULL -- Transaction date in UTC+7
);

-- Index for performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
```

## API Endpoints

1. `GET /api/transactions` - List transactions (with date filter)
2. `POST /api/transactions` - Create new transaction
3. `PUT /api/transactions/:id` - Update transaction
4. `DELETE /api/transactions/:id` - Delete transaction
5. `GET /api/transactions/summary` - Daily summary

## UI Components

1. **TransactionList** - Main list view
2. **TransactionForm** - Add/Edit form
3. **TransactionItem** - List item component
4. **TransactionSummary** - Daily summary card

## Navigation
- Add transaction icon in the middle of bottom navigation
- Quick access from dashboard when trading is active