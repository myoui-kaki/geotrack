// src/pages/student/StudentConcern.jsx
//
// Unlike reviews, concerns are NOT anonymous on the backend -- OSAS needs
// to know who to follow up with. The Concern model stores student_id and
// the /api/osas/concerns endpoint returns student_name/student_email.
//
// A student can optionally attach a photo as proof/context for the
// specific concern being reported (not every concern has something worth
// photographing, so this stays optional). The amenities checklist lives
// on the Status Update page instead, since that's about the boarding
// house's ongoing condition rather than a one-off concern.

import { useEffect, useState } from "react";
import { api } from "../../api/client";

// Keeps the uploaded photo small enough to store as a data URL without a
// separate file-storage service - this project doesn't have one set up.
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

const STATUS_STYLE = {
  open:        { bg: "#fbe4dc", color: "#7a3a23", label: "Open" },
  in_progress: { bg: "#fdeecb", color: "#8a6414", label: "In progress" },
  resolved:    { bg: "#e1f0e6", color: "#2f5d3f", label: "Resolved" },
};

const CATEGORY_LABEL = {
  safety: "Safety concern", landlord: "Landlord issue",
  maintenance: "Maintenance / utilities", other: "Other",
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.open;
  return (
    <span style={{
      display:"inline-block", padding:"3px 10px", borderRadius:999,
      fontSize:11, fontWeight:700, background:s.bg, color:s.color,
    }}>{s.label}</span>
  );
}

export default function StudentConcern() {
  const [category, setCategory] = useState("safety");
  const [details, setDetails] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState(null);

  function loadHistory() {
    api.student.myConcerns().then(setHistory).catch(() => setHistory([]));
  }

  useEffect(() => { loadHistory(); }, []);

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!details.trim()) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await api.student.reportConcern({
        category, details,
        photo_data_url: photoDataUrl || null,
      });
      setSuccess("Your concern has been sent to OSAS.");
      setDetails(""); setPhotoDataUrl(null);
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="student-header">
        <div className="greet">Need help?</div>
        <h2>Report a concern</h2>
      </div>
      <div className="student-body">
        {error && <div className="error-banner">{error}</div>}
        {success && (
          <div className="error-banner" style={{ background: "#e1f0e6", color: "var(--ok)" }}>
            {success}
          </div>
        )}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>What's this about?</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="safety">Safety concern</option>
                <option value="landlord">Landlord issue</option>
                <option value="maintenance">Maintenance / utilities</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field">
              <label>Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the issue..."
                required
              />
            </div>

            <div className="field">
              <label>Photo (optional) - for proof, if there's something to show</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
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

            <button className="btn primary" style={{ width: "100%", padding: 13 }} disabled={submitting}>
              {submitting ? "Sending..." : "Send to OSAS"}
            </button>
          </form>
        </div>

        <div className="card" style={{ marginTop:14 }}>
          <div className="card-title">Your reported concerns</div>
          {history === null ? (
            <p style={{ fontSize:12.5, color:"#6b6457", marginTop:8 }}>Loading...</p>
          ) : history.length === 0 ? (
            <p style={{ fontSize:12.5, color:"#6b6457", marginTop:8 }}>
              You haven't reported anything yet - new and past reports will show up here.
            </p>
          ) : (
            history.map(c => (
              <div key={c.id} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:"1px solid #ece7da" }}>
                {c.photo_data_url && (
                  <img src={c.photo_data_url} alt=""
                    style={{ width:44, height:44, objectFit:"cover", borderRadius:6, border:"1px solid var(--line)", flexShrink:0 }} />
                )}
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                    <div style={{ fontWeight:700, fontSize:12.5 }}>{CATEGORY_LABEL[c.category] || c.category}</div>
                    <StatusPill status={c.status} />
                  </div>
                  <div style={{ fontSize:12, color:"#544f43", marginTop:3 }}>{c.details}</div>
                  <div style={{ fontSize:10.5, color:"#a39c8a", marginTop:3 }}>
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
