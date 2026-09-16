# ⚓ Helmsman — Fleet Management Dashboard

A full-stack CRUD dashboard for a maritime operator to manage its fleet: track
vessels, their **voyages**, and the **cargo** each voyage carries — with search,
filtering, pagination, and (later) role-based access. Built with **React**, a
**FastAPI** REST backend, and a **SQL Server (Azure SQL)** relational database via
**SQLAlchemy**, with schema changes managed by **Alembic** migrations.

> Status: **Phase 4 — UX.** A Dashboard tab with fleet-wide stats and charts, inline
> form validation on every "Add ___" form, and responsive polish down to phone
> width — on top of Phase 3's JWT auth.

## Architecture

```
React (Vite)  ──HTTP/JSON──►  FastAPI  ──SQLAlchemy──►  Database
  frontend/                    backend/    + Alembic      SQLite (local) / Azure SQL (prod)
  tabbed UI:                   routers per entity
  Vessels · Voyages · Cargo    vessels / voyages / cargo
```

## Data model

A normalized three-table hierarchy. Deleting a parent cascades to its children
(enforced by `ON DELETE CASCADE` plus SQLAlchemy relationship cascades; foreign
keys are also enforced on SQLite via a `PRAGMA foreign_keys=ON` connection hook).

```
vessels
  id (PK)
  name, imo_number (unique), vessel_type, status, capacity_tonnes, year_built
    │
    │ 1───many   (voyages.vessel_id → vessels.id, ON DELETE CASCADE)
    ▼
voyages
  id (PK)
  vessel_id (FK), voyage_number, origin_port, destination_port,
  departure_date, arrival_date, status
    │
    │ 1───many   (cargo.voyage_id → voyages.id, ON DELETE CASCADE)
    ▼
cargo
  id (PK)
  voyage_id (FK), description, cargo_type, weight_tonnes, quantity, hazardous
```

## Quickstart (local — zero DB setup, uses SQLite)

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload    # http://localhost:8000
```
On startup the app **applies Alembic migrations automatically** and then seeds a
small sample fleet (3 vessels, 2 voyages, 3 cargo items) plus one default admin
account on first run. Open the interactive API docs (Swagger) at
http://localhost:8000/docs.

### 2. Frontend (new terminal)
```bash
cd frontend
npm install
cp .env.example .env             # VITE_API_URL=http://localhost:8000
npm run dev                      # http://localhost:5173
```

## Auth

Every API route requires a JWT (`Authorization: Bearer <token>`), obtained via
`POST /api/auth/login`. Two ways to get one:

- **Self-register** — `POST /api/auth/register` (or the "Create an account" link in
  the UI). Self-registered accounts are always created with the `viewer` role, which
  can browse and search but not create/edit/delete.
- **Seeded admin** — on first startup the backend creates one admin account and
  prints its credentials to the console:
  `admin@helmsman.local` / `ChangeMe123!`. Change this password (or promote a user
  to `admin` directly in the database) before deploying anywhere real.

The frontend stores the JWT in `localStorage` and attaches it to every request;
an expired/invalid token bounces the app back to the login screen.

## Database migrations (Alembic)

Migrations are the source of truth for the schema (Phase 1's `create_all` has been
retired). They run automatically on app startup, but you can also drive them manually
from the `backend/` directory:

```bash
alembic upgrade head                          # apply all migrations
alembic downgrade -1                           # roll back the last migration
alembic history --verbose                      # show the revision chain
alembic revision --autogenerate -m "message"   # scaffold a new migration from model changes
```

The revision chain: `0001_initial` (vessels) → `0002_voyages_cargo` (voyages + cargo)
→ `0003_users` (auth).

**Upgrading from the Phase 1 POC?** If you already ran Phase 1 you may have a local
`helmsman.db` whose `vessels` table was created before Alembic existed. Startup handles
this automatically: it stamps that database at the `0001_initial` baseline and then
applies `0002_voyages_cargo`, adding the new tables **without touching your existing
vessel rows**. (`helmsman.db` is gitignored and only holds seed data, so deleting it for
a clean slate is also fine.)

## Switching to Azure SQL (Phase 5)
1. Create the free Azure SQL database (set free-limit behavior to **Auto-pause**).
2. Add its outbound-friendly firewall rule for your backend host.
3. Set `DATABASE_URL` (see `backend/.env.example`) — no code changes needed. Alembic
   and the app both read it, and migrations run against Azure SQL the same way.
   The included `backend/Dockerfile` installs ODBC Driver 18 for you.

## API
All routes below except `/api/health`, `/api/auth/register` and `/api/auth/login`
require `Authorization: Bearer <token>`.

| Method | Path                | Description                                                   |
|--------|---------------------|--------------------------------------------------------------|
| GET    | /api/health         | Health check                                                 |
| POST   | /api/auth/register  | Create an account (always role `viewer`)                     |
| POST   | /api/auth/login     | Log in, returns a JWT + the current user                     |
| GET    | /api/auth/me        | Get the current authenticated user                            |
| GET    | /api/stats          | Fleet-wide aggregate counts (Dashboard tab)                   |
| GET    | /api/vessels        | List vessels (`search`, `status`, `skip`, `limit`)           |
| GET    | /api/vessels/{id}   | Get one vessel                                                |
| POST   | /api/vessels        | Create vessel                                                |
| PUT    | /api/vessels/{id}   | Update vessel                                                 |
| DELETE | /api/vessels/{id}   | Delete vessel (cascades to its voyages + cargo)              |
| GET    | /api/voyages        | List voyages (`search`, `status`, `vessel_id`, `skip`, `limit`) |
| GET    | /api/voyages/{id}   | Get one voyage                                                |
| POST   | /api/voyages        | Create voyage (validates `vessel_id`)                        |
| PUT    | /api/voyages/{id}   | Update voyage                                                 |
| DELETE | /api/voyages/{id}   | Delete voyage (cascades to its cargo)                        |
| GET    | /api/cargo          | List cargo (`search`, `cargo_type`, `voyage_id`, `skip`, `limit`) |
| GET    | /api/cargo/{id}     | Get one cargo item                                           |
| POST   | /api/cargo          | Create cargo (validates `voyage_id`)                        |
| PUT    | /api/cargo/{id}     | Update cargo                                                  |
| DELETE | /api/cargo/{id}     | Delete cargo                                                  |

Voyage responses embed a compact `vessel` summary and a `cargo_count`; cargo responses
embed a compact `voyage` summary.

## Roadmap
- [x] **Phase 1 — POC:** Vessel CRUD end-to-end
- [x] **Phase 2 — Data model:** Voyages + Cargo with FK relationships & cascade deletes; Alembic migrations; UI search / filter / pagination
- [x] **Phase 3 — Auth:** JWT login + role-based access (admin / viewer)
- [x] **Phase 4 — UX:** dashboard stats/charts, form validation, responsive polish
- [ ] **Phase 5 — Cloud + CI/CD:** Azure SQL, deploy backend + frontend, CI/CD pipeline (Azure DevOps or GitHub Actions)
