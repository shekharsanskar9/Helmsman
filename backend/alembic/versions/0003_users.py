"""users table for JWT auth + role-based access

Revision ID: 0003_users
Revises: 0002_voyages_cargo
Create Date: 2026-09-16

Phase 3: adds the users table backing JWT login. `role` is a plain string
("admin" | "viewer") rather than a DB-level enum, keeping the SQLite / Azure SQL
dual-target story simple (matches how `status` is modeled on vessels/voyages).
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_users"
down_revision = "0002_voyages_cargo"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
