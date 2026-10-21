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
import "../osas/osas.css";

export default function BarangayLogin() {
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
    setLoading(true);
    try {
      const session = await api.loginRequest(email, password);
      if (session.role !== "barangay") {
        setError("This account is not registered as a barangay account.");
        setLoading(false);
        return;
      }
      login(session);
      navigate("/barangay/boarding-houses");
    } catch (err) {
      const msg = err.message || "";
      setError(msg.includes("Incorrect") || msg.includes("401")
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
          <div className="form-eyebrow">Barangay sign in</div>
          <h1 className="form-title">Welcome back</h1>
          <p className="form-hint">This portal is restricted to barangay accounts set up by OSAS.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
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
            <button className="btn primary" style={{ width:"100%", padding:13 }} disabled={loading}>
              {loading ? "Please wait..." : "Sign in"}
            </button>
          </form>

          <GoogleSignInButton role="barangay" onSuccess={handleGoogleSuccess} onError={setError} />

          <div style={{ textAlign:"center", marginTop:10 }}>
            <button type="button" onClick={() => navigate("/barangay/forgot-password")} style={{
              background:"none", border:"none", color:"#857d6c", fontSize:12,
              cursor:"pointer", fontFamily:"inherit", textDecoration:"underline",
            }}>Forgot password?</button>
          </div>

          <div className="scope-note">
            This portal is for barangay officials only.
          </div>
        </div>
      </div>
    </div>
  );
}
