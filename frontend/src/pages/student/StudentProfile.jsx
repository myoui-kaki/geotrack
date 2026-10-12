// src/pages/student/StudentProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function StudentProfile() {
  const { logout, updateFullName } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [courseSection, setCourseSection] = useState("");
  const [gender, setGender] = useState("");
  const [bhName, setBhName] = useState("");
  const [bhBarangay, setBhBarangay] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordContact, setLandlordContact] = useState("");
  const [saving, setSaving] = useState(false);

  function fillForm(d) {
    setFullName(d.full_name); setCourseSection(d.course_section||""); setGender(d.gender||"");
    setBhName(d.current_boarding_house||""); setBhBarangay(d.current_barangay||"");
    setLandlordName(d.landlord_name||""); setLandlordContact(d.landlord_contact||"");
  }

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    api.student.myProfile()
      .then(d => { setProfile(d); fillForm(d); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!!bhName.trim() !== !!bhBarangay.trim()) {
      setError("Enter both the boarding house name and its barangay."); return;
    }
    setSaving(true);
    try {
      const body = { full_name:fullName, course_section:courseSection, gender:gender||null,
                     landlord_name:landlordName.trim()||null, landlord_contact:landlordContact.trim()||null };
      // Only send the house when filled in - it can be changed, not removed here.
      if (bhName.trim()) { body.boarding_house_name = bhName.trim(); body.boarding_house_barangay = bhBarangay.trim(); }
      const updated = await api.student.updateMyProfile(body);
      setProfile(updated); fillForm(updated);
      updateFullName(updated.full_name);   // update nav/home immediately
      setEditing(false); setSuccess("Profile updated.");
    } catch(err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function handleLogout() {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    logout();
    navigate("/student/login");
  }

  return (
    <>
      <div className="student-header">
        <div className="greet">Account</div>
        <h2>My profile</h2>
      </div>
      <div className="student-body">
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="error-banner" style={{background:"#e1f0e6",color:"var(--ok)"}}>{success}</div>}

        {loading ? <div className="loading-text">Loading...</div>
        : !editing ? (
          !profile ? (
            <div className="card">
              <div className="review-empty">Couldn't load your profile. Try refreshing the page.</div>
            </div>
          ) : (
          <div className="card">
            <div className="card-title">Profile details</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:"10px 32px"}}>
              <div>
                <div style={{fontSize:11.5,fontWeight:700,color:"#544f43",marginBottom:10,textTransform:"uppercase",letterSpacing:".03em"}}>
                  Student info
                </div>
                {[
                  ["Full name", profile.full_name],
                  ["Institutional email", profile.email],
                  ["Course & section", profile.course_section || "Not set"],
                  ["Gender", profile.gender ? profile.gender.replace("_"," ") : "Prefer not to say"],
                  ["Member since", new Date(profile.created_at).toLocaleDateString()],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{marginBottom:14}}>
                    <div style={{fontSize:11,color:"#857d6c",fontWeight:600,textTransform:"capitalize"}}>{lbl}</div>
                    <div style={{fontSize:14}}>{val}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:11.5,fontWeight:700,color:"#544f43",marginBottom:10,textTransform:"uppercase",letterSpacing:".03em"}}>
                  Boarding house & landlord
                </div>
                {[
                  ["Boarding house", profile.current_boarding_house || "Not yet reported"],
                  ["Barangay", profile.current_barangay || "Not yet reported"],
                  ["Landlord", profile.landlord_name || "Not on file"],
                  ["Landlord contact", profile.landlord_contact || "Not on file"],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{marginBottom:14}}>
                    <div style={{fontSize:11,color:"#857d6c",fontWeight:600,textTransform:"capitalize"}}>{lbl}</div>
                    <div style={{fontSize:14}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn primary" style={{width:"100%",padding:13,marginTop:4}} onClick={() => setEditing(true)}>Edit profile</button>
          </div>
          )
        ) : (
          <div className="card">
            <div className="card-title">Edit profile</div>
            <form onSubmit={handleSave}>
              <div className="field"><label>Full name</label><input value={fullName} onChange={e=>setFullName(e.target.value)} required /></div>
              <div className="field"><label>Course &amp; section</label><input value={courseSection} onChange={e=>setCourseSection(e.target.value)} placeholder="e.g. BSIT-3A" /></div>
              <div className="field">
                <label>Gender</label>
                <select value={gender} onChange={e=>setGender(e.target.value)}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div style={{fontSize:11.5,fontWeight:700,color:"#544f43",margin:"6px 0 10px",textTransform:"uppercase",letterSpacing:".03em"}}>
                Boarding house &amp; landlord
              </div>
              <div className="field"><label>Boarding house</label><input value={bhName} onChange={e=>setBhName(e.target.value)} placeholder="e.g. Sto. Niño Lodge" /></div>
              <div className="field"><label>Barangay</label><input value={bhBarangay} onChange={e=>setBhBarangay(e.target.value)} placeholder="e.g. Brgy. Del Remedio" /></div>
              <div className="field"><label>Landlord name</label><input value={landlordName} onChange={e=>setLandlordName(e.target.value)} placeholder="Optional" /></div>
              <div className="field"><label>Landlord contact number</label><input value={landlordContact} onChange={e=>setLandlordContact(e.target.value)} placeholder="Optional" /></div>
              <p style={{fontSize:11,color:"#857d6c",margin:"-6px 0 14px"}}>
                Changing the boarding house to a different place is recorded as a transfer. Location pins are set from the monthly update.
              </p>
              <div className="pill-row">
                <button className="btn primary" disabled={saving}>{saving?"Saving...":"Save changes"}</button>
                <button type="button" className="btn" onClick={() => { fillForm(profile); setEditing(false); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="card student-signout-card" style={{marginTop:20}}>
  <div className="card-title">Account</div>

  <p style={{
    fontSize:12,
    color:"#857d6c",
    marginBottom:14
  }}>
    Manage your account session.
  </p>

  <button
    className="btn student-signout-btn"
    onClick={handleLogout}
  >
    Sign out
  </button>
</div>
      </div>
    </>
  );
}
