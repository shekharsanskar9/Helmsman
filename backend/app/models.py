from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Boolean, ForeignKey,
)
from sqlalchemy.orm import relationship
from .database import Base


class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)
    imo_number = Column(String(20), unique=True, nullable=False)   # International Maritime Organization number
    vessel_type = Column(String(50), nullable=False)               # Container, Bulk Carrier, Tanker, Ro-Ro
    status = Column(String(20), nullable=False, default="Active")  # Active, In Port, Maintenance, Retired
    capacity_tonnes = Column(Float, nullable=True)
    year_built = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # One vessel -> many voyages. Retiring (deleting) a vessel cascades to its voyages.
    voyages = relationship(
        "Voyage",
        back_populates="vessel",
        cascade="all, delete-orphan",
    )


class Voyage(Base):
    __tablename__ = "voyages"

    id = Column(Integer, primary_key=True, index=True)
    vessel_id = Column(
        Integer, ForeignKey("vessels.id", ondelete="CASCADE"), nullable=False, index=True
    )
    voyage_number = Column(String(30), nullable=False, index=True)
    origin_port = Column(String(120), nullable=False)
    destination_port = Column(String(120), nullable=False)
    departure_date = Column(Date, nullable=True)
    arrival_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="Planned")  # Planned, In Transit, Completed, Cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    vessel = relationship("Vessel", back_populates="voyages")
    # One voyage -> many cargo items. Deleting a voyage cascades to its cargo.
    cargo_items = relationship(
        "Cargo",
        back_populates="voyage",
        cascade="all, delete-orphan",
    )


class Cargo(Base):
    __tablename__ = "cargo"

    id = Column(Integer, primary_key=True, index=True)
    voyage_id = Column(
        Integer, ForeignKey("voyages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    description = Column(String(200), nullable=False)
    cargo_type = Column(String(50), nullable=False)   # Container, Dry Bulk, Liquid Bulk, Refrigerated, Vehicles
    weight_tonnes = Column(Float, nullable=True)
    quantity = Column(Integer, nullable=True)          # e.g. number of containers or units
    hazardous = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    voyage = relationship("Voyage", back_populates="cargo_items")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="viewer")  # admin, viewer
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
