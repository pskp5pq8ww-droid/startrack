# DepotOS KPI System

Internal depot web-app for drivers, supervisors, and admins. Node.js HTTP server with file-based JSON storage — no external dependencies.

## Demo Accounts

- Driver: `driver@depotops.test` / `driver123`
- Supervisor: `supervisor@depotops.test` / `supervisor123`
- Admin: `admin@depotops.test` / `admin123`

## Run locally

```bash
node server.js          # → http://localhost:3000
```

Seeds users, routes, settings on first launch. Storage lives in `./storage/`.

## Storage Layout

All persistence is file-based JSON under `storage/`:

```
storage/
├── users.json              # accounts (passwords are scrypt-hashed salt:hash)
├── settings.json           # depot config + Brisbane toll catalog
├── routes.json             # route definitions
├── holidays.json           # holiday requests
├── alerts.json             # supervisor alert board (radio-room 30min breaks)
├── sick-leave.json         # sick leave submissions (file upload not wired)
├── kpis/
│   └── YYYY-MM-DD/
│       └── {driverId}.json # one KPI per driver per day (upsert)
└── dashboard/
    └── YYYY-MM-DD/
        └── snapshot_*.json # supervisor dashboard snapshots
```

**KPI dedup:** Filename is `{driverId}.json` per date folder. A re-submission overwrites the same file, keeping the original `id` and `createdAt`, updating `updatedAt`.

## KPI Flow

1. **Driver fills KPI form** (`app.js` → `kpiView()` → `handleKpi()`):
   - Auto-fills date (today) and driver from session.
   - Validates required fields client-side, recalculates hours from start/finish.
   - 30-min break triggers Radio Room confirmation; if "Yes", an alert is created for supervisors.
2. **POST `/api/kpi`** (`server.js`):
   - Authenticates via `X-Token` header → driver role required.
   - Server **recalculates `hours`** (ignores client value) to prevent tampering.
   - Server **sanitizes strings**, clamps numeric fields ≥ 0.
   - **Upserts** by `{date, driverId}`: removes any existing file for same driver+date, writes new file as `{driverId}.json`.
   - Returns 201 (new) or 200 (update).
3. **Storage**: `storage/kpis/2026-05-20/drv_maya.json` with full record:
   ```
   id, driverId, driverName, date, driverType, supervisorId, routeId,
   startTime, finishTime, hours, breakMinutes, radioRoomNotified,
   offroadDuties, offroadNotes, stops, parcels, tolls[], tollTotal,
   incidents, comments, status, createdAt, updatedAt
   ```
4. **Supervisor / Admin dashboards** poll `GET /api/kpi` every 15s (30s on slow connections), recompute metrics, redraw bar chart and tables.

## API Endpoints

| Method | Path                  | Auth                       | Notes |
| ------ | --------------------- | -------------------------- | ----- |
| POST   | `/api/auth/login`     | —                          | returns `{ token, user }` |
| POST   | `/api/auth/logout`    | any                        | |
| GET    | `/api/me`             | any                        | |
| GET    | `/api/users`          | any                        | passwords never returned |
| POST   | `/api/users`          | admin                      | |
| PUT    | `/api/users/:id`      | admin                      | |
| DELETE | `/api/users/:id`      | admin                      | |
| GET    | `/api/kpi`            | driver: own only · sup/admin: all | |
| POST   | `/api/kpi`            | driver                     | upsert by date+driver |
| GET    | `/api/holidays`       | any                        | |
| POST   | `/api/holidays`       | driver                     | |
| PUT    | `/api/holidays/:id`   | supervisor/admin           | approve/reject |
| GET    | `/api/alerts`         | supervisor/admin           | radio-room alerts |
| POST   | `/api/alerts`         | any                        | created on 30-min break |
| PUT    | `/api/alerts/:id`     | supervisor/admin           | approve/dismiss |
| GET    | `/api/sick-leave`     | driver: own · sup/admin: all | |
| POST   | `/api/sick-leave`     | driver                     | |
| GET    | `/api/routes`         | —                          | |
| GET    | `/api/settings`       | —                          | |
| PUT    | `/api/settings`       | admin                      | |
| GET    | `/api/dashboard/:date`| any auth                   | saves snapshot |
| POST   | `/api/admin/reset`    | admin                      | wipes storage |

## Security

- Passwords: `crypto.scryptSync(password, salt, 64)` stored as `salt:hash` hex; comparison via `crypto.timingSafeEqual`.
- Tokens: 32 random bytes hex, in-memory `Map<token, userId>`.
- Drivers cannot see other drivers' KPIs or sick-leave records.
- Only admins can manage users; only supervisor/admin can approve holidays and alerts.
- Server-side time recalculation prevents driver tampering of `hours`.
- Static file serving rejects path traversal (`filePath.startsWith(ROOT)`).
- Strings sanitized to 2000 chars on KPI write.

## Dashboards

**Supervisor** (`/api/kpi` filtered by date/driver/route):
- Total stops, parcels, hours · drivers submitted/pending · averages (stops, parcels, hours)
- **Parcels bar chart** with toggle: **By driver** (top 8 today) or **By date** (last 7 days)
- Stops 7-day trend line
- Driver submissions table (no toll columns — tolls are admin-only)
- Alert board: radio-room 30-min breaks → Approve / Dismiss; system alerts (incidents, pending drivers, overnight shifts)
- Notification feed (auto-refreshes every 15s)
- Brisbane live clock

**Admin** sees everything supervisors see, plus toll metrics, full data tab with 7-day comparison table, and user/settings management.

## Manual Test

```bash
# 1. clean slate
rm -rf storage && node server.js &

# 2. driver login → token
T=$(curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"driver@depotops.test","password":"driver123","role":"driver"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 3. submit KPI
curl -s -X POST localhost:3000/api/kpi -H "X-Token: $T" -H 'Content-Type: application/json' \
  -d '{"date":"2026-05-20","supervisorId":"sup_aaron","routeId":"route_bn12",
       "startTime":"07:00","finishTime":"15:30","stops":12,"parcels":85,"breakMinutes":60}'

# 4. confirm storage
ls storage/kpis/2026-05-20/   # → drv_maya.json

# 5. driver GET → only their own
curl -s localhost:3000/api/kpi -H "X-Token: $T"

# 6. supervisor GET → all
S=$(curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"supervisor@depotops.test","password":"supervisor123","role":"supervisor"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s localhost:3000/api/kpi -H "X-Token: $S"
```

In the browser, open the supervisor dashboard, switch the parcels chart between "By driver" / "By date", change the date filter, and watch the metrics update.

## Deployment

The repo is deployed to Hostinger via `package.json` → `npm start` → `node server.js`. Static assets are served with `Cache-Control: no-store` for `.css`/`.js`. CSS and JS are versioned in `index.html` (`styles.v7.css`, `app.v5.js`) to bypass the Hostinger CDN cache when shipping updates.
