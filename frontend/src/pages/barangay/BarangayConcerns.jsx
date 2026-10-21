// src/pages/barangay/BarangayConcerns.jsx
//
// Read-only: concerns from students currently boarding in this barangay,
// including any photo/amenities documentation the student attached.

import { useEffect, useState } from "react";
import { api } from "../../api/client";

export default function BarangayConcerns() {
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.barangay.listConcerns()
      .then(setConcerns)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Reported concerns</div>
          <div className="osas-main-sub">
            Concerns filed by students currently boarding in your barangay, including any photo
            documentation and amenities checklist they attached.
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {loading ? <div className="loading-text">Loading...</div>
        : concerns.length === 0 ? <div className="review-empty">No reported concerns from your barangay yet.</div>
        : concerns.map(c => (
            <div key={c.id} style={{ padding:"12px 0", borderBottom:"1px solid #ece7da" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <span style={{ fontWeight:700, fontSize:13 }}>{c.category}</span>
                  <span style={{ fontSize:11, color:"#a39c8a", marginLeft:8 }}>
                    {c.student_name} - {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <span className={`badge ${c.status === "resolved" ? "ok" : "pending"}`}>{c.status}</span>
              </div>
              <p style={{ fontSize:12.5, color:"#544f43", marginTop:6 }}>{c.details}</p>
              {(c.photo_data_url || c.amenities_checklist) && (
                <button className="btn" style={{ fontSize:11, padding:"4px 10px", marginTop:4 }}
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  {expandedId === c.id ? "Hide documentation" : "View documentation"}
                </button>
              )}
              {expandedId === c.id && (
                <div style={{ marginTop:8 }}>
                  {c.amenities_checklist && (
                    <div style={{ fontSize:12, color:"#544f43", marginBottom:8 }}>
                      <strong>Amenities present:</strong> {c.amenities_checklist.split(",").join(", ")}
                    </div>
                  )}
                  {c.photo_data_url && (
                    <img src={c.photo_data_url} alt="Boarding house condition"
                      style={{ maxWidth:280, borderRadius:8, border:"1px solid var(--line)" }} />
                  )}
                </div>
              )}
            </div>
        ))}
      </div>
    </>
  );
}
