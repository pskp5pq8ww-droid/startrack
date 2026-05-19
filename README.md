# DepotOps KPI System

Ultra-minimal internal depot web-app prototype for drivers, supervisors, and admins.

Open `index.html` in a browser. The app is a static SPA with simulated authentication, role-based screens, local persistence, export actions, validation, loading/success states, and a backend-ready data model.

## Demo Accounts

- Driver: `driver@depotops.test` / `driver123`
- Supervisor: `supervisor@depotops.test` / `supervisor123`
- Admin: `admin@depotops.test` / `admin123`

The login screen also includes quick demo account buttons for presentation speed.

## Data Model

The prototype stores these entities in localStorage:

- `users`
- `kpi_submissions`
- `holiday_requests`
- `routes`
- `daily_metrics` derived from submissions
- `settings`, including editable Brisbane toll pricing

KPI submissions calculate worked hours from start/finish time and can store toll selections with quantity, unit price, and subtotal for Excel/CSV export.

`schema.sql` contains a backend-ready relational schema using the same entity names.

## Future Backend Integration

The UI reads and writes through a small repository layer in `app.js`. Replace the localStorage methods in `depotRepository` with API calls when a real backend is available. The current UI is intentionally framework-free so it can be migrated into React, Vue, Next.js, or an existing internal shell without dependency lock-in.
