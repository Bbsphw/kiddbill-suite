# Kiddbill Suite - Shared Library 📦

This directory contains shared TypeScript code, utilities, types, and logic that are used by both the **Frontend (web)** and **Backend (server)** applications. By keeping this logic in a central package, we ensure consistency across the stack and avoid duplicating code.

## 🛠️ Contents
- `calculations.ts` - Shared business logic and math calculations (e.g., splitting bills, calculating VAT and Service Charges, computing member subtotals).
- `money.ts` - Utilities for handling money parsing and formatting (e.g., ensuring precision and avoiding float point errors).

## 🚀 Usage

Since this is an internal Turborepo package, it is symlinked into the other workspaces.

In the `web` or `server` packages, you can import functions directly like so:
```typescript
import { calculateBillTotal } from '@kiddbill/shared/calculations';
import { formatMoney } from '@kiddbill/shared/money';
```

## 🔗 Useful Links
- [Main Project README](../../README.md)
