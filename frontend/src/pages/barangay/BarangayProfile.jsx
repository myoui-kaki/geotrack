// src/pages/barangay/BarangayProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import InstallAppButton from "../../components/InstallAppButton";

export default function BarangayProfile() {
  const { fullName: sessionFullName, logout, updateFullName } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  // The form is always editable and always rendered - it never waits on
  // the fetch above to succeed, so a backend hiccup doesn't leave this
  // page stuck. It's pre-filled from whatever we have (the server profile
  // if that loaded, otherwise the name saved at login).
  const [fullNameInput, setFullNameInput] = useState(sessionFullName || "");
  const [contactNumber, setContactNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.barangay.myProfile()
      .then(p => {
        setProfile(p);
        setFullNameInput(p.full_name || "");
        setContactNumber(p.contact_number || "");
      })
      .catch(err => {
        setLoadError(
          err.message === "Failed to fetch"
            ? "Hindi ma-reach ang server ngayon. Puwede mo pa ring i-type dito ang pangalan at contact number - i-Save mo na lang ulit paglapag na ng koneksyon sa backend."
            : err.message
        );
      })
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    logout();
    navigate("/barangay/login");
  }

  async function handleSave() {
    setSaving(true); setSaveError(""); setSaved(false);
    try {
      const updated = await api.barangay.updateProfile({
        full_name: fullNameInput.trim() || null,
        contact_number: contactNumber.trim() || null,
      });
      setProfile(updated);
      updateFullName?.(updated.full_name);
      setSaved(true);
    } catch (err) {
      setSaveError(
        err.message === "Failed to fetch"
          ? "Hindi ma-reach ang server - hindi na-save. Siguraduhing tumatakbo ang backend at subukan ulit."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Profile</div>
          <div className="osas-main-sub">
            Contact information shown here is visible to Student and OSAS.
          </div>
        </div>
      </div>

      {loadError && <div className="error-banner" style={{ marginBottom: 14 }}>{loadError}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : (
          <>
            {profile && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#857d6c", fontWeight: 600 }}>Email</div>
                <div style={{ fontSize: 14 }}>{profile.email}</div>
              </div>
            )}
            {profile?.barangay_name && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#857d6c", fontWeight: 600 }}>Barangay assigned</div>
                <div style={{ fontSize: 14 }}>{profile.barangay_name}</div>
              </div>
            )}

            {/* Editable regardless of whether the fetch above succeeded -
                any name/number typed here can be saved once Save is
                pressed, and this is exactly what Student/OSAS see on
                their side (e.g. the SOS emergency contacts). */}
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Full name</label>
              <input type="text" placeholder="e.g. Juan Dela Cruz"
                value={fullNameInput} onChange={e => setFullNameInput(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Contact number</label>
              <input type="tel" placeholder="e.g. 09171234567"
                value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
            </div>

            {saveError && <div className="error-banner" style={{ marginBottom: 10 }}>{saveError}</div>}
            {saved && !saveError && (
              <div style={{ fontSize: 12.5, color: "var(--moss-dark)", fontWeight: 600, marginBottom: 10 }}>
                Saved.
              </div>
            )}

            <button className="btn primary" style={{ width: "100%", padding: 12, marginBottom: 10 }}
              disabled={saving} onClick={handleSave}>
              {saving ? "Saving..." : "Save"}
            </button>

            {/* Hides itself when the app is already installed or the browser
                can't install it, so it only shows when it can actually work. */}
            <div style={{ marginBottom: 10 }}><InstallAppButton variant="block" /></div>

            <button className="btn" style={{ width: "100%", padding: 12 }} onClick={handleLogout}>
              Sign out
            </button>
          </>
        )}
      </div>
    </>
  );
}
