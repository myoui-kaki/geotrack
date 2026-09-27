// src/pages/osas/OsasStatusUpdates.jsx - with search + filter panel
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import MonthCalendar, { monthLabel } from "../../components/MonthCalendar";

function MonthFilterDropdown({ month, onChange }) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  return (
    <div style={{ position:"relative" }}>
      <button type="button" className="btn" style={{ minWidth:170, textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}
        onClick={() => setOpen(v => !v)}>
        <span>📅 {month || "All months"}</span>
        <span style={{ color:"#a39c8a" }}>{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:19, background:"transparent" }} />
          <div style={{
            position:"absolute", top:"100%", left:0, marginTop:4, zIndex:20,
            background:"#fff", border:"1px solid var(--line)", borderRadius:12,
            boxShadow:"0 8px 24px rgba(28,43,36,.18)", padding:12,
          }}>
            <MonthCalendar year={viewYear} month={viewMonth} onSelect={(y,m) => {
              setViewYear(y); setViewMonth(m); onChange(monthLabel(y, m)); setOpen(false);
            }} />
            <button type="button" className="btn" style={{ width:"100%", marginTop:8, fontSize:12 }}
              onClick={() => { onChange(""); setOpen(false); }}>
              Clear (show all months)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function OsasStatusUpdates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Filters
  const [search,     setSearch]     = useState("");
  const [isVerified, setIsVerified] = useState("");
  const [isFlagged,  setIsFlagged]  = useState("");
  const [gender,     setGender]     = useState("");
  const [month,      setMonth]      = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { load(); }, [isVerified, isFlagged, gender, month]);

  function load() {
    setLoading(true);
    const params = {};
    if (isFlagged  !== "") params.is_flagged  = isFlagged === "true";
    if (isVerified !== "") params.is_verified = isVerified === "true";
    if (gender)            params.gender      = gender;
    if (month)             params.month_label = month;
    api.osas.allStatusUpdates(params)
      .then(setUpdates)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleFlag(uid) {
    const reason = window.prompt("Reason for flagging this student?");
    if (!reason) return;
    if (!window.confirm(`Flag this student?\nReason: ${reason}`)) return;
    try { await api.osas.flagStatusUpdate(uid, reason); load(); }
    catch(err) { setError(err.message); }
  }

  function clearFilters() {
    setSearch(""); setIsVerified(""); setIsFlagged(""); setGender(""); setMonth("");
  }

  const displayed = updates.filter(u => {
    if (!search) return true;
    return u.student_name.toLowerCase().includes(search.toLowerCase()) ||
           u.student_email.toLowerCase().includes(search.toLowerCase());
  });

  const activeFilters = [isVerified, isFlagged, gender, month].filter(Boolean).length;

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Student status monitor</div>
          <div className="osas-main-sub">Every monthly check-in, with search and filter controls.</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* -- Filter panel -- */}
      <div className="card" style={{marginBottom:18}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div className="field" style={{flex:1,minWidth:200,marginBottom:0}}>
            <label>Search student</label>
            <input placeholder="Name or email..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label>Month</label>
            <MonthFilterDropdown month={month} onChange={setMonth} />
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label>Gender</label>
            <select value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {activeFilters > 0 && (
          <div style={{display:"flex",marginTop:14,paddingTop:12,borderTop:"1px solid var(--line)"}}>
            <button onClick={clearFilters} style={{
              background:"none",border:"none",color:"var(--pin)",cursor:"pointer",
              fontSize:12.5,fontFamily:"inherit",fontWeight:700,padding:0
            }}>x Clear filters ({activeFilters})</button>
          </div>
        )}
      </div>

      <div className="card">
        {loading ? <div className="loading-text">Loading...</div>
        : displayed.length === 0 ? <div className="review-empty">No results for the current filters.</div>
        : (
          <table>
            <tbody>
              <tr>
                <th>Student</th><th>Month</th><th>Status</th>
                <th>Note</th><th>Documentation</th><th></th>
              </tr>
              {displayed.map(u => (
                <>
                  <tr key={u.id}>
                    <td>
                      {u.student_name}
                      <div style={{fontSize:11,color:"#a39c8a"}}>{u.student_email}</div>
                    </td>
                    <td>{u.month_label}</td>
                    <td>
                      {u.status_type==="same"       && "Same boarding house"}
                      {u.status_type==="transferred" && `Transferred -> ${u.new_boarding_house_name||""}${u.new_barangay ? ` (${u.new_barangay})` : ""}`}
                      {u.status_type==="moved_home"  && "Moved back home"}
                    </td>
                    <td style={{maxWidth:200,fontSize:12,color:"#6b6457"}}>{u.note||"-"}</td>
                    <td>
                      {(u.photo_data_url || u.amenities_checklist) ? (
                        <button
                          className="btn"
                          style={{ fontSize:11, padding:"4px 8px", display:"flex", alignItems:"center", gap:6 }}
                          onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                        >
                          {u.photo_data_url && (
                            <img src={u.photo_data_url} alt=""
                              style={{ width:24, height:24, objectFit:"cover", borderRadius:4, border:"1px solid var(--line)" }} />
                          )}
                          {u.amenities_checklist && (
                            <span style={{ fontSize:10, color:"#6b6457" }}>
                              {u.amenities_checklist.split(",").filter(Boolean).length} amenities
                            </span>
                          )}
                          <span>{expandedId === u.id ? "Hide" : "View"}</span>
                        </button>
                      ) : <span style={{fontSize:11,color:"#a39c8a"}}>None</span>}
                    </td>
                    <td>
                      {u.is_flagged
                        ? <span className="badge warn" title={u.flag_reason}>Flagged</span>
                        : <button className="btn" style={{padding:"5px 10px",fontSize:11}}
                            onClick={() => handleFlag(u.id)}>Flag</button>
                      }
                    </td>
                  </tr>
                  {expandedId === u.id && (
                    <tr key={`doc-${u.id}`}>
                      <td colSpan={6} style={{background:"#faf9f5",padding:"10px 12px"}}>
                        {u.photo_data_url && (
                          <img src={u.photo_data_url} alt="Boarding house condition"
                            style={{maxWidth:280,borderRadius:8,border:"1px solid var(--line)"}} />
                        )}
                        {u.amenities_checklist && (
                          <div style={{marginTop: u.photo_data_url ? 10 : 0}}>
                            <strong style={{fontSize:12.5, color:"#3a352b"}}>Amenities present:</strong>
                            <div style={{display:"flex", flexWrap:"wrap", gap:6, marginTop:6}}>
                              {u.amenities_checklist.split(",").filter(Boolean).map((a, i) => (
                                <span key={i} className="badge" style={{background:"#eef3ee", color:"#2f5d4f"}}>
                                  {a.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
        {!loading && displayed.length > 0 && (
          <div style={{fontSize:11.5,color:"#a39c8a",marginTop:10}}>
            Showing {displayed.length} of {updates.length} record(s)
          </div>
        )}
      </div>
    </>
  );
}
