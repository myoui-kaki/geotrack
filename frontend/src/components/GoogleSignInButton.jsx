// src/components/GoogleSignInButton.jsx
//
// "or" divider + Google's own "Continue with Google" button, used on the
// Student / OSAS / Barangay login pages.
//
// One button does both sign-in and sign-up:
//   - Google account already has a GeoTrack account -> onSuccess() right
//     away, so the page takes them straight to their dashboard/home.
//   - Brand-new person -> NOTHING is created yet. The Terms & Conditions
//     open first; only after "I agree" is the account created and
//     onSuccess() called. (Barangay accounts also type which barangay they
//     represent in that same step.) Cancel = no account is made.
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { STUDENT_TERMS, STAFF_TERMS } from "./termsText";
import BarangaySelect from "./BarangaySelect";
import LocationPicker from "./LocationPicker";

const DEPARTMENTS = ["CCS", "COE", "CTE", "CBAA", "CIT", "CCJE", "CAS", "CHMT"];

// A Google OAuth *client ID* is public by design (it's visible in every
// site that uses Google sign-in) - it is not the secret. The fallback keeps
// the button working even if the VITE_GOOGLE_CLIENT_ID env file isn't
// picked up by the build.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || "249006624482-udjh3rd9j2f3kukce53rfknns1e43s38.apps.googleusercontent.com";

export default function GoogleSignInButton({ role, onSuccess, onError, divider = true }) {
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const [pending, setPending] = useState(null);      // Google credential awaiting Terms
  const [barangayName, setBarangayName] = useState("");
  const [bFullName, setBFullName] = useState("");
  const [bPosition, setBPosition] = useState("");
  const [bContact, setBContact] = useState("");
  // student sign-up details
  const [sf, setSf] = useState({ course: "", dept: "", sex: "", bhName: "", bhBarangay: "", landlord: "", lEmail: "", lContact: "" });
  const [pin, setPin] = useState(null);
  const setS = k => e => setSf({ ...sf, [k]: e.target.value });
  const [modalError, setModalError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !btnRef.current) return;
    let cancelled = false, pollId, timeoutId;

    function init() {
      if (cancelled || !window.google?.accounts?.id || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            const session = await api.googleAuth(role, response.credential);
            if (session.requires_terms) {
              setModalError(""); setBarangayName(""); setBFullName(session.full_name || ""); setPending(response.credential);
            } else {
              onSuccessRef.current?.(session);
            }
          } catch (err) {
            onErrorRef.current?.(err.message || "Google sign-in failed. Please try again.");
          }
        },
      });
      // Fill the width of the form (Google allows 200-400px).
      const w = Math.max(200, Math.min(400, Math.round(wrapRef.current?.clientWidth || 320)));
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline", size: "large", width: w, text: "continue_with", logo_alignment: "left",
      });
    }

    if (window.google?.accounts?.id) init();
    else {
      // The Google script is loaded with `defer` - wait for it to be ready.
      pollId = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(pollId); init(); }
      }, 150);
      timeoutId = setTimeout(() => clearInterval(pollId), 8000);
    }
    return () => { cancelled = true; clearInterval(pollId); clearTimeout(timeoutId); };
  }, [role]);

  async function agreeAndCreate() {
    if (role === "barangay") {
      const missing = [[barangayName, "barangay"], [bFullName, "full name"], [bPosition, "position"], [bContact, "contact number"]]
        .filter(([v]) => !v.trim()).map(([, l]) => l);
      if (missing.length) { setModalError("Please fill in: " + missing.join(", ") + "."); return; }
    }
    if (role === "osas") {
      const missing = [[bFullName, "full name"], [bPosition, "position"]].filter(([v]) => !v.trim()).map(([, l]) => l);
      if (missing.length) { setModalError("Please fill in: " + missing.join(", ") + "."); return; }
    }
    if (role === "student") {
      const missing = [[bFullName, "full name"], [sf.course, "course & section"], [sf.dept, "department"], [sf.sex, "sex"],
        [sf.bhName, "boarding house name"], [sf.bhBarangay, "barangay"], [sf.landlord, "landlord name"],
        [sf.lEmail, "landlord email"], [sf.lContact, "landlord contact number"], [pin ? "x" : "", "boarding house pin on the map"]]
        .filter(([v]) => !(v || "").trim()).map(([, l]) => l);
      if (missing.length) { setModalError("Please fill in: " + missing.join(", ") + "."); return; }
    }
    setBusy(true); setModalError("");
    try {
      const session = await api.googleAuth(role, pending, {
        accept_terms: true,
        ...(role === "osas" ? { full_name: bFullName.trim(), position: bPosition.trim() } : {}),
        ...(role === "student" ? {
          full_name: bFullName.trim(), course_section: sf.course.trim(), department: sf.dept, gender: sf.sex,
          boarding_house_name: sf.bhName.trim(), boarding_house_barangay: sf.bhBarangay,
          boarding_house_latitude: pin?.lat, boarding_house_longitude: pin?.lng,
          landlord_name: sf.landlord.trim(), landlord_email: sf.lEmail.trim(), landlord_contact: sf.lContact.trim(),
        } : {}),
        ...(role === "barangay" ? { barangay_name: barangayName.trim(), full_name: bFullName.trim(), position: bPosition.trim(), contact_number: bContact.trim() } : {}),
      });
      setPending(null);
      onSuccessRef.current?.(session);
    } catch (err) {
      setModalError(err.message || "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  if (!CLIENT_ID) return null;

  return (
    <>
      {divider && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0 16px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span style={{ fontSize: 13, color: "#544f43" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>
      )}
      <div ref={wrapRef} style={{ width: "100%" }}>
        <div ref={btnRef} style={{ display: "flex", justifyContent: "center" }} />
      </div>

      {pending && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(28,43,36,.6)", zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 24, maxWidth: 520, width: "100%",
            maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              Terms &amp; Conditions
            </div>
            <div style={{ fontSize: 12.5, color: "#857d6c", marginBottom: 12 }}>
              Welcome! Since this is your first time, please read and agree before we create your account.
            </div>
            <pre style={{
              flex: "none", maxHeight: 150, overflowY: "auto", fontSize: 11.5, lineHeight: 1.65, whiteSpace: "pre-wrap",
              color: "#544f43", fontFamily: "var(--font-body)", margin: "0 0 14px", padding: "0 4px",
              minHeight: 120,
            }}>{role === "student" ? STUDENT_TERMS : STAFF_TERMS}</pre>

            {role === "osas" && (
              <div style={{ marginBottom: 12, display: "grid", gap: 10 }}>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Full name *</label>
                  <input value={bFullName} onChange={e => setBFullName(e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Position *</label>
                  <input value={bPosition} onChange={e => setBPosition(e.target.value)} placeholder="e.g. OSAS Coordinator" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
              </div>
            )}

            {role === "student" && (
              <div style={{ marginBottom: 12, display: "grid", gap: 10 }}>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Full name *</label>
                  <input value={bFullName} onChange={e => setBFullName(e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Course &amp; section *</label>
                  <input value={sf.course} onChange={setS("course")} placeholder="e.g. BSIT-3A" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Department *</label>
                  <select value={sf.dept} onChange={setS("dept")} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Sex *</label>
                  <select value={sf.sex} onChange={setS("sex")} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}>
                    <option value="">Select sex</option><option value="male">Male</option><option value="female">Female</option>
                  </select></div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--moss-dark)", marginTop: 4 }}>Your boarding house</div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Boarding house name *</label>
                  <input value={sf.bhName} onChange={setS("bhName")} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Barangay *</label>
                  <BarangaySelect value={sf.bhBarangay} onChange={v => setSf({ ...sf, bhBarangay: v })} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Landlord name *</label>
                  <input value={sf.landlord} onChange={setS("landlord")} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Landlord email *</label>
                  <input type="email" value={sf.lEmail} onChange={setS("lEmail")} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Landlord contact number *</label>
                  <input type="tel" value={sf.lContact} onChange={setS("lContact")} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Pin the exact location *</label>
                  <LocationPicker value={pin} onChange={setPin} barangay={sf.bhBarangay} height={200} /></div>
              </div>
            )}

            {role === "barangay" && (
              <div style={{ marginBottom: 12, display: "grid", gap: 10 }}>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Barangay you represent *</label>
<BarangaySelect value={barangayName} onChange={setBarangayName} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Full name *</label>
                  <input value={bFullName} onChange={e => setBFullName(e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Position *</label>
                  <input value={bPosition} onChange={e => setBPosition(e.target.value)} placeholder="e.g. Barangay Captain" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>Contact number *</label>
                  <input type="tel" value={bContact} onChange={e => setBContact(e.target.value)} placeholder="e.g. 09171234567" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
              </div>
            )}

            {modalError && <div className="error-banner" style={{ marginBottom: 12 }}>{modalError}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn primary" style={{ flex: 1, padding: 12 }} disabled={busy}
                onClick={agreeAndCreate}>{busy ? "Creating account..." : "I agree & continue"}</button>
              <button className="btn" style={{ flex: 1, padding: 12 }} disabled={busy}
                onClick={() => setPending(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
