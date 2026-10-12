// src/pages/student/StudentStatus.jsx
//
// Monthly check-in form. When the student selects "transferred", two
// extra fields appear asking where they moved to -- this mirrors the
// backend's StatusUpdateCreate schema, which requires
// new_boarding_house_name whenever status_type is "transferred".
//
// The amenities checklist + boarding house photo live here (not on the
// Concerns page) since they document the ongoing condition of wherever
// the student currently boards. Both are required every month the
// student is still reporting a boarding house ("same" or "transferred") -
// not required for "moved_home" since there's no boarding house left to
// document. Once a student has submitted for the current month, the form
// is replaced with a confirmation - it reopens automatically next month.
// Past entries can still be edited or deleted from the list below.

import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import MonthCalendar, { monthLabel } from "../../components/MonthCalendar";
import CalendarPopover from "../../components/CalendarPopover";
import PinDropMap from "../../components/PinDropMap";

async function geocode(address) {
  const q = `${address}, San Pablo City, Laguna, Philippines`;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!res.ok) throw new Error("Address lookup failed.");
  const data = await res.json();
  return data.length ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
}

const now = new Date();

const CURRENT_MONTH = now.toLocaleString("en-US", {
  month: "long",
  year: "numeric",
});

const AMENITIES = [
  "Electricity", "Water supply", "Internet/Wifi", "CCTV",
  "Fire extinguisher", "Working locks", "Ventilation", "Kitchen access",
];

const MAX_PHOTO_DIMENSION = 1000;
const JPEG_QUALITY = 0.7;

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read the photo."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_PHOTO_DIMENSION) {
          height = Math.round((height * MAX_PHOTO_DIMENSION) / width); width = MAX_PHOTO_DIMENSION;
        } else if (height > MAX_PHOTO_DIMENSION) {
          width = Math.round((width * MAX_PHOTO_DIMENSION) / height); height = MAX_PHOTO_DIMENSION;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// A calendar dropdown for browsing which months have already been
// submitted - the actual submission always targets the real current
// month (CURRENT_MONTH), this is just a nicer way to see history than a
// plain list.
function MonthDropdown({ pastUpdates }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const btnRef = useRef(null);
  const submittedMonths = new Set(pastUpdates.map(u => u.month_label));
  const viewedLabel = monthLabel(viewYear, viewMonth);

  return (
    <div className="field">
      <label>Current month</label>
      <button ref={btnRef} type="button" className="btn" aria-haspopup="dialog" aria-expanded={open}
        style={{ width:"100%", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}
        onClick={() => setOpen(v => !v)}>
        <span>📅 {CURRENT_MONTH}</span>
        <span style={{ color:"#a39c8a" }}>{open ? "▴" : "▾"}</span>
      </button>
      {/* Rendered in a portal so it can't be clipped or covered by the cards around it. */}
      <CalendarPopover open={open} onClose={() => setOpen(false)} anchorRef={btnRef}>
        <MonthCalendar year={viewYear} month={viewMonth} onSelect={(y,m) => { setViewYear(y); setViewMonth(m); }} />
        <div style={{ marginTop:8, fontSize:12, color: submittedMonths.has(viewedLabel) ? "var(--ok)" : "#a39c8a" }}>
          {viewedLabel}{viewedLabel === CURRENT_MONTH ? " (this month)" : ""}
          {submittedMonths.has(viewedLabel) && " - already submitted"}
        </div>
        <button type="button" className="btn" style={{ width:"100%", marginTop:10, fontSize:12 }}
          onClick={() => setOpen(false)}>Done</button>
      </CalendarPopover>
    </div>
  );
}

// Inline edit form for a past entry. Reuses the same documentation rules
// as the main form: photo + amenities required unless "moved_home".
function EditUpdateForm({ update, onCancel, onSaved, onError }) {
  const [statusType, setStatusType] = useState(update.status_type);
  const [newBoardingHouseName, setNewBoardingHouseName] = useState(update.new_boarding_house_name || "");
  const [newBarangay, setNewBarangay] = useState(update.new_barangay || "");
  const [note, setNote] = useState(update.note || "");
  const [amenities, setAmenities] = useState(update.amenities_checklist ? update.amenities_checklist.split(",") : []);
  const [photoDataUrl, setPhotoDataUrl] = useState(update.photo_data_url || null);
  const [photoError, setPhotoError] = useState("");
  const [saving, setSaving] = useState(false);

  const showDocumentation = statusType !== "moved_home";

  function toggleAmenity(name) {
    setAmenities(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    try {
      setPhotoDataUrl(await resizeImageFile(file));
    } catch (err) {
      setPhotoError(err.message);
    }
  }

  async function handleSave() {
    if (showDocumentation && !photoDataUrl) {
      onError("A photo of your boarding house is required before saving this update.");
      return;
    }
    if (showDocumentation && amenities.length === 0) {
      onError("Please check off the amenities available at your boarding house before saving this update.");
      return;
    }
    if (!window.confirm(`Save changes to your ${update.month_label} update?`)) return;
    setSaving(true);
    try {
      await api.student.updateStatusUpdate(update.id, {
        status_type: statusType,
        new_boarding_house_name: statusType === "transferred" ? newBoardingHouseName : null,
        new_barangay: statusType === "transferred" ? newBarangay : null,
        note: note || null,
        photo_data_url: showDocumentation ? photoDataUrl : null,
        amenities_checklist: showDocumentation ? amenities : null,
      });
      onSaved();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
      <div className="field">
        <select value={statusType} onChange={(e) => setStatusType(e.target.value)}>
          <option value="same">Still at the same boarding house</option>
          <option value="transferred">Transferred to a new boarding house</option>
          <option value="moved_home">Moved back home / no longer off-campus</option>
        </select>
      </div>

      {statusType === "transferred" && (
        <>
          <div className="field">
            <label>New boarding house name</label>
            <input value={newBoardingHouseName} onChange={(e) => setNewBoardingHouseName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Barangay / address</label>
            <input value={newBarangay} onChange={(e) => setNewBarangay(e.target.value)} required />
          </div>
        </>
      )}

      {showDocumentation && (
        <>
          <div className="field">
            <label>Photo of the boarding house</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {photoError && <div style={{ color:"var(--pin)", fontSize:11, marginTop:4 }}>{photoError}</div>}
            {photoDataUrl && (
              <img src={photoDataUrl} alt="Preview" style={{ maxWidth:160, borderRadius:8, border:"1px solid var(--line)", marginTop:8 }} />
            )}
          </div>
          <div className="field">
            <label>Amenities available here</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px" }}>
              {AMENITIES.map(name => (
                <label key={name} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, fontWeight:400 }}>
                  <input type="checkbox" checked={amenities.includes(name)} onChange={() => toggleAmenity(name)} style={{ width:14, height:14 }} />
                  <span>{name}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="field">
        <label>Note (optional)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button className="btn primary" style={{ flex:1 }} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  );
}

export default function StudentStatus() {
  const [statusType, setStatusType] = useState("same");
  const [autoDefaulted, setAutoDefaulted] = useState(false);
  const [newBoardingHouseName, setNewBoardingHouseName] = useState("");
  const [newBarangay, setNewBarangay] = useState("");
  const [newLat, setNewLat] = useState(null);
  const [newLng, setNewLng] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [note, setNote] = useState("");
  const [amenities, setAmenities] = useState([]);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [photoError, setPhotoError] = useState("");

  const [pastUpdates, setPastUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadUpdates();
  }, []);

  // A student with NO status update history yet has nothing to be "still
  // the same" as - defaulting the dropdown to "same" for them meant the
  // boarding-house name/location fields never even appeared, so they'd
  // submit with no boarding house at all and the home map would stay
  // empty forever with no indication anything was wrong. Default
  // first-timers straight to "transferred" instead, so the fields they
  // actually need are visible from the start. Only runs once, right after
  // the initial load, so it never overrides a choice the student already made.
  useEffect(() => {
    if (!loading && !autoDefaulted) {
      if (pastUpdates.length === 0) setStatusType("transferred");
      setAutoDefaulted(true);
    }
  }, [loading, pastUpdates, autoDefaulted]);

  async function loadUpdates() {
    setLoading(true);
    try {
      const data = await api.student.myStatusUpdates();
      setPastUpdates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Photo + amenities are required every month for "same" or
  // "transferred" - only "moved_home" skips them, since there's no
  // boarding house left to document.
  const showDocumentation = statusType !== "moved_home";
  const hasSubmittedThisMonth = !loading && pastUpdates.some(u => u.month_label === CURRENT_MONTH);

  function toggleAmenity(name) {
    setAmenities(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    try {
      setPhotoDataUrl(await resizeImageFile(file));
    } catch (err) {
      setPhotoError(err.message);
    }
  }

  async function handleFindLocation() {
    if (!newBarangay.trim()) { setGeocodeError("Enter at least a barangay first."); return; }
    setGeocoding(true); setGeocodeError("");
    try {
      const addr = newBoardingHouseName.trim()
        ? `${newBoardingHouseName}, ${newBarangay}` : newBarangay;
      const res = await geocode(addr);
      if (!res) setGeocodeError("Address not found - tap the map below to drop the pin yourself instead.");
      else { setNewLat(res.lat); setNewLng(res.lng); }
    } catch (err) { setGeocodeError(err.message); }
    finally { setGeocoding(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (showDocumentation && !photoDataUrl) {
      setError("A photo of your boarding house is required before this update can be submitted.");
      return;
    }
    if (showDocumentation && amenities.length === 0) {
      setError("Please check off the amenities available at your boarding house before submitting this update.");
      return;
    }
    const confirmMessage = statusType === "transferred"
      ? `Submit this update for ${CURRENT_MONTH}? You're reporting a transfer to ${newBoardingHouseName || "a new boarding house"}.`
      : statusType === "moved_home"
      ? `Submit this update for ${CURRENT_MONTH}? You're reporting that you've moved back home.`
      : `Submit this update for ${CURRENT_MONTH}? You're confirming you're still at the same boarding house.`;
    if (!window.confirm(confirmMessage)) return;

    setSubmitting(true);
    try {
      await api.student.submitStatusUpdate({
        status_type: statusType,
        new_boarding_house_name: statusType === "transferred" ? newBoardingHouseName : null,
        new_barangay: statusType === "transferred" ? newBarangay : null,
        new_boarding_house_latitude: statusType === "transferred" ? newLat : null,
        new_boarding_house_longitude: statusType === "transferred" ? newLng : null,
        note: note || null,
        month_label: CURRENT_MONTH,
        photo_data_url: showDocumentation ? (photoDataUrl || null) : null,
        amenities_checklist: showDocumentation && amenities.length ? amenities : null,
      });
      setSuccess(`Update for ${CURRENT_MONTH} submitted.`);
      setNote("");
      setNewBoardingHouseName("");
      setNewBarangay("");
      setNewLat(null);
      setNewLng(null);
      setAmenities([]);
      setPhotoDataUrl(null);
      loadUpdates();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUpdate(updateId) {
    if (!window.confirm("Delete this status update? This cannot be undone.")) return;
    try {
      await api.student.deleteStatusUpdate(updateId);
      loadUpdates();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="student-header">
        <div className="greet">Monthly check-in</div>
        <h2>Status update</h2>
      </div>
      <div className="student-body">
        {error && <div className="error-banner">{error}</div>}
        {success && (
          <div className="error-banner" style={{ background: "#e1f0e6", color: "var(--ok)" }}>
            {success}
          </div>
        )}

        <div className="card" style={{ marginBottom: 14 }}>
          {hasSubmittedThisMonth ? (
            <>
              <div className="card-title">You're all set for {CURRENT_MONTH}</div>
              <p style={{ fontSize:13, color:"#544f43" }}>
                Your monthly check-in, including your boarding house photo and amenities checklist, has been submitted.
                This form will reopen automatically next month. You can still edit or delete this month's entry below.
              </p>
            </>
          ) : (
          <>
          <div className="card-title">This month I am...</div>
          <form onSubmit={handleSubmit}>
            <MonthDropdown pastUpdates={pastUpdates} />

            <div className="field">
              <select value={statusType} onChange={(e) => setStatusType(e.target.value)}>
                <option value="same">Still at the same boarding house</option>
                <option value="transferred">Transferred to a new boarding house</option>
                <option value="moved_home">Moved back home / no longer off-campus</option>
              </select>
            </div>

            {/* These only appear when "transferred" is selected, exactly
                like the static prototype, but now they're real form
                fields wired into the request body. */}
            {statusType === "transferred" && (
              <>
                <div className="field">
                  <label>New boarding house name</label>
                  <input
                    value={newBoardingHouseName}
                    onChange={(e) => setNewBoardingHouseName(e.target.value)}
                    placeholder="e.g. Green Haven Dorm"
                    required
                  />
                </div>
                <div className="field">
                  <label>Barangay / address</label>
                  <input
                    value={newBarangay}
                    onChange={(e) => setNewBarangay(e.target.value)}
                    placeholder="e.g. Brgy. San Benito"
                    required
                  />
                </div>

                <div className="field">
                  <label>Pin the location on the map</label>
                  <button type="button" className="btn" style={{ width: "100%", padding: 10, marginBottom: 8 }}
                    onClick={handleFindLocation} disabled={geocoding || !newBarangay.trim()}>
                    {geocoding ? "Finding location..." : "Find location on map"}
                  </button>
                  {geocodeError && <div style={{ fontSize: 11, color: "var(--pin)", marginBottom: 8 }}>{geocodeError}</div>}
                  <PinDropMap
                    latitude={newLat}
                    longitude={newLng}
                    onChange={({ lat, lng }) => { setNewLat(lat); setNewLng(lng); }}
                  />
                </div>
              </>
            )}

            {showDocumentation && (
              <>
                <div className="field">
                  <label>Photo of the boarding house (required every month)</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} required={!photoDataUrl} />
                  {photoError && <div style={{ color:"var(--pin)", fontSize:11, marginTop:4 }}>{photoError}</div>}
                  {photoDataUrl && (
                    <div style={{ marginTop:8 }}>
                      <img src={photoDataUrl} alt="Preview" style={{ maxWidth:200, borderRadius:8, border:"1px solid var(--line)" }} />
                      <div>
                        <button type="button" className="btn" style={{ fontSize:11, padding:"3px 8px", marginTop:6 }}
                          onClick={() => setPhotoDataUrl(null)}>
                          Remove photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="field">
                  <label>Amenities available here (required every month)</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 16px" }}>
                    {AMENITIES.map(name => (
                      <label key={name} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, fontWeight:400, lineHeight:1.3 }}>
                        <input type="checkbox" checked={amenities.includes(name)} onChange={() => toggleAmenity(name)}
                          style={{ flexShrink:0, width:14, height:14 }} />
                        <span>{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="field">
              <label>Anything OSAS should know? (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. water supply issue, landlord concern..."
              />
            </div>

            <button className="btn primary" style={{ width: "100%", padding: 13 }} disabled={submitting}>
              {submitting ? "Submitting..." : `Submit update for ${CURRENT_MONTH}`}
            </button>
          </form>
          </>
          )}
        </div>

        <div className="card">
          <div className="card-title">Past updates</div>
          {loading ? (
            <div className="loading-text">Loading...</div>
          ) : pastUpdates.length === 0 ? (
            <div className="review-empty">No updates submitted yet.</div>
          ) : (
            pastUpdates.map((u) => (
              editingId === u.id ? (
                <EditUpdateForm
                  key={u.id}
                  update={u}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => { setEditingId(null); loadUpdates(); }}
                  onError={setError}
                />
              ) : (
                <div className="listing-row" key={u.id} style={{ cursor: "default" }}>
                  <div>
                    <div className="listing-name">{u.month_label}</div>
                    <div className="listing-meta">
                      {u.status_type === "same" && "Same boarding house"}
                      {u.status_type === "transferred" && `Transferred to ${u.new_boarding_house_name}`}
                      {u.status_type === "moved_home" && "Moved back home"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={`badge ${u.is_flagged ? "warn" : "ok"}`}>
                      {u.is_flagged ? "Flagged" : "Confirmed"}
                    </span>
                    <button
                      onClick={() => setEditingId(u.id)}
                      style={{ background: "none", border: "none", color: "var(--moss-dark)", fontSize: 11, cursor: "pointer", padding: 0, fontWeight: 700 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUpdate(u.id)}
                      style={{ background: "none", border: "none", color: "var(--pin)", fontSize: 11, cursor: "pointer", padding: 0 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            ))
          )}
        </div>
      </div>
    </>
  );
}
