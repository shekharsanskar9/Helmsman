import os
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect

from .database import engine, SessionLocal
from . import models
from .auth import hash_password
from .routers import vessels, voyages, cargo, auth as auth_router, stats

BACKEND_DIR = Path(__file__).resolve().parent.parent  # .../backend


def run_migrations():
    """Bring the database to the latest Alembic revision on startup.

    This replaces Phase 1's Base.metadata.create_all — migrations are now the
    single source of truth for the schema, while keeping the 'just run uvicorn'
    experience. A database created before Alembic (Phase 1 POC: vessels made via
    create_all, no version table) is stamped at the baseline first so we don't try
    to recreate the existing table, then carried forward to the voyages/cargo
    revision.
    """
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))

    tables = set(inspect(engine).get_table_names())
    if "alembic_version" not in tables and "vessels" in tables:
        command.stamp(cfg, "0001_initial")
    command.upgrade(cfg, "head")


def seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(models.Vessel).count() == 0:
            nordic = models.Vessel(name="MV Nordic Star", imo_number="9321483",
                                   vessel_type="Container", status="Active",
                                   capacity_tonnes=85000, year_built=2015)
            bengal = models.Vessel(name="MV Bengal Trader", imo_number="9456712",
                                   vessel_type="Bulk Carrier", status="In Port",
                                   capacity_tonnes=63000, year_built=2011)
            arabian = models.Vessel(name="MT Arabian Pearl", imo_number="9588234",
                                    vessel_type="Tanker", status="Maintenance",
                                    capacity_tonnes=110000, year_built=2018)
            db.add_all([nordic, bengal, arabian])
            db.flush()  # assign vessel ids for the voyage foreign keys

            v1 = models.Voyage(vessel_id=nordic.id, voyage_number="NS-2409",
                               origin_port="Rotterdam", destination_port="Singapore",
                               departure_date=date(2024, 9, 1), arrival_date=date(2024, 9, 24),
                               status="In Transit")
            v2 = models.Voyage(vessel_id=bengal.id, voyage_number="BT-2412",
                               origin_port="Chittagong", destination_port="Jebel Ali",
                               departure_date=date(2024, 12, 3), arrival_date=None,
                               status="Planned")
            db.add_all([v1, v2])
            db.flush()  # assign voyage ids for the cargo foreign keys

            db.add_all([
                models.Cargo(voyage_id=v1.id, description="Consumer electronics",
                             cargo_type="Container", weight_tonnes=1200, quantity=480,
                             hazardous=False),
                models.Cargo(voyage_id=v1.id, description="Lithium battery units",
                             cargo_type="Container", weight_tonnes=90, quantity=24,
                             hazardous=True),
                models.Cargo(voyage_id=v2.id, description="Raw jute bales",
                             cargo_type="Dry Bulk", weight_tonnes=5400, quantity=None,
                             hazardous=False),
            ])
            db.commit()
    finally:
        db.close()


DEFAULT_ADMIN_EMAIL = "admin@helmsman.local"
DEFAULT_ADMIN_PASSWORD = "ChangeMe123!"


def seed_admin_if_empty():
    """Create one admin account on first run so the app is usable immediately
    (Phase 3: every route now requires login). Self-registration only ever
    creates "viewer" accounts, so this is the only way an admin exists locally
    unless someone promotes a user directly in the database."""
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            admin = models.User(
                email=DEFAULT_ADMIN_EMAIL,
                hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
                role="admin",
            )
            db.add(admin)
            db.commit()
            print(
                f"[helmsman] Seeded default admin — email: {DEFAULT_ADMIN_EMAIL}  "
                f"password: {DEFAULT_ADMIN_PASSWORD}  (change this in production)"
            )
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()   # Alembic owns the schema (Phase 2; was create_all in Phase 1)
    seed_if_empty()
    seed_admin_if_empty()
    yield


app = FastAPI(title="Helmsman API", version="0.2.0", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(stats.router)
app.include_router(vessels.router)
app.include_router(voyages.router)
app.include_router(cargo.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
