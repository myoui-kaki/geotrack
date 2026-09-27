"""seed.py — populate geotrack.db with sample data. Run once: python seed.py"""
from database import SessionLocal, engine, Base
import models
from auth import hash_password
from datetime import datetime

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if db.query(models.User).count() == 0:
    juan  = models.User(full_name="Juan Dela Cruz",  email="0323-4198@lspu.edu.ph", hashed_password=hash_password("Student1!"),  role="student",    course_section="BSIT-3A", gender="male",   is_email_verified=True)
    maria = models.User(full_name="Maria Santos",    email="0421-5512@lspu.edu.ph", hashed_password=hash_password("Student1!"),  role="student",    course_section="BSIT-3A", gender="female", is_email_verified=True)
    pedro = models.User(full_name="Pedro Bautista",  email="0318-7743@lspu.edu.ph", hashed_password=hash_password("Student1!"),  role="student",    course_section="BSIT-2B", gender="male",   is_email_verified=True)
    admin = models.User(full_name="Ms. Reyes",       email="reyes.osas@lspu.edu.ph",hashed_password=hash_password("OsasAdmin1!"),role="osas_admin", position="OSAS Head",     is_email_verified=True)
    brgy  = models.User(full_name="Brgy. Del Remedio Liaison", email="brgy.delremedio@geotrack.local", hashed_password=hash_password("Brgy2026!"), role="barangay", barangay_name="Brgy. Del Remedio", contact_number="0917-234-5678", is_email_verified=True)
    db.add_all([juan, maria, pedro, admin, brgy]); db.commit()

    # Boarding houses in Brgy. Del Remedio, sourced from OSAS's own
    # Boarders Information Sheet / Dormitories & Boarding House Monitoring
    # Form / student housing survey - landlord/business-level contact info
    # only (no individual student personal data). This barangay is the one
    # participating in the permit-verification workflow, so some are shown
    # already verified (permit confirmed) and some pending, to demonstrate
    # the feature end to end.
    h1 = models.BoardingHouse(name="Sto. Niño Lodge",       barangay="Brgy. Del Remedio", monthly_rate=1800, latitude=14.0712, longitude=121.3204, is_verified=True,  has_barangay_permit=True,  submitted_by="Student — Juan Dela Cruz", contact_person="Melba Belen",   contact_number="0917-503-4490")
    h2 = models.BoardingHouse(name="Green Haven Dorm",       barangay="Brgy. San Benito",  monthly_rate=2000, latitude=14.0651, longitude=121.3281, is_verified=False, has_barangay_permit=False, submitted_by="Student — Pedro Bautista")
    h3 = models.BoardingHouse(name="Pamela's Place",         barangay="Brgy. Balayhangin", monthly_rate=1500, latitude=14.0723, longitude=121.3177, is_verified=False, has_barangay_permit=False, submitted_by="Student — Maria Santos")
    h4 = models.BoardingHouse(name="Forcastle Bldg.",        barangay="Brgy. Del Remedio", monthly_rate=1600, latitude=14.0708, longitude=121.3219, is_verified=True,  has_barangay_permit=True,  submitted_by="OSAS monitoring form", contact_person="Divina Briones", contact_number="0908-899-3593")
    h5 = models.BoardingHouse(name="Mhar & Digna Eatery",    barangay="Brgy. Del Remedio", monthly_rate=1500, latitude=14.0715, longitude=121.3196, is_verified=False, has_barangay_permit=False, submitted_by="OSAS monitoring form", contact_person="Digna Badillo",  contact_number="0999-142-2919")
    h6 = models.BoardingHouse(name="Loteria's Dormitory",    barangay="Brgy. Del Remedio", monthly_rate=1700, latitude=14.0699, longitude=121.3211, is_verified=False, has_barangay_permit=False, submitted_by="OSAS housing survey", contact_person="Elmer Loteria", contact_number="0961-783-8674")
    h7 = models.BoardingHouse(name="Doyie Loteria's Boarding House", barangay="Brgy. Del Remedio", monthly_rate=1650, latitude=14.0721, longitude=121.3188, is_verified=True, has_barangay_permit=True, submitted_by="OSAS housing survey", contact_person="Doyie Loteria", contact_number="0929-418-8814")
    db.add_all([h1, h2, h3, h4, h5, h6, h7]); db.commit()

    month = datetime.utcnow().strftime("%B %Y")
    db.add_all([
        models.Review(boarding_house_id=h1.id, author_id=juan.id,  rating=5, text="Maayos ang water supply at malapit lang sa campus."),
        models.Review(boarding_house_id=h1.id, author_id=maria.id, rating=4, text="Sulit sa price, pero medyo maingay tuwing weekend."),
        models.Review(boarding_house_id=h2.id, author_id=pedro.id, rating=4, text="Malinis at secure, may CCTV sa gate."),
        models.StatusUpdate(student_id=juan.id,  boarding_house_id=h1.id, status_type="same", month_label=month),
        models.StatusUpdate(student_id=maria.id, boarding_house_id=h3.id, status_type="same", month_label=month),
        models.StatusUpdate(student_id=pedro.id, boarding_house_id=h2.id, status_type="same", month_label=month, is_flagged=True, flag_reason="No update for 2 months prior"),
        models.AuditLog(actor_name="System", actor_role="system", action="create", resource_type="user", resource_label="Seed data", detail="Initial seed data created"),
    ])
    db.commit()
    print("Seed data created:")
    print("  Students:  0323-4198@lspu.edu.ph / Student1!")
    print("             0421-5512@lspu.edu.ph / Student1!")
    print("             0318-7743@lspu.edu.ph / Student1!  (flagged)")
    print("  OSAS:      reyes.osas@lspu.edu.ph / OsasAdmin1!")
    print("  Barangay:  brgy.delremedio@geotrack.local / Brgy2026!")
    print("\n  Note: Passwords are 8–12 chars, uppercase, lowercase, number, special char.")
else:
    print("Database already seeded — skipping.")

db.close()
