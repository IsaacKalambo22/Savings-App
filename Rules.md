# 04-business-rules.md

# NestKeep Business Rules

> **Version:** 1.0
> **Application:** NestKeep – Organize every savings account in one place.

---

# Purpose

These business rules define how NestKeep manages household savings and financial records. Every feature in the application must follow these rules to ensure data integrity, accurate reporting, and a complete financial history.

---

# Rule 1 — Transactions Are the Source of Truth

Account balances must **never** be edited directly.

Balances are always calculated from transaction history.

```
Balance = Total Deposits - Total Withdrawals
```

No screen in the application should allow users to manually change an account balance.

---

# Rule 2 — Never Delete Financial History

Transactions must never be permanently deleted.

If a mistake is made, users should:

* Reverse the transaction, or
* Soft delete it while preserving an audit record.

This ensures complete financial accountability.

---

# Rule 3 — Every Transaction Is Required

Every transaction must contain the following information:

* Account
* Transaction Type
* Amount
* Date
* Time

Optional fields include:

* Notes
* Tags
* Receipt/Image (future feature)

A transaction cannot be saved if any required field is missing.

---

# Rule 4 — Accounts Are Permanent

Accounts with transaction history cannot be deleted.

Instead, they should be archived.

Archived accounts:

* Cannot receive new transactions.
* Continue appearing in historical reports.
* Can be restored if needed.

---

# Rule 5 — Automatic Calculations Only

Users should never manually enter totals.

NestKeep automatically calculates:

* Account Balance
* Total Household Savings
* Monthly Deposits
* Monthly Withdrawals
* Opening Balance
* Closing Balance
* Net Savings

All reports are generated directly from transactions.

---

# Rule 6 — Store Money as Integers

Money must never be stored as floating-point numbers.

Instead of:

```
MK 2,000.50
```

Store:

```
200050
```

(tambala)

Display formatting should convert stored values into human-readable currency.

---

# Rule 7 — Offline First

The application must work without an internet connection.

Users should be able to:

* View accounts
* Add transactions
* Edit transactions
* View reports

Changes are synchronized with the server when connectivity returns.

---

# Rule 8 — Every Account Belongs to a Household

All data belongs to a Household.

Hierarchy:

```
Household
    ├── Accounts
    ├── Transactions
    └── Reports
```

This supports future features like:

* Multiple devices
* Shared households
* User authentication
* Cloud synchronization

---

# Rule 9 — Transfers Do Not Change Total Savings

Moving money between accounts is considered a **Transfer**.

Example:

```
Joint → Business
```

This:

* decreases one account
* increases another account
* does NOT affect total household savings

Transfers should create two linked transaction records.

---

# Rule 10 — Every Account Has Its Own Ledger

Each account maintains an independent transaction history.

Example:

```
Business

+20,000
-5,000
+12,000
```

Balances are calculated only from transactions belonging to that account.

---

# Rule 11 — Reports Are Read-Only

Reports are generated automatically.

Users cannot manually edit:

* Monthly summaries
* Totals
* Charts
* Statistics

Reports always reflect the current transaction data.

---

# Rule 12 — Audit Trail

Every record should include metadata.

```
created_at
updated_at
created_by (future)
updated_by (future)
```

This allows changes to be tracked over time.

---

# Rule 13 — Transactions Are Immutable

Once a transaction has been synchronized, it should not be overwritten.

Corrections should be made by:

* Reversing the transaction, or
* Creating an adjusting transaction.

This preserves an accurate financial history.

---

# Rule 14 — Default Accounts

A new household starts with these accounts:

* Joint
* Rent
* Business
* Personal
* Mom
* Groceries
* Change

Users may add additional accounts such as:

* Emergency
* Vacation
* School Fees
* Car
* Church
* Projects
* Insurance

Accounts should remain fully dynamic.

---

# Rule 15 — Consistent Currency

The application uses one default currency per household.

Example:

```
MK (Malawian Kwacha)
```

All calculations are performed using the stored integer amount.

Currency formatting is handled only in the user interface.

---

# Rule 16 — Monthly Reports

Monthly summaries include:

```
Opening Balance
+ Deposits
- Withdrawals
= Closing Balance
```

These values are calculated automatically from transaction history.

---

# Rule 17 — Dashboard Metrics

The dashboard displays automatically calculated statistics, including:

* Total Household Savings
* Today's Deposits
* Today's Withdrawals
* Monthly Deposits
* Monthly Withdrawals
* Largest Account
* Most Recent Transaction

These values are read-only.

---

# Rule 18 — Data Integrity

The system must prevent:

* Negative transaction amounts
* Missing accounts
* Invalid transaction dates
* Invalid transaction types

Validation occurs before data is stored.

---

# Rule 19 — Validation Before Saving

Every transaction must pass validation before it is saved.

Checks include:

* Amount > 0
* Valid account
* Valid transaction type
* Valid date
* Required fields completed

Invalid data must never be persisted.

---

# Rule 20 — Future Compatibility

All business rules should support future enhancements without requiring database redesign, including:

* Authentication
* Household members
* Cloud backups
* Budgeting
* Savings goals
* Notifications
* PIN protection
* Biometrics
* Data export
* Multiple currencies

---

# Guiding Principles

NestKeep is built on four core principles:

1. **Accuracy** – Every balance is calculated from transactions.
2. **Transparency** – Financial history is never lost.
3. **Reliability** – Reports are generated automatically.
4. **Scalability** – The architecture supports future growth without major redesign.
