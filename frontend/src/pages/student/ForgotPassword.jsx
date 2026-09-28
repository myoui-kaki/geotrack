// src/pages/student/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api/client";
import "./student.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Same page serves all three portals - which one is decided by the URL
  // (/student/..., /osas/..., /barangay/...), so "Back to sign in" and the
  // hint text match the portal the person came from.
  const portal = useLocation().pathname.split("/")[1] || "student";
  const isStudent = portal === "student";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="student-login-wrap">
      <div className="student-login-card">
        <div className="brand-mark" style={{ color: "var(--moss)", marginBottom: 24 }}>
          <span className="pin-dot"></span> GEOTRACK
        </div>

        <div className="form-eyebrow">Password reset</div>
        <h1 className="form-title">Forgot your password?</h1>

        {!submitted ? (
          <>
            <p className="form-hint">
              {isStudent
                ? "Enter your institutional email (Student ID format, e.g. 0323-4198@lspu.edu.ph). "
                : "Enter the email you registered with. "}
              We'll send a link to that inbox to set a new password.
            </p>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>{isStudent ? "Institutional email" : "Email"}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={isStudent ? "0323-4198@lspu.edu.ph" : "you@example.com"}
                  required
                />
              </div>
              <button className="btn primary" style={{ width: "100%", padding: 13 }} disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{
              padding: "14px 16px", background: "#e1f0e6", borderRadius: 10,
              marginBottom: 16, fontSize: 13, color: "var(--ok)", lineHeight: 1.6,
            }}>
              <strong>Check your email.</strong> If <em>{email}</em> is registered,
              a password reset link has been sent.
            </div>

            <p style={{ fontSize: 12, color: "#857d6c", lineHeight: 1.6 }}>
              The link expires in 1 hour. Didn't get it? Check your spam folder,
              or go back and try again.
            </p>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button
            type="button"
            onClick={() => navigate(`/${portal}/login`)}
            style={{ background: "none", border: "none", color: "var(--moss)", fontWeight: 700, cursor: "pointer", fontSize: 12.5, fontFamily: "inherit" }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
