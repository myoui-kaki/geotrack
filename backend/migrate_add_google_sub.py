"""
migrate_add_google_sub.py

One-off migration: adds the new `google_sub` column to the existing
`users` table, needed for Google Sign-In. Unlike migrate_add_contact_number.py
(which only ever touched the local geotrack.db file directly), this one goes
through the app's own database.py, so it works against whichever database
the app is actually configured for - the local SQLite file if DATABASE_URL
isn't set, or Railway's PostgreSQL if it is.

Usage:
    # Local SQLite (backend/ folder, venv active):
    python migrate_add_google_sub.py

    # Railway PostgreSQL - run it WITH Railway's environment (so
    # DATABASE_URL is set), e.g. via the Railway CLI:
    railway run python migrate_add_google_sub.py

Safe to run more than once - it checks whether the column already exists
before trying to add it.
"""
from sqlalchemy import inspect, text
from database import engine


def main():
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("users")]

    if "google_sub" in columns:
        print("google_sub already exists on users - nothing to do.")
        return

    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN google_sub VARCHAR"))
    print("Added google_sub column to users.")

    # A plain (non-unique) index is enough here - adding a UNIQUE constraint
    # to an existing table isn't something SQLite supports via ALTER TABLE,
    # and the app already checks for an existing google_sub before setting
    # one, so uniqueness is enforced at the application level.
    with engine.begin() as conn:
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_google_sub ON users (google_sub)"))
    print("Added index on google_sub.")


if __name__ == "__main__":
    main()
