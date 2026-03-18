# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a WooCommerce admin panel for Amabelle Foods (amabellefoods.com).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui

## WooCommerce Admin App (artifacts/wc-admin)

React + Vite admin panel connecting to WooCommerce REST API.

### Features
- **Login/Logout**: Session-based auth. Validates credentials against WordPress REST API (Application Passwords) or falls back to ADMIN_USERNAME/ADMIN_PASSWORD env vars
- **Dashboard**: Stats cards (total orders, revenue, by status)
- **Orders Table**: Paginated list with search, status filter, inline status change dropdown, click-to-view detail sheet
- **Order Detail Sheet**: Full order info, line items, billing/shipping, payment method, update status + customer note
- **Real-time notifications**: Polls `/api/orders/latest` every 30s for new orders; plays Web Audio API sound + browser notification + floating notification card
- **Notification bell**: Shows unread count in sidebar

### Environment Variables Required
- `WC_CONSUMER_KEY` — WooCommerce REST API consumer key
- `WC_CONSUMER_SECRET` — WooCommerce REST API consumer secret
- `ADMIN_USERNAME` (optional) — fallback admin username if WordPress Basic Auth doesn't work
- `ADMIN_PASSWORD` (optional) — fallback admin password
- `SESSION_SECRET` (optional) — express-session secret

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (WooCommerce proxy + auth)
│   │   └── src/routes/
│   │       ├── auth.ts     # POST /api/auth/login|logout, GET /api/auth/me
│   │       └── orders.ts   # GET/PUT /api/orders, GET /api/orders/stats, /api/orders/latest
│   └── wc-admin/           # React Vite frontend
│       └── src/
│           ├── hooks/use-auth.tsx              # Auth context
│           ├── hooks/use-order-notifications.ts # Polling + sound
│           ├── pages/login.tsx                 # Login page
│           ├── pages/dashboard.tsx             # Stats dashboard
│           ├── pages/orders.tsx                # Orders table
│           └── components/
│               ├── layout/notification-bar.tsx
│               └── order/order-detail-sheet.tsx
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── pnpm-workspace.yaml
```

## Auth Notes

WordPress credentials auth works if:
1. Site has "Basic Authentication" plugin installed (https://github.com/WP-API/Basic-Auth), OR
2. User uses a WordPress Application Password (WP 5.6+) as the password

If neither works, set ADMIN_USERNAME and ADMIN_PASSWORD secrets as fallback.
