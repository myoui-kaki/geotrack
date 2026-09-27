// src/pages/barangay/BarangayEmergencies.jsx
//
// Read-only: a barangay account is kept aware of emergency alerts from
// students currently living in their barangay, so they can coordinate
// with OSAS or respond directly if needed - but the case itself is still
// owned and logged by OSAS. Each case can be expanded to see exactly
// where the student was when they triggered the alert, with directions.

import { useEffect, useState } from "react";
import { api } from "../../api/client";
import EmergencyLocationMap from "../../components/EmergencyLocationMap";

function StatusPill({ status }) {
  const map = { active:"pending", responding:"pending", resolved:"ok", cancelled:"" };
  return <span className={`badge ${map[status] || ""}`}>{status}</span>;
}

export default function BarangayEmergencies() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.barangay.listEmergencies()
      .then(setCases)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Student emergencies</div>
          <div className="osas-main-sub">
            Emergency alerts from students currently boarding in your barangay. OSAS logs and
            follows up on each case - this view keeps you aware in case local coordination is needed.
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {loading ? <div className="loading-text">Loading...</div>
        : cases.length === 0 ? <div className="review-empty">No emergency alerts from your barangay yet.</div>
        : (
          <table>
            <tbody>
              <tr><th>Student</th><th>Category</th><th>Status</th><th>Reported</th><th></th></tr>
              {cases.map(c => (
                <>
                  <tr key={c.id}>
                    <td>{c.student_name || "Unknown"}</td>
                    <td>{c.category}</td>
                    <td><StatusPill status={c.status} /></td>
                    <td style={{fontSize:12,color:"#6b6457"}}>{new Date(c.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn" style={{fontSize:11.5,padding:"5px 10px"}}
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                        {expandedId === c.id ? "Hide" : "Location"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr key={`${c.id}-loc`}>
                      <td colSpan={5} style={{ background:"#f6f4ee", padding:16 }}>
                        <div className="panel-title" style={{ fontSize:12.5, marginBottom:8 }}>
                          Location when SOS was sent
                        </div>
                        <EmergencyLocationMap latitude={c.latitude} longitude={c.longitude} />
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
