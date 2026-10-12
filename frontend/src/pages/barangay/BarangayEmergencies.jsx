// src/pages/barangay/BarangayEmergencies.jsx
//
// Read-only: a barangay account sees emergency alerts from students currently
// living in their barangay the moment they are raised (open cases first), so
// they can coordinate with OSAS or respond directly if needed - but the case
// itself is still owned and logged by OSAS. When the student chose to share
// their location it is shown on a map right away for open cases, with directions.

import { Fragment, useEffect, useState } from "react";
import { api } from "../../api/client";
import EmergencyLocationMap from "../../components/EmergencyLocationMap";

const OPEN = ["Active", "Responding"];

function StatusPill({ status }) {
  const map = { active:"pending", responding:"pending", resolved:"ok", cancelled:"" };
  return <span className={`badge ${map[(status || "").toLowerCase()] || ""}`}>{status}</span>;
}

export default function BarangayEmergencies() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Per-case override of the default (open cases with a location start expanded).
  const [toggled, setToggled] = useState({});

  useEffect(() => {
    let alive = true;
    const load = (silent) => api.barangay.listEmergencies()
      .then(d => { if (alive) { setCases(d); setError(""); } })
      .catch(err => { if (alive && !silent) setError(err.message); })
      .finally(() => { if (alive && !silent) setLoading(false); });
    load(false);
    const t = setInterval(() => { if (document.visibilityState === "visible") load(true); }, 10000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const expanded = (c) => (c.id in toggled ? toggled[c.id] : OPEN.includes(c.status) && c.latitude != null);
  const flip = (c) => setToggled(t => ({ ...t, [c.id]: !expanded(c) }));
  const openCount = cases.filter(c => OPEN.includes(c.status)).length;

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Student emergencies</div>
          <div className="osas-main-sub">
            Emergency alerts from students currently boarding in your barangay appear here as soon as they
            are raised. OSAS logs and follows up on each case - this view keeps you aware in case local
            coordination is needed.
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {openCount > 0 && (
        <div className="error-banner" style={{ marginBottom:14 }}>
          🚨 {openCount} open emergency alert{openCount > 1 ? "s" : ""} in your barangay.
        </div>
      )}

      <div className="card">
        {loading ? <div className="loading-text">Loading...</div>
        : cases.length === 0 ? <div className="review-empty">No emergency alerts from your barangay yet.</div>
        : (
          <table>
            <tbody>
              <tr><th>Student</th><th>Category</th><th>Status</th><th>Reported</th><th></th></tr>
              {cases.map(c => (
                <Fragment key={c.id}>
                  <tr>
                    <td>{c.student_name || "Unknown"}</td>
                    <td>{c.category}</td>
                    <td><StatusPill status={c.status} /></td>
                    <td style={{fontSize:12,color:"#6b6457"}}>{new Date(c.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn" style={{fontSize:11.5,padding:"5px 10px"}} onClick={() => flip(c)}>
                        {expanded(c) ? "Hide" : "📍 Location"}
                      </button>
                    </td>
                  </tr>
                  {expanded(c) && (
                    <tr>
                      <td colSpan={5} style={{ background:"#f6f4ee", padding:16 }}>
                        {c.details && (
                          <div style={{ fontSize:12.5, color:"#544f43", marginBottom:12 }}>
                            <strong>Student's note:</strong> {c.details}
                          </div>
                        )}
                        <div className="panel-title" style={{ fontSize:12.5, marginBottom:8 }}>
                          Location shared by the student
                        </div>
                        <EmergencyLocationMap latitude={c.latitude} longitude={c.longitude} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
