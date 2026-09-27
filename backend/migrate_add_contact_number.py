"""
migrate_add_contact_number.py

One-off migration: adds the new `contact_number` column to the existing
`users` table. SQLAlchemy only creates tables that don't exist yet - it
never ALTERs an existing table to add a new column - so this needs to be
run once against your current geotrack.db before the new Profile pages
will work.

Usage (from the backend/ folder, with your venv active):
    python migrate_add_contact_number.py

Safe to run more than once - it checks whether the column already exists
before trying to add it.
"""
import sqlite3

DB_PATH = "geotrack.db"

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cur.fetchall()]

    if "contact_number" in columns:
        print("contact_number already exists on users - nothing to do.")
    else:
        cur.execute("ALTER TABLE users ADD COLUMN contact_number VARCHAR")
        conn.commit()
        print("Added contact_number column to users.")

    conn.close()

if __name__ == "__main__":
    main()
