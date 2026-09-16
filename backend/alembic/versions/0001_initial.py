"""initial baseline: vessels

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-07

Mirrors the Phase 1 POC schema. Split out as its own revision so a database
created before Alembic existed (vessels via create_all, no version table) can be
stamped at this point and then carried forward to the voyages/cargo migration.
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vessels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("imo_number", sa.String(length=20), nullable=False),
        sa.Column("vessel_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("capacity_tonnes", sa.Float(), nullable=True),
        sa.Column("year_built", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("imo_number"),
    )
    op.create_index("ix_vessels_id", "vessels", ["id"])
    op.create_index("ix_vessels_name", "vessels", ["name"])


def downgrade() -> None:
    op.drop_index("ix_vessels_name", table_name="vessels")
    op.drop_index("ix_vessels_id", table_name="vessels")
    op.drop_table("vessels")
