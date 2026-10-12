# GeoTrack – changes (6 items)

Copy these files over the same paths in your project, then rebuild the frontend (`npm run build`) and restart the backend.
No database changes / migrations needed. `geotrack-changes.patch` has the full diff.

1. Calendar (student status + OSAS month filter): now opens in a floating panel (new `components/CalendarPopover.jsx`) that can't be clipped or covered by the cards. Has a Done button.
2. Emergency -> OSAS and barangay: visible right when raised (open cases first). OSAS and barangay lists auto-refresh every 10s; barangay sidebar shows a count badge. Barangay name matching is now tolerant ("Brgy. Del Remedio" = "Barangay del remedio").
3. Concerns -> barangay: a concern only appears for the barangay once OSAS sets it to **active** (OSAS dropdown now says "active (forward to barangay)"). The barangay gets a notification at that moment.
4. Barangay: Gmail-only (@gmail.com) and a new "Create an account" form on the barangay login page (`POST /api/auth/register/barangay`). New Google barangay sign-ups must also be Gmail.
5. Location: student has a "Share my location with OSAS and my barangay" checkbox, and can share/update it after the alert is sent (`PATCH /api/student/sos/{id}/location`). OSAS ("View map") and barangay (auto-expanded for open cases) see it.
6. Edit profile: boarding house, barangay, landlord name and landlord contact are now editable. (Also fixes the profile showing "not yet reported" right after saving.)
