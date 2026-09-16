from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ───────────────────────── Vessel ─────────────────────────
class VesselBase(BaseModel):
    name: str
    imo_number: str
    vessel_type: str
    status: str = "Active"
    capacity_tonnes: Optional[float] = None
    year_built: Optional[int] = None


class VesselCreate(VesselBase):
    pass


class VesselUpdate(BaseModel):
    name: Optional[str] = None
    imo_number: Optional[str] = None
    vessel_type: Optional[str] = None
    status: Optional[str] = None
    capacity_tonnes: Optional[float] = None
    year_built: Optional[int] = None


class VesselOut(VesselBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class VesselPage(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[VesselOut]


# ─────────── Lightweight nested views (avoid heavy/circular payloads) ───────────
class VesselMini(BaseModel):
    id: int
    name: str
    imo_number: str
    model_config = ConfigDict(from_attributes=True)


class VoyageMini(BaseModel):
    id: int
    voyage_number: str
    origin_port: str
    destination_port: str
    model_config = ConfigDict(from_attributes=True)


# ───────────────────────── Voyage ─────────────────────────
class VoyageBase(BaseModel):
    vessel_id: int
    voyage_number: str
    origin_port: str
    destination_port: str
    departure_date: Optional[date] = None
    arrival_date: Optional[date] = None
    status: str = "Planned"


class VoyageCreate(VoyageBase):
    pass


class VoyageUpdate(BaseModel):
    vessel_id: Optional[int] = None
    voyage_number: Optional[str] = None
    origin_port: Optional[str] = None
    destination_port: Optional[str] = None
    departure_date: Optional[date] = None
    arrival_date: Optional[date] = None
    status: Optional[str] = None


class VoyageOut(VoyageBase):
    id: int
    created_at: datetime
    vessel: Optional[VesselMini] = None   # parent vessel summary
    cargo_count: int = 0                  # how many cargo items ride on this voyage
    model_config = ConfigDict(from_attributes=True)


class VoyagePage(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[VoyageOut]


# ───────────────────────── Cargo ─────────────────────────
class CargoBase(BaseModel):
    voyage_id: int
    description: str
    cargo_type: str
    weight_tonnes: Optional[float] = None
    quantity: Optional[int] = None
    hazardous: bool = False


class CargoCreate(CargoBase):
    pass


class CargoUpdate(BaseModel):
    voyage_id: Optional[int] = None
    description: Optional[str] = None
    cargo_type: Optional[str] = None
    weight_tonnes: Optional[float] = None
    quantity: Optional[int] = None
    hazardous: Optional[bool] = None


class CargoOut(CargoBase):
    id: int
    created_at: datetime
    voyage: Optional[VoyageMini] = None   # parent voyage summary
    model_config = ConfigDict(from_attributes=True)


class CargoPage(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[CargoOut]


# ───────────────────────── Stats ─────────────────────────
class VesselStats(BaseModel):
    total: int
    by_status: dict[str, int]


class VoyageStats(BaseModel):
    total: int
    by_status: dict[str, int]


class CargoStats(BaseModel):
    total: int
    by_type: dict[str, int]
    total_weight_tonnes: float
    hazardous_count: int


class StatsOut(BaseModel):
    vessels: VesselStats
    voyages: VoyageStats
    cargo: CargoStats


# ───────────────────────── Auth ─────────────────────────
class UserCreate(BaseModel):
    email: str
    password: str
    # No `role` field: self-registration always lands as "viewer" (see
    # routers/auth.py). Admin accounts only exist via the seeded default.


class UserOut(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
