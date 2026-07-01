# 02-folder-structure.md

# NestKeep Project Structure

> **Version:** 1.0
> **Application:** NestKeep – Organize every savings account in one place.

---

# Philosophy

NestKeep follows a **feature-first architecture** rather than grouping files by type.

Benefits:

* Easier to maintain
* Easier to scale
* Better code organization
* Independent feature development
* Cleaner imports
* Simpler testing

---

# Project Structure

```text
nestkeep/

├── app/                        # Expo Router
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── accounts.tsx
│   │   ├── reports.tsx
│   │   ├── transactions.tsx
│   │   └── settings.tsx
│   │
│   ├── account/
│   │   └── [id].tsx
│   │
│   ├── transaction/
│   │   ├── add.tsx
│   │   ├── edit.tsx
│   │   └── transfer.tsx
│   │
│   ├── reports/
│   │   └── [month].tsx
│   │
│   ├── onboarding/
│   │   └── index.tsx
│   │
│   ├── modal/
│   │   ├── account-picker.tsx
│   │   ├── icon-picker.tsx
│   │   └── color-picker.tsx
│   │
│   └── _layout.tsx
│
├── assets/
│   ├── fonts/
│   ├── icons/
│   ├── images/
│   ├── logo/
│   └── animations/
│
├── components/
│   ├── ui/
│   ├── cards/
│   ├── charts/
│   ├── forms/
│   ├── layouts/
│   ├── navigation/
│   └── common/
│
├── features/
│
│   ├── accounts/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── store/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── transactions/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── store/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── reports/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── store/
│   │
│   ├── household/
│   │   ├── services/
│   │   ├── store/
│   │   ├── schemas/
│   │   └── types/
│   │
│   └── settings/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       └── types/
│
├── hooks/
│   ├── useCurrency.ts
│   ├── useTheme.ts
│   ├── useDebounce.ts
│   └── useNetwork.ts
│
├── lib/
│   ├── supabase.ts
│   ├── query-client.ts
│   ├── mmkv.ts
│   ├── dayjs.ts
│   └── utils.ts
│
├── services/
│   ├── sync.service.ts
│   ├── export.service.ts
│   ├── notification.service.ts
│   └── backup.service.ts
│
├── store/
│   ├── app.store.ts
│   ├── auth.store.ts
│   └── ui.store.ts
│
├── schemas/
│   ├── account.schema.ts
│   ├── transaction.schema.ts
│   ├── transfer.schema.ts
│   ├── report.schema.ts
│   └── settings.schema.ts
│
├── types/
│   ├── account.ts
│   ├── transaction.ts
│   ├── report.ts
│   ├── household.ts
│   └── settings.ts
│
├── constants/
│   ├── colors.ts
│   ├── currency.ts
│   ├── icons.ts
│   ├── routes.ts
│   └── storage.ts
│
├── docs/
│   ├── 00-project-overview.md
│   ├── 01-product-requirements.md
│   ├── 02-folder-structure.md
│   ├── 03-database-design.md
│   ├── 04-business-rules.md
│   ├── 05-api-design.md
│   ├── 06-state-management.md
│   ├── 07-ui-guidelines.md
│   ├── 08-development-roadmap.md
│   ├── 09-testing.md
│   └── 10-future-features.md
│
├── app.json
├── babel.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── metro.config.js
└── README.md
```

---

# Folder Responsibilities

## app/

Contains all application routes using **Expo Router**.

---

## assets/

Stores static resources.

* Fonts
* Images
* Icons
* Logos
* Animations

---

## components/

Reusable UI components shared across the application.

Examples:

* Buttons
* Cards
* Inputs
* Charts
* Modals
* Layouts

---

## features/

The heart of the application.

Each feature owns its:

* Components
* Services
* Store
* Types
* Hooks
* Schemas
* Screens

Features remain isolated from one another.

---

## hooks/

Reusable React hooks used across multiple features.

---

## lib/

Third-party library configuration and utility setup.

Examples:

* Supabase
* MMKV
* TanStack Query
* Date utilities

---

## services/

Application-wide services.

Examples:

* Cloud Sync
* Export
* Notifications
* Backup

---

## store/

Global Zustand stores.

Only global state belongs here.

Examples:

* Theme
* Authentication
* App settings

Feature-specific state should remain inside its feature folder.

---

## schemas/

Global Zod validation schemas.

---

## types/

Shared TypeScript types and interfaces.

---

## constants/

Application constants.

Examples:

* Colors
* Currency
* Icons
* Routes

---

## docs/

Project documentation and architectural decisions.

---

# Architecture Principles

NestKeep follows these principles:

* Feature-first organization
* Separation of concerns
* Offline-first architecture
* Scalable folder hierarchy
* Shared UI components
* Strong typing with TypeScript
* Validation using Zod
* State management with Zustand
* Server state with TanStack Query
* Cloud synchronization with Supabase

This structure is designed to support future features such as authentication, multiple households, budgeting, savings goals, cloud backup, exports, and collaborative household management without major refactoring.
