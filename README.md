# NestKeep

> Organize every savings account in one place.

NestKeep is an offline-first household finance app for managing multiple savings
accounts, recording every transaction, generating reports, and tracking savings
goals — all on-device, with an architecture ready for cloud sync and shared
households.

Built with **Expo (SDK 55) · React Native 0.83 · Expo Router · TypeScript**.

---

## Features

- **Accounts** — create, edit, archive/restore, per-account balances, and a
  detail screen with full transaction history.
- **Transactions** — deposits, withdrawals, transfers, reversals, soft-delete,
  editable date & time, notes, and search/filter.
- **Dashboard** — total savings, today/this-month deposits & withdrawals,
  largest account, recent transaction, and a savings-goals summary.
- **Reports** — monthly summaries plus charts (savings growth, deposits vs
  withdrawals, account distribution).
- **Savings goals** — targets with progress tracked against a linked account.
- **Shared households** — members with roles (Owner/Admin/Member/Viewer) and an
  activity log.
- **Export & backup** — CSV / Excel / PDF export and JSON backup + restore via
  the system share sheet.
- **Notifications** — local daily/weekly/goal reminders (requires a dev build).
- **Theming** — light / dark / system, applied app-wide.
- **Offline-first** — everything works with no connection; changes queue for
  sync when a backend is enabled.

Deferred for a later release: **PIN/biometric security** and **authentication**
(the data model already carries the fields for both).

---

## Business rules

Core rules enforced across the app (see `Rules.md` for the full list):

- **Transactions are the source of truth** — balances are always computed, never
  edited directly.
- **Never delete financial history** — corrections are made by reversing a
  transaction; deletes are soft.
- **Money is stored as integers** (tambala; 1 MWK = 100) to avoid floating-point
  error — formatting happens only in the UI.
- **Accounts are archived, not deleted** once they have history.
- **Transfers don't change total savings** — they create two linked transactions.

---

## Tech stack

| Concern            | Choice                                             |
| ------------------ | -------------------------------------------------- |
| Framework          | Expo SDK 55, React Native 0.83, React 19           |
| Navigation         | Expo Router (typed routes)                         |
| Language           | TypeScript                                         |
| Styling            | NativeWind (Tailwind) + a shared color palette     |
| On-device database | **expo-sqlite**                                    |
| Local key-value    | expo-sqlite (sync API)                             |
| State              | Zustand                                            |
| Validation         | Zod                                                |
| Charts             | react-native-svg (hand-rolled, dependency-light)   |
| Remote (optional)  | Supabase (Postgres)                                |
| Schema-of-record   | Prisma (`prisma/schema.prisma`) — design + remote  |

### A note on the database

Prisma Client cannot run inside React Native, so **on-device persistence uses
`expo-sqlite` directly** (`lib/db.ts`). The Prisma schema is kept as the
design source-of-truth and for the remote Supabase/Postgres side; the local
SQLite schema mirrors it (enums → TEXT, `BigInt` money → INTEGER, `String[]` →
JSON TEXT, dates → ISO TEXT, booleans → 0/1).

---

## Project structure

```
app/                     Expo Router routes
  (tabs)/                Dashboard, Accounts, Transactions, Reports, Settings
  account/[id]/          Account detail + edit
  transaction/           add · edit · transfer · [id] (detail)
  household/             Members, roles, activity log
  goals/                 Savings goals
  onboarding/            First-run setup
  modal/                 Pickers
components/              Shared UI (charts, datetime-field, modals, sync status)
features/                Feature-first modules (accounts, transactions, reports,
                         dashboard, goals, household, sync, export, notifications)
  <feature>/services/    Data access + business logic
  <feature>/store/       Zustand stores
hooks/                   useTheme, useCurrency, useDebounce, useNetwork
lib/                     db, kv, supabase, hydrate, utils, dayjs, query-client
store/                   Global stores (app, ui, auth)
schemas/                 Zod schemas
types/                   Shared types + domain models (types/prisma.ts)
constants/               colors, currency, icons, routes, storage
prisma/                  schema.prisma, seed, RLS policies (design + remote)
```

---

## Getting started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io) (`packageManager` is pinned in `package.json`)

### Install

```bash
pnpm install
```

### Configure environment

Copy the example env and fill in values (Supabase is optional — see below):

```bash
cp .env.example .env
```

```dotenv
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
# Remote sync stays OFF until you set this to "true" (needs the tables + auth):
EXPO_PUBLIC_ENABLE_REMOTE_SYNC=false
```

### Run

```bash
pnpm start        # start Metro
pnpm ios          # iOS
pnpm android      # Android
pnpm web          # web
```

> **Expo Go vs development build.** This project targets a recent SDK and uses
> native modules. Core features (accounts, transactions, reports, goals,
> households, export/backup, offline storage) run in **Expo Go**. Some features
> require a **development build** — notably **notifications** (removed from Expo
> Go in SDK 53+). To make one:
>
> ```bash
> npx expo run:android   # or: npx expo run:ios
> ```

The database bootstraps and seeds a default household + starter accounts on
first launch — no manual DB setup needed to start using the app.

---

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `pnpm start`        | Start the Expo dev server             |
| `pnpm ios` / `android` / `web` | Run on a platform          |
| `pnpm lint`         | ESLint (flat config)                  |
| `pnpm format`       | Prettier                              |
| `pnpm db:generate`  | Prisma client generate (remote schema)|
| `pnpm db:migrate`   | Prisma migrate (remote)               |
| `pnpm db:seed`      | Seed the remote database              |
| `pnpm db:studio`    | Prisma Studio                         |

Type-check with:

```bash
pnpm exec tsc --noEmit
```

---

## Cloud sync (optional)

NestKeep is fully usable offline. To enable Supabase sync:

1. Create the tables to match `prisma/schema.prisma` (and apply
   `prisma/rls-policies.sql`).
2. Set `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Set `EXPO_PUBLIC_ENABLE_REMOTE_SYNC=true`.

Local changes queue and push on reconnect; a conservative pull hydrates local
data. Full cloud round-trips depend on **authentication** (deferred), since the
RLS policies expect an authenticated user.

---

## Status

Roadmap phases 1–9 and 12–15 are implemented (see `Plan.md`). Security (PIN /
biometrics) and Authentication are intentionally deferred; the schema and
navigation already accommodate them without a redesign.
