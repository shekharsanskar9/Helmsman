# ⚓ Helmsman — Fleet Management Dashboard

A full-stack CRUD dashboard for a maritime operator to manage its fleet: track **vessels, voyages, and cargo** carried by each voyage.

Built with **React**, **FastAPI**, **SQLAlchemy**, **SQLite**, and **Alembic**, with JWT-based authentication and role-based access control.

> **Status: Phase 4 — UX**
>
> Includes fleet-wide dashboard statistics and charts, inline form validation, responsive UI, search, filtering, pagination, and JWT authentication with admin/viewer roles.

---

## Architecture

```text
React (Vite) ──HTTP/JSON──► FastAPI ──SQLAlchemy──► SQLite
   frontend/                  backend/              database

   Tabbed UI                  REST API              Relational data
   Vessels                    /vessels              Vessels
   Voyages                    /voyages              Voyages
   Cargo                      /cargo                Cargo
   Dashboard                  /stats                Users
```

---

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* Responsive UI

### Backend

* FastAPI
* Python
* SQLAlchemy
* Pydantic
* JWT Authentication

### Database

* SQLite
* Alembic migrations

### Development

* Git / GitHub
* REST API
* Swagger / OpenAPI

---

## Data Model

The application uses a normalized three-table hierarchy:

```text
Vessels
   │
   │ 1 ─── many
   ▼
Voyages
   │
   │ 1 ─── many
   ▼
Cargo
```

### Vessels

```text
id
name
imo_number
vessel_type
status
capacity_tonnes
year_built
```

### Voyages

```text
id
vessel_id
voyage_number
origin_port
destination_port
departure_date
arrival_date
status
```

### Cargo

```text
id
voyage_id
description
cargo_type
weight_tonnes
quantity
hazardous
```

Foreign-key relationships are enforced between the tables, with cascade deletion from vessels → voyages → cargo.

SQLite foreign-key enforcement is enabled through a database connection hook.

---

## Features

### Fleet Management

* Create, read, update, and delete vessels
* Manage voyages associated with vessels
* Manage cargo associated with voyages
* Foreign-key validation
* Cascade deletion

### Search & Filtering

* Search vessels
* Filter vessels by status
* Search voyages
* Filter voyages by status
* Filter voyages by vessel
* Search cargo
* Filter cargo by type
* Filter cargo by voyage

### Pagination

List endpoints support:

* `skip`
* `limit`

This prevents the frontend from loading the entire dataset at once.

### Dashboard

The dashboard provides fleet-wide statistics and charts through:

```text
GET /api/stats
```

### Authentication

The application uses JWT-based authentication.

Two roles are supported:

* **Admin** — can create, edit, and delete records
* **Viewer** — can browse and search records

JWTs are sent through the HTTP authorization header:

```text
Authorization: Bearer <token>
```

### Form Validation

The frontend performs inline validation on the Add/Edit forms to provide immediate feedback before submitting data to the backend.

### Responsive UI

The interface is designed to work across desktop, tablet, and mobile screen sizes.

---

## Quickstart

The application can be run locally using SQLite without any database server setup.

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd Helmsman
```

### 2. Backend

```bash
cd backend

python -m venv .venv
```

Activate the virtual environment.

**macOS / Linux:**

```bash
source .venv/bin/activate
```

**Windows:**

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

---

## 3. Frontend

Open another terminal:

```bash
cd frontend

npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Set:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## Database Migrations

Database schema changes are managed using **Alembic**.

Run migrations from the `backend/` directory:

```bash
alembic upgrade head
```

Rollback the latest migration:

```bash
alembic downgrade -1
```

View migration history:

```bash
alembic history --verbose
```

Create a new migration:

```bash
alembic revision --autogenerate -m "description"
```

Current migration structure:

```text
0001_initial
      │
      ▼
0002_voyages_cargo
      │
      ▼
0003_users
```

Migrations are applied automatically when the application starts.

---

## Authentication

### Register

```http
POST /api/auth/register
```

Self-registered accounts are assigned the `viewer` role by default.

### Login

```http
POST /api/auth/login
```

The login endpoint returns a JWT and the authenticated user's information.

### Current User

```http
GET /api/auth/me
```

Requires a valid JWT.

---

## API Endpoints

### Health

| Method | Endpoint      | Description  |
| ------ | ------------- | ------------ |
| GET    | `/api/health` | Health check |

### Authentication

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/api/auth/register` | Register a new viewer |
| POST   | `/api/auth/login`    | Login and obtain JWT  |
| GET    | `/api/auth/me`       | Get current user      |

### Dashboard

| Method | Endpoint     | Description           |
| ------ | ------------ | --------------------- |
| GET    | `/api/stats` | Fleet-wide statistics |

### Vessels

| Method | Endpoint            | Description   |
| ------ | ------------------- | ------------- |
| GET    | `/api/vessels`      | List vessels  |
| GET    | `/api/vessels/{id}` | Get vessel    |
| POST   | `/api/vessels`      | Create vessel |
| PUT    | `/api/vessels/{id}` | Update vessel |
| DELETE | `/api/vessels/{id}` | Delete vessel |

Supported query parameters:

```text
search
status
skip
limit
```

### Voyages

| Method | Endpoint            | Description   |
| ------ | ------------------- | ------------- |
| GET    | `/api/voyages`      | List voyages  |
| GET    | `/api/voyages/{id}` | Get voyage    |
| POST   | `/api/voyages`      | Create voyage |
| PUT    | `/api/voyages/{id}` | Update voyage |
| DELETE | `/api/voyages/{id}` | Delete voyage |

Supported query parameters:

```text
search
status
vessel_id
skip
limit
```

### Cargo

| Method | Endpoint          | Description    |
| ------ | ----------------- | -------------- |
| GET    | `/api/cargo`      | List cargo     |
| GET    | `/api/cargo/{id}` | Get cargo item |
| POST   | `/api/cargo`      | Create cargo   |
| PUT    | `/api/cargo/{id}` | Update cargo   |
| DELETE | `/api/cargo/{id}` | Delete cargo   |

Supported query parameters:

```text
search
cargo_type
voyage_id
skip
limit
```

---

## API Response Relationships

Voyage responses include a compact vessel summary and cargo count.

Example:

```json
{
  "id": 1,
  "voyage_number": "VOY-001",
  "vessel": {
    "id": 1,
    "name": "Ocean Explorer"
  },
  "cargo_count": 3
}
```

Cargo responses include a compact voyage summary.

This allows the frontend to display useful relationship information without making additional requests for every row.

---

## Project Structure

```text
Helmsman/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── vessels.py
│   │   │   ├── voyages.py
│   │   │   └── cargo.py
│   │   │
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── database/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## Development Phases

* [x] **Phase 1 — POC:** Vessel CRUD end-to-end
* [x] **Phase 2 — Data Model:** Voyages + Cargo, relationships, cascade deletes, Alembic migrations, search, filtering, and pagination
* [x] **Phase 3 — Authentication:** JWT login and role-based access control
* [x] **Phase 4 — UX:** Dashboard statistics/charts, form validation, and responsive UI

---

## License

This project is developed as a portfolio/full-stack engineering project.
