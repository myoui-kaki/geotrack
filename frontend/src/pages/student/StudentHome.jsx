// src/pages/student/StudentHome.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import StudentMiniMap from "../../components/StudentMiniMap";
import { api } from "../../api/client";

const CURRENT_MONTH = new Date().toLocaleString("en-US", {
  month: "long",
  year: "numeric",
});

export default function StudentHome() {
  const { fullName } = useAuth();
  const navigate = useNavigate();
  const firstName = (fullName || "").split(" ")[0] || "Student";
  const [hasSubmittedThisMonth, setHasSubmittedThisMonth] = useState(null);

  useEffect(() => {
    api.student.myStatusUpdates()
      .then(updates => {
        setHasSubmittedThisMonth(updates.some(u => u.month_label === CURRENT_MONTH));
      })
      .catch(() => setHasSubmittedThisMonth(false));
  }, []);

  return (
    <>
      <div className="student-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>
        <div>
          <div className="greet">Good day</div>
          <h2>Hi, {firstName}</h2>
        </div>
      </div>
      <div className="student-body">
        {/* Only show pending-update banner - no "already submitted" banner
            that would re-appear every sign-in. Clean home screen once done. */}
        {hasSubmittedThisMonth === false && (
          <div className="status-banner">
            <div>
              <div className="label">Monthly status update</div>
              <div className="sub">Confirm where you're staying this month</div>
            </div>
            <button className="go" onClick={() => navigate("/student/status")}>Update</button>
          </div>
        )}

        <div className="card" style={{ marginBottom:14 }}>
          <div className="card-title">My boarding house</div>
          <StudentMiniMap height={160} />
        </div>

        <div className="card" style={{ marginBottom:14 }}>
          <div className="qa-card-header">
            <div className="card-title" style={{ marginBottom:0 }}>Quick actions</div>
            <div className="qa-subtitle">Your most-used student services</div>
          </div>

          <div className="quick-actions-grid">
            <button className="qa-btn" onClick={() => navigate("/student/status")}>
              <span className="qa-num"></span>
              <span className="qa-label">Status update</span>
              <span className="qa-arrow" aria-hidden="true">↗</span>
            </button>
            <button className="qa-btn" onClick={() => navigate("/student/directory")}>
              <span className="qa-num"></span>
              <span className="qa-label">Directory</span>
              <span className="qa-arrow" aria-hidden="true">↗</span>
            </button>
            <button className="qa-btn" onClick={() => navigate("/student/concern")}>
              <span className="qa-num"></span>
              <span className="qa-label">Report concern</span>
              <span className="qa-arrow" aria-hidden="true">↗</span>
            </button>
            <button className="qa-btn" onClick={() => navigate("/student/profile")}>
              <span className="qa-num"></span>
              <span className="qa-label">My profile</span>
              <span className="qa-arrow" aria-hidden="true">↗</span>
            </button>
          </div>

          <button className="qa-sos-btn" onClick={() => navigate("/student/sos")}>
            <span className="qa-sos-dot" aria-hidden="true"></span>
            Emergency SOS
          </button>
        </div>

        <div className="card">
          <div className="card-title">About GeoTrack</div>
          <p style={{ fontSize:12.5, color:"#6b6457", lineHeight:1.6 }}>
            Register your boarding house, send OSAS a quick monthly check-in, and read
            anonymous reviews from other students before deciding where to live next.
          </p>
        </div>
      </div>
    </>
  );
}
