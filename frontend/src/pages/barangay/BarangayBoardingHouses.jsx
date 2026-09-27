// src/pages/barangay/BarangayBoardingHouses.jsx
//
// A barangay account only ever sees boarding houses located in its own
// barangay. Confirming a permit here is what actually marks a boarding
// house "Verified" in the system - OSAS's own verify button requires this
// to already be true.

import { useEffect, useState } from "react";
import { api } from "../../api/client";
import InstallAppButton from "../../components/InstallAppButton";
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

  async function setPermit(hid, value) {
    try { await api.barangay.confirmPermit(hid, value); load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Boarding house permits</div>
          <div className="osas-main-sub">
            Boarding houses located in your barangay. Confirming a valid business permit here marks
            the boarding house "Verified" for students and OSAS.
          </div>
        </div>
        <InstallAppButton />
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
                    <span className={`badge ${h.has_barangay_permit ? "ok" : "pending"}`}>
                      {h.has_barangay_permit ? "Permit confirmed" : "Permit not yet confirmed"}
                    </span>
                  </td>
                  <td style={{whiteSpace:"nowrap"}}>
                    {!h.has_barangay_permit
                      ? <button className="btn primary" style={{padding:"5px 10px",fontSize:11}} onClick={() => setPermit(h.id, true)}>Confirm permit</button>
                      : <button className="btn" style={{padding:"5px 10px",fontSize:11,color:"var(--pin)"}} onClick={() => setPermit(h.id, false)}>Revoke / not confirmed</button>}
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
