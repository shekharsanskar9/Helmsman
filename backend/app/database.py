import os
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Local dev defaults to SQLite so the POC runs with zero setup.
# Swap to Azure SQL (SQL Server) later by setting DATABASE_URL (see .env.example).
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./helmsman.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
# pool_pre_ping avoids stale-connection errors when Azure SQL serverless resumes from auto-pause.
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)


# SQLite ignores foreign keys unless told otherwise, per connection. Turning the
# pragma on keeps the Phase 2 normalized schema honest locally — orphan voyages or
# cargo are rejected, matching the referential integrity Azure SQL enforces by default.
if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(Engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
