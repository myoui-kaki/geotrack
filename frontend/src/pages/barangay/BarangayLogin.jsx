// src/pages/barangay/BarangayLogin.jsx
//
// Password sign-in is for existing accounts (still created by OSAS, scoped
// to a barangay via barangay_name). Google sign-in/sign-up is also offered
// here now - a brand new barangay account created that way is asked for
// its barangay name inside the Terms & Conditions step (see
// GoogleSignInButton), since there's no other way to know which barangay
// it represents.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import InstallAppButton from "../../components/InstallAppButton";
import BarangaySelect from "../../components/BarangaySelect";
import { STAFF_TERMS } from "../../components/termsText";
import "../osas/osas.css";

export default function BarangayLogin() {
  const [mode, setMode] = useState("login");           // login | register
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [contact, setContact] = useState("");
  const [barangay, setBarangay] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (mode === "register") {
      const missing = [[barangay, "barangay"], [fullName, "full name"], [position, "position"],
                       [email, "email"], [contact, "contact number"], [password, "password"]]
        .filter(([v]) => !(v || "").trim()).map(([, l]) => l);
      if (missing.length) { setError("Please fill in: " + missing.join(", ") + "."); return; }
      if (!agreed) { setError("Please agree to the Terms & Conditions first."); return; }
    }
    setLoading(true);
    try {
      const session = mode === "register"
        ? await api.registerBarangay({ full_name: fullName.trim(), position: position.trim(), email: email.trim(),
                                       contact_number: contact.trim(), barangay_name: barangay, password })
        : await api.loginRequest(email, password);
      if (session.role !== "barangay") {
        setError("This account is not registered as a barangay account.");
        setLoading(false);
        return;
      }
      login(session);
      navigate("/barangay/boarding-houses");
    } catch (err) {
      const msg = err.message || "";
      setError(mode === "login" && (msg.includes("Incorrect") || msg.includes("401"))
        ? "No account found with these credentials." : msg);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSuccess(session) {
    setError("");
    if (session.role !== "barangay") { setError("This account is not registered as a barangay account."); return; }
    login(session);
    navigate("/barangay/boarding-houses");
  }

  return (
    <div className="osas-login-wrap">
      <div className="osas-login-card">
        <div className="osas-login-brand">
          <div className="brand-mark" style={{ color:"#d9e6df" }}>
            <span className="pin-dot"></span> GEOTRACK
          </div>
          <div>
            <div className="osas-brand-title">Barangay coordination portal.</div>
            <div className="osas-brand-sub">
              Confirm boarding house permits, and stay aware of student emergencies in your barangay.
            </div>
          </div>
        </div>

        <div className="osas-login-form">
          <div className="form-eyebrow">{mode === "register" ? "Barangay sign up" : "Barangay sign in"}</div>
          <h1 className="form-title">{mode === "register" ? "Create your account" : "Welcome back"}</h1>
          <p className="form-hint">{mode === "register"
            ? "All fields are required. Your details appear on your profile and are visible to Student and OSAS."
            : "This portal is for barangay officials."}</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <div className="field"><label>Barangay *</label>
                  <BarangaySelect value={barangay} onChange={setBarangay} /></div>
                <div className="field"><label>Full name *</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
                <div className="field"><label>Position *</label>
                  <input value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Barangay Captain" required /></div>
              </>
            )}
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{ position:"relative" }}>
                <input type={showPass ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={8}
                  style={{ paddingRight:48 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#857d6c",
                }}>{showPass ? "Hide" : "Show"}</button>
              </div>
            </div>
            {mode === "register" && (
              <>
                <div className="field"><label>Contact number *</label>
                  <input type="tel" value={contact} onChange={e => setContact(e.target.value)} placeholder="e.g. 09171234567" required /></div>
                <div style={{ fontSize:11, color:"#857d6c", margin:"-6px 0 12px" }}>
                  Password: 8-12 characters with uppercase, lowercase, number and special character.
                </div>
                <div style={{ marginBottom:14, fontSize:12.5 }}>
                  <button type="button" onClick={() => setShowTerms(v => !v)} style={{
                    background:"none", border:"none", color:"var(--moss)", fontWeight:700, cursor:"pointer",
                    padding:0, fontFamily:"inherit", textDecoration:"underline" }}>
                    {showTerms ? "Hide" : "Read"} Terms &amp; Conditions
                  </button>
                  {showTerms && (
                    <pre style={{ maxHeight:160, overflowY:"auto", whiteSpace:"pre-wrap", fontSize:11, lineHeight:1.55,
                                  color:"#544f43", fontFamily:"inherit", margin:"8px 0", padding:8,
                                  border:"1px solid var(--line)", borderRadius:8 }}>{STAFF_TERMS}</pre>
                  )}
                  <label style={{ display:"flex", gap:8, alignItems:"center", marginTop:8, cursor:"pointer", fontWeight:400 }}>
                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width:15, height:15 }} />
                    I have read and agree to the Terms &amp; Conditions.
                  </label>
                </div>
              </>
            )}
            <button className="btn primary" style={{ width:"100%", padding:13 }} disabled={loading}>
              {loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
            </button>
          </form>

          <div style={{ textAlign:"center", marginTop:12, fontSize:12.5 }}>
            {mode === "login" ? "No account yet? " : "Already have an account? "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} style={{
              background:"none", border:"none", color:"var(--moss-dark)", fontWeight:700, cursor:"pointer",
              fontFamily:"inherit", fontSize:12.5, textDecoration:"underline" }}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>

          <GoogleSignInButton role="barangay" onSuccess={handleGoogleSuccess} onError={setError} />

          <div style={{ textAlign:"center", marginTop:10 }}>
            <button type="button" onClick={() => navigate("/barangay/forgot-password")} style={{
              background:"none", border:"none", color:"#857d6c", fontSize:12,
              cursor:"pointer", fontFamily:"inherit", textDecoration:"underline",
            }}>Forgot password?</button>
          </div>

          <div style={{ marginTop: 14 }}><InstallAppButton variant="block" /></div>

          <div className="scope-note">
            This portal is for barangay officials only.
          </div>
        </div>
      </div>
    </div>
  );
}
