// src/pages/barangay/BarangayLogin.jsx
//
// Barangay accounts sign in with a Gmail address and can now also create
// their own account here (scoped to a barangay via barangay_name).
// Google sign-in/sign-up is also offered
// here now - a brand new barangay account created that way is asked for
// its barangay name inside the Terms & Conditions step (see
// GoogleSignInButton), since there's no other way to know which barangay
// it represents.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import "../osas/osas.css";

// Suggested names - matches how barangays are named in the rest of GeoTrack,
// but the field stays free text so any barangay can be entered.
const BARANGAY_SUGGESTIONS = [
  "Brgy. Del Remedio", "Brgy. San Rafael", "Brgy. San Benito",
  "Brgy. San Isidro", "Brgy. San Miguel", "Brgy. Balayhangin",
];

export default function BarangayLogin() {
  const [mode, setMode] = useState("login");           // login | register
  const [fullName, setFullName] = useState("");
  const [barangayName, setBarangayName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      if (!/^[^\s@]+@gmail\.com$/i.test(email.trim())) { setError("Barangay accounts must use a Gmail address (name@gmail.com)."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    }
    setLoading(true);
    try {
      const session = mode === "login"
        ? await api.loginRequest(email, password)
        : await api.registerBarangay({
            full_name: fullName.trim(), email: email.trim().toLowerCase(), password,
            barangay_name: barangayName.trim(), contact_number: contactNumber.trim() || null,
          });
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
              Confirm boarding house permits, and stay aware of student emergencies and concerns in your barangay.
            </div>
          </div>
        </div>

        <div className="osas-login-form">
          <div className="form-eyebrow">Barangay {mode === "login" ? "sign in" : "registration"}</div>
          <h1 className="form-title">{mode === "login" ? "Welcome back" : "Create barangay account"}</h1>
          <p className="form-hint">
            {mode === "login"
              ? "This portal is for barangay officials. Sign in with your Gmail account."
              : "Register with a Gmail address and the barangay you represent."}
          </p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <div className="field">
                  <label>Full name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Your name" />
                </div>
                <div className="field">
                  <label>Barangay</label>
                  <input list="brgy-suggestions" value={barangayName} onChange={e => setBarangayName(e.target.value)}
                    required placeholder="e.g. Brgy. Del Remedio" />
                  <datalist id="brgy-suggestions">
                    {BARANGAY_SUGGESTIONS.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
                <div className="field">
                  <label>Contact number (optional)</label>
                  <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="09XX XXX XXXX" />
                </div>
              </>
            )}
            <div className="field">
              <label>Gmail address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="name@gmail.com" autoComplete="email" />
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{ position:"relative" }}>
                <input type={showPass ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  style={{ paddingRight:48 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#857d6c",
                }}>{showPass ? "Hide" : "Show"}</button>
              </div>
            </div>
            {mode === "register" && (
              <>
                <p style={{ fontSize:11, color:"#857d6c", margin:"-6px 0 12px" }}>
                  8-12 characters with an uppercase letter, a lowercase letter, a number and a special character.
                </p>
                <div className="field">
                  <label>Confirm password</label>
                  <input type={showPass ? "text" : "password"} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
                </div>
              </>
            )}
            <button className="btn primary" style={{ width:"100%", padding:13 }} disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "login" && (
            <GoogleSignInButton role="barangay" onSuccess={handleGoogleSuccess} onError={setError} />
          )}

          <div style={{ textAlign:"center", marginTop:12, fontSize:12.5, color:"#6b6457" }}>
            {mode === "login" ? "No account yet? " : "Already have an account? "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} style={{
              background:"none", border:"none", color:"var(--moss)", fontWeight:700, cursor:"pointer",
              fontFamily:"inherit", fontSize:12.5, textDecoration:"underline",
            }}>{mode === "login" ? "Create an account" : "Sign in"}</button>
          </div>

          {mode === "login" && <div style={{ textAlign:"center", marginTop:10 }}>
            <button type="button" onClick={() => navigate("/barangay/forgot-password")} style={{
              background:"none", border:"none", color:"#857d6c", fontSize:12,
              cursor:"pointer", fontFamily:"inherit", textDecoration:"underline",
            }}>Forgot password?</button>
          </div>}

          <div className="scope-note">
            This portal is for barangay officials only.
          </div>
        </div>
      </div>
    </div>
  );
}
