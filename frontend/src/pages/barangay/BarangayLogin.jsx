// src/pages/barangay/BarangayLogin.jsx
//
// Login only - barangay accounts are created by OSAS (not self-registered),
// since each one is scoped to a specific barangay via barangay_name on the
// account, and that scoping shouldn't be something anyone can set for
// themselves at signup.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
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

          <div className="scope-note">
            Need an account? Contact OSAS - barangay accounts are set up by them.
          </div>
        </div>
      </div>
    </div>
  );
}
