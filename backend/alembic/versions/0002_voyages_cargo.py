"""voyages + cargo with foreign-key relationships

Revision ID: 0002_voyages_cargo
Revises: 0001_initial
Create Date: 2026-09-07

Phase 2: adds the two related entities. voyages.vessel_id -> vessels.id and
cargo.voyage_id -> voyages.id, both ON DELETE CASCADE, giving a normalized
vessel -> voyage -> cargo hierarchy.
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_voyages_cargo"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "voyages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vessel_id", sa.Integer(), nullable=False),
        sa.Column("voyage_number", sa.String(length=30), nullable=False),
        sa.Column("origin_port", sa.String(length=120), nullable=False),
        sa.Column("destination_port", sa.String(length=120), nullable=False),
        sa.Column("departure_date", sa.Date(), nullable=True),
        sa.Column("arrival_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["vessel_id"], ["vessels.id"], ondelete="CASCADE", name="fk_voyages_vessel_id",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_voyages_id", "voyages", ["id"])
    op.create_index("ix_voyages_vessel_id", "voyages", ["vessel_id"])
    op.create_index("ix_voyages_voyage_number", "voyages", ["voyage_number"])

    op.create_table(
        "cargo",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("voyage_id", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(length=200), nullable=False),
        sa.Column("cargo_type", sa.String(length=50), nullable=False),
        sa.Column("weight_tonnes", sa.Float(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=True),
        sa.Column("hazardous", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["voyage_id"], ["voyages.id"], ondelete="CASCADE", name="fk_cargo_voyage_id",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cargo_id", "cargo", ["id"])
    op.create_index("ix_cargo_voyage_id", "cargo", ["voyage_id"])


def downgrade() -> None:
    op.drop_index("ix_cargo_voyage_id", table_name="cargo")
    op.drop_index("ix_cargo_id", table_name="cargo")
    op.drop_table("cargo")
    op.drop_index("ix_voyages_voyage_number", table_name="voyages")
    op.drop_index("ix_voyages_vessel_id", table_name="voyages")
    op.drop_index("ix_voyages_id", table_name="voyages")
    op.drop_table("voyages")
