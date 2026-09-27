// src/pages/osas/OsasProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function OsasProfile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [position, setPosition] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    api.osas.myProfile()
      .then(p => { setProfile(p); setPosition(p.position || ""); setContactNumber(p.contact_number || ""); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    logout();
    navigate("/osas/login");
  }

  async function handleSave() {
    setSaving(true); setSaveError("");
    try {
      const updated = await api.osas.updateProfile({
        position: position.trim() || null,
        contact_number: contactNumber.trim() || null,
      });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Profile</div>
          <div className="osas-main-sub">Details for this OSAS account.</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : !profile ? (
          <div className="review-empty">
            {error || "Couldn't load this profile. Try refreshing the page."}
          </div>
        ) : (
          <>
            {[
              ["Full name", profile.full_name],
              ["Email", profile.email],
              ["Account created", new Date(profile.created_at).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#857d6c", fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 14 }}>{value}</div>
              </div>
            ))}

            {/* Position + contact number - what Student and Barangay see for
                this OSAS officer (e.g. the SOS emergency contacts). */}
            {!editing ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#857d6c", fontWeight: 600 }}>
                    Position <span style={{ fontWeight: 400 }}>(visible to Student &amp; Barangay)</span>
                  </div>
                  <div style={{ fontSize: 14 }}>{profile.position || "Not set"}</div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: "#857d6c", fontWeight: 600 }}>
                    Contact number <span style={{ fontWeight: 400 }}>(visible to Student &amp; Barangay)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 14 }}>{profile.contact_number || "Not set"}</div>
                    <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() => {
                        setPosition(profile.position || "");
                        setContactNumber(profile.contact_number || "");
                        setEditing(true);
                      }}>
                      Edit
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: 18 }}>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Position</label>
                  <input type="text" placeholder="e.g. OSAS Coordinator"
                    value={position} onChange={e => setPosition(e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <label>Contact number</label>
                  <input type="tel" placeholder="e.g. 09171234567"
                    value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
                </div>
                {saveError && <div className="error-banner" style={{ marginBottom: 8 }}>{saveError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn primary" style={{ padding: "6px 14px", fontSize: 13 }}
                    disabled={saving} onClick={handleSave}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button className="btn" style={{ padding: "6px 14px", fontSize: 13 }}
                    disabled={saving} onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button className="btn primary" style={{ width: "100%", padding: 13 }} onClick={handleLogout}>
              Sign out
            </button>
          </>
        )}
      </div>
    </>
  );
}
