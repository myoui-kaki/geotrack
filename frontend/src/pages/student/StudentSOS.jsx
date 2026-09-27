// src/pages/student/StudentSOS.jsx
//
// Emergency Assistance / SOS module (student side).
//
// OSAS is a notifier/coordinator here, not a first responder - they log the
// case, may reach out, and can help point the student to the right people,
// but they cannot dispatch physical help on their own. Because of that, this
// page leads with a set of direct emergency contacts (barangay tanod, campus
// security, PNP) that a student can call or text immediately.
//
// Those contacts are a plain JS constant baked into the app bundle, so they
// render instantly with no network call - they work even with no data/wifi,
// as long as the app itself was already loaded. Calling and texting use the
// phone's own cellular (GSM) connection, not mobile data, so tel:/sms: links
// still work when there is no signal for data but the phone can still call
// or text.
//
// Separately, a student can still notify OSAS the same way as before -
// picking a category, optionally sharing location, and sending an alert
// that OSAS will see and log. That part still needs internet, so failures
// are caught and explained rather than left as a generic error.

import { useEffect, useState } from "react";
import { api } from "../../api/client";

const CATEGORIES = ["Medical Emergency", "Safety Threat", "Fire", "Natural Disaster", "Other"];

function telHref(number) {
  return `tel:${number.replace(/\s+/g, "")}`;
}

function smsHref(number, coords) {
  const base = "I need help. This is an emergency.";
  const loc = coords
    ? ` My location: https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
    : "";
  return `sms:${number.replace(/\s+/g, "")}?body=${encodeURIComponent(base + loc)}`;
}

const STATUS_STYLE = {
  Active:     { bg: "#fbe4dc", color: "#7a3a23" },
  Responding: { bg: "#fdeecb", color: "#8a6414" },
  Resolved:   { bg: "#e1f0e6", color: "#2f5d3f" },
  Cancelled:  { bg: "#eee9dd", color: "#6b6457" },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Active;
  return (
    <span style={{
      display:"inline-block", padding:"3px 10px", borderRadius:999,
      fontSize:11, fontWeight:700, background:s.bg, color:s.color,
    }}>{status}</span>
  );
}

function Timeline({ entries }) {
  return (
    <div style={{ marginTop:12 }}>
      {entries.map((e, i) => (
        <div key={e.id} style={{
          display:"flex", gap:10, paddingBottom: i===entries.length-1 ? 0 : 12,
        }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{
              width:9, height:9, borderRadius:"50%",
              background: e.actor_role==="osas_admin" ? "var(--moss)" : "var(--pin)",
              marginTop:4, flexShrink:0,
            }}/>
            {i !== entries.length-1 && <div style={{ width:2, flex:1, background:"var(--line)", marginTop:2 }}/>}
          </div>
          <div style={{ paddingBottom:2 }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:"#3a352b" }}>{e.event}</div>
            {e.note && <div style={{ fontSize:12, color:"#6b6457", marginTop:2 }}>{e.note}</div>}
            <div style={{ fontSize:10.5, color:"#a39c8a", marginTop:2 }}>
              {e.actor_name} - {new Date(e.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Always rendered, regardless of network status - these are plain data and
// tel:/sms: links, not API calls, so they work with no wifi/data as long as
// the phone still has cellular signal. `directory`, when it loaded
// successfully, fills in the actual barangay/OSAS numbers that account
// holder set on their own Profile page - if it's still unset or the fetch
// failed (offline), the placeholder rows below are shown instead so the
// list is never empty.
function buildContacts(directory) {
  const barangay = directory?.barangay_contacts?.find(c => c.contact_number);
  const osas = directory?.osas_contacts?.find(c => c.contact_number);

  return [
    { name: "National Emergency Hotline", number: "911", note: "Police, fire, medical - nationwide" },
    { name: "PNP Text Hotline", number: "117", note: "Text for police assistance" },
    barangay
      ? { name: `Barangay${barangay.role_label ? ` ${barangay.role_label}` : ""}`, number: barangay.contact_number, note: barangay.full_name }
      : { name: "Barangay Tanod", number: "09XXXXXXXXX", note: "Not set yet - the barangay account can add this in their Profile" },
    osas
      ? { name: "OSAS / Campus Security", number: osas.contact_number, note: osas.full_name }
      : { name: "OSAS / Campus Security", number: "09XXXXXXXXX", note: "Not set yet - the OSAS account can add this in their Profile" },
  ];
}

function EmergencyContactsCard({ coords, directory }) {
  const contacts = buildContacts(directory);
  return (
    <div className="card" style={{ borderLeft:"4px solid var(--pin)" }}>
      <div className="card-title">Direct emergency contacts</div>
      <p style={{ fontSize:11.5, color:"#6b6457", margin:"4px 0 12px" }}>
        Call or text these directly for immediate help - this works even without
        mobile data or wifi, as long as you have phone signal.
      </p>
      {contacts.map(c => (
        <div key={c.name} style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"10px 0", borderBottom:"1px solid #ece7da", gap:10,
        }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12.5, fontWeight:700 }}>{c.name}</div>
            <div style={{ fontSize:11, color:"#a39c8a" }}>{c.number} - {c.note}</div>
          </div>
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <a className="btn" href={telHref(c.number)} style={{ fontSize:11.5, padding:"6px 10px" }}>Call</a>
            <a className="btn" href={smsHref(c.number, coords)} style={{ fontSize:11.5, padding:"6px 10px" }}>Text</a>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentSOS() {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [locationState, setLocationState] = useState("idle"); // idle | locating | ok | denied
  const [coords, setCoords] = useState(null);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(false);
  // Live barangay/OSAS numbers, if reachable - null just means "still
  // offline/unset", the static placeholders in buildContacts() cover that.
  const [directory, setDirectory] = useState(null);

  // A fetch() that fails before reaching the server (no connection at all)
  // throws a plain TypeError - that's the signal we treat as "offline"
  // rather than a normal request error.
  function isNetworkError(err) {
    return err instanceof TypeError || !navigator.onLine;
  }

  function loadCases() {
    api.student.myEmergencies()
      .then(setCases)
      .catch(err => {
        if (isNetworkError(err)) { setCases([]); setOfflineNotice(true); }
        else setError(err.message);
      });
  }

  useEffect(() => { loadCases(); }, []);
  useEffect(() => {
    // Best-effort - if this fails (offline, etc.) buildContacts() just
    // keeps using the static placeholder rows, so no error handling needed.
    api.contactsDirectory().then(setDirectory).catch(() => {});
  }, []);

  const activeCase = cases?.find(c => c.status === "Active" || c.status === "Responding");
  const history = (cases || []).filter(c => c.status === "Resolved" || c.status === "Cancelled");

  function requestLocation() {
    if (!navigator.geolocation) { setLocationState("denied"); return; }
    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setLocationState("ok"); },
      () => setLocationState("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function startConfirm(cat) {
    setCategory(cat);
    setConfirming(true);
    requestLocation();
  }

  async function handleSendSOS() {
    setSending(true);
    setError("");
    try {
      await api.student.triggerSOS({
        category,
        details: details.trim() || null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });
      setConfirming(false); setCategory(""); setDetails(""); setCoords(null); setLocationState("idle");
      loadCases();
    } catch (err) {
      if (isNetworkError(err)) {
        setError("Could not reach OSAS - you appear to be offline. Use the direct contacts above to call or text for help right away.");
      } else {
        setError(err.message);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleCancel() {
    if (!activeCase) return;
    if (!window.confirm("Cancel this SOS alert? Only do this if it's a false alarm or you no longer need help.")) return;
    try {
      await api.student.cancelEmergency(activeCase.id);
      loadCases();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="student-header">
        <div className="greet">Emergency assistance</div>
        <h2>SOS</h2>
      </div>
      <div className="student-body">
        {error && <div className="error-banner">{error}</div>}
        {offlineNotice && !error && (
          <div className="error-banner" style={{ background:"#fdeecb", color:"#8a6414" }}>
            You appear to be offline. Your alert history can't be checked right now, but
            you can still call or text the emergency contacts below.
          </div>
        )}

        <EmergencyContactsCard coords={coords} directory={directory} />

        {cases === null ? (
          <div className="card" style={{ marginTop:14 }}><p style={{fontSize:12.5,color:"#6b6457"}}>Loading...</p></div>

        ) : activeCase ? (
          <div className="card" style={{ marginTop:14, borderLeft:"4px solid var(--pin)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div className="card-title" style={{ marginBottom:4 }}>{activeCase.category}</div>
                <StatusPill status={activeCase.status} />
              </div>
              <button className="btn" style={{ fontSize:11.5, padding:"6px 10px" }} onClick={handleCancel}>
                Cancel alert
              </button>
            </div>
            {activeCase.details && (
              <p style={{ fontSize:12.5, color:"#544f43", marginTop:10 }}>{activeCase.details}</p>
            )}
            <div style={{ fontSize:11, color:"#a39c8a", marginTop:8 }}>
              {activeCase.latitude
                ? `Location shared - ${activeCase.latitude.toFixed(5)}, ${activeCase.longitude.toFixed(5)}`
                : "No location shared"}
            </div>
            <div style={{ borderTop:"1px solid var(--line)", marginTop:14, paddingTop:12 }}>
              <div className="card-title" style={{ fontSize:12.5 }}>Timeline</div>
              <Timeline entries={activeCase.timeline} />
            </div>
          </div>

        ) : confirming ? (
          <div className="card" style={{ marginTop:14 }}>
            <div className="card-title">Notify OSAS - {category}</div>
            <p style={{ fontSize:12, color:"#6b6457", margin:"6px 0 12px" }}>
              This lets OSAS know what's happening and logs it on their end. OSAS
              can coordinate and follow up, but for anything urgent, call or text
              the direct contacts above first.
            </p>
            <div style={{ fontSize:11.5, marginBottom:12 }}>
              {locationState === "locating" && <span style={{color:"#8a6414"}}>Getting your location...</span>}
              {locationState === "ok" && <span style={{color:"#2f5d3f"}}>Location ready to share with OSAS.</span>}
              {locationState === "denied" && <span style={{color:"#7a3a23"}}>Location unavailable - the alert will still be sent without it.</span>}
            </div>
            <div className="field">
              <label>Anything OSAS should know? (optional)</label>
              <textarea value={details} onChange={e=>setDetails(e.target.value)}
                placeholder="e.g. exact location, what's happening..." />
            </div>
            <div className="pill-row" style={{ marginTop:10 }}>
              <button className="btn" onClick={() => { setConfirming(false); setCategory(""); }} disabled={sending}>
                Back
              </button>
              <button className="btn primary" style={{ background:"var(--pin)" }} onClick={handleSendSOS} disabled={sending}>
                {sending ? "Sending..." : "Notify OSAS now"}
              </button>
            </div>
          </div>

        ) : (
          <>
            <div className="card" style={{ marginTop:14, textAlign:"center", padding:"28px 20px" }}>
              <div style={{ fontSize:12.5, color:"#6b6457", marginBottom:14 }}>
                Pick a category to notify OSAS so they're aware and can follow up.
                For life-threatening emergencies, use the direct contacts above.
              </div>
              <div className="sos-category-grid">
                {CATEGORIES.map(cat => (
                  <button key={cat} className="sos-cat-btn" onClick={() => startConfirm(cat)}>
                    <span>{cat}</span>
                    <span className="sos-cat-arrow" aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div className="card" style={{ marginTop:14 }}>
                <div className="card-title">Emergency history</div>
                {history.map(c => (
                  <div key={c.id} style={{ padding:"10px 0", borderBottom:"1px solid #ece7da" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontWeight:600, fontSize:12.5 }}>{c.category}</div>
                      <StatusPill status={c.status} />
                    </div>
                    <div style={{ fontSize:11, color:"#a39c8a", marginTop:2 }}>
                      {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
