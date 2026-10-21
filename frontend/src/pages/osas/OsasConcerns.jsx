// src/pages/osas/OsasConcerns.jsx
//
// Concerns ARE attributed (unlike reviews) -- OSAS needs the student's
// name and email to actually act on a safety/landlord/maintenance issue.

import { useEffect, useState } from "react";
import { api } from "../../api/client";

const STATUS_OPTIONS = ["open", "in_progress", "resolved"];

export default function OsasConcerns() {
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api.osas
      .allConcerns()
      .then(setConcerns)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleStatusChange(concernId, newStatus) {
    try {
      await api.osas.updateConcernStatus(concernId, newStatus);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Reported concerns</div>
          <div className="osas-main-sub">Safety, landlord, and maintenance issues reported by students.</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : concerns.length === 0 ? (
          <div className="review-empty">No concerns reported yet.</div>
        ) : (
          <table>
            <tbody>
              <tr>
                <th>Student</th>
                <th>Category</th>
                <th>Details</th>
                <th>Documentation</th>
                <th>Status</th>
              </tr>
              {concerns.map((c) => (
                <>
                  <tr key={c.id}>
                    <td>
                      {c.student_name}
                      <div style={{ fontSize: 11, color: "#a39c8a" }}>{c.student_email}</div>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{c.category}</td>
                    <td style={{ maxWidth: 260, fontSize: 12, color: "#544f43" }}>{c.details}</td>
                    <td>
                      {(c.photo_data_url || c.amenities_checklist) ? (
                        <button
                          className="btn"
                          style={{ fontSize:11, padding:"4px 8px", display:"flex", alignItems:"center", gap:6 }}
                          onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        >
                          {c.photo_data_url && (
                            <img src={c.photo_data_url} alt=""
                              style={{ width:24, height:24, objectFit:"cover", borderRadius:4, border:"1px solid var(--line)" }} />
                          )}
                          <span>{expandedId === c.id ? "Hide" : "View"}</span>
                        </button>
                      ) : <span style={{ fontSize:11, color:"#a39c8a" }}>None</span>}
                    </td>
                    <td>
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        style={{ padding: "6px 8px", fontSize: 12 }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr key={`doc-${c.id}`}>
                      <td colSpan={5} style={{ background:"#faf9f5", padding:"10px 12px" }}>
                        {c.amenities_checklist && (
                          <div style={{ marginBottom:8 }}>
                            <strong style={{ fontSize:12.5, color:"#3a352b" }}>Amenities present:</strong>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:6 }}>
                              {c.amenities_checklist.split(",").filter(Boolean).map((a, i) => (
                                <span key={i} className="badge" style={{ background:"#eef3ee", color:"#2f5d4f" }}>
                                  {a.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {c.photo_data_url && (
                          <img src={c.photo_data_url} alt="Boarding house condition"
                            style={{ maxWidth:280, borderRadius:8, border:"1px solid var(--line)" }} />
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
