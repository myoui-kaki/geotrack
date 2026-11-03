// src/pages/barangay/BarangayBoardingHouses.jsx
//
// A barangay account only ever sees boarding houses located in its own
// barangay. Confirming a permit here is what actually marks a boarding
// house "Verified" in the system - OSAS's own verify button requires this
// to already be true.

import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { dialog } from "../../components/dialogs";
import BarangayGeoMap from "../../components/BarangayGeoMap";

export default function BarangayBoardingHouses() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    api.barangay.listBoardingHouses()
      .then(setHouses)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function setPermit(h, value) {
    const ok = await dialog.confirm(value ? {
      title: "Mark as with permit?",
      message: `"${h.name}" will be marked Verified (with permit) and the student and OSAS will be notified.`,
      confirmText: "With permit",
    } : {
      title: "Mark as without permit?",
      message: `"${h.name}" will be marked Rejected (without permit) and the student and OSAS will be notified.`,
      confirmText: "Without permit", variant: "danger",
    });
    if (!ok) return;
    try { await api.barangay.confirmPermit(h.id, value); load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Boarding house permits</div>
          <div className="osas-main-sub">
            Boarding houses located in your barangay. Mark each one "With permit" (Verified) or
            "Without permit" (Rejected).
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="panel-title" style={{ marginBottom: 10 }}>Where your students are dorming</div>
        <BarangayGeoMap />
      </div>

      <div className="card">
        {loading ? <div className="loading-text">Loading...</div>
        : houses.length === 0 ? <div className="review-empty">No boarding houses on file for your barangay yet.</div>
        : (
          <table>
            <tbody>
              <tr><th>Boarding house</th><th>Landlord</th><th>Contact</th><th>Status</th><th></th></tr>
              {houses.map(h => (
                <tr key={h.id}>
                  <td>{h.name}</td>
                  <td style={{fontSize:12,color:"#6b6457"}}>{h.contact_person || "-"}</td>
                  <td style={{fontSize:12,color:"#6b6457"}}>{h.contact_number || "-"}</td>
                  <td>
                    <span className={`badge ${h.has_barangay_permit ? "ok" : h.rejected_at ? "bad" : "pending"}`}>
                      {h.has_barangay_permit ? "With permit" : h.rejected_at ? "Without permit" : "Not yet checked"}
                    </span>
                  </td>
                  <td style={{whiteSpace:"nowrap"}}>
                    {h.has_barangay_permit ? (
                      <span style={{fontSize:11.5,color:"#857d6c"}}>Confirmed</span>
                    ) : (
                      <div style={{display:"flex",gap:6}}>
                        <button className="btn primary" style={{padding:"5px 10px",fontSize:11}}
                          onClick={() => setPermit(h, true)}>With permit</button>
                        {!h.rejected_at && (
                          <button className="btn" style={{padding:"5px 10px",fontSize:11,color:"var(--pin)"}}
                            onClick={() => setPermit(h, false)}>Without permit</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
