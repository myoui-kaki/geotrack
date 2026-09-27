// src/pages/osas/OsasReports.jsx - multi-select grouping, charts, preview, PDF/Excel/CSV export
import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts";
import { api, API_BASE_URL } from "../../api/client";
import { toPng } from "html-to-image";

const MONTHS = [
  "",
  new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
  "July 2026",
  "June 2026",
  "May 2026",
  "April 2026"
];
const GROUP_OPTIONS = [
  { value:"boarding_house", label:"Boarding house (place name & barangay)" },
  { value:"gender",         label:"Gender" },
  { value:"department",     label:"Department (CCS, COE, CTE, ...)" },
  { value:"monthly_status", label:"Monthly status" },
];
const SECTION_LABELS = { boarding_house:"Boarding house (place name & barangay)",
  gender:"Gender", department:"Department", monthly_status:"Monthly status" };
const COLORS = ["#2f5d4f","#c1502e","#d4a017","#5a8a3c","#6b6457","#203f36","#e07b39","#3c7a5c"];

// The backend labels boarding-house rows as "Name (Barangay)" so the chart
// axis/legend reads fine as one string - this splits it back apart for the
// table, which shows Boarding House and Barangay as their own columns.
function splitHouseLabel(label) {
  const m = /^(.*) \(([^)]+)\)$/.exec(label);
  return m ? { house: m[1], barangay: m[2] } : { house: label, barangay: "" };
}

export default function OsasReports() {
  const [selected, setSelected] = useState(["boarding_house"]);
  const [monthLabel, setMonthLabel] = useState(new Date().toLocaleString("en-US", { 
  month: "long", 
  year: "numeric" 
}));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [narrative, setNarrative] = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  function toggleGroup(val) {
    setSelected(prev => prev.includes(val) ? prev.filter(v=>v!==val) : [...prev,val]);
    setReport(null);
  }
  function toggleAll() {
    setSelected(prev => prev.length===GROUP_OPTIONS.length ? [] : GROUP_OPTIONS.map(g=>g.value));
    setReport(null);
  }

  async function handleGenerate() {
    if (!selected.length) { setError("Select at least one grouping."); return; }
    setLoading(true); setError(""); setReport(null); setShowPreview(false); setNarrative(null);
    try {
      const data = await api.osas.generateTallyReport(selected, monthLabel||null);
      setReport(data); setShowPreview(true);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleGenerateNarrative(promptText) {
    if (!selected.length) { setError("Select at least one grouping."); return null; }
    setNarrativeLoading(true); setError("");
    try {
      const data = await api.osas.generateNarrativeReport(selected, monthLabel||null, promptText||null);
      setNarrative(data);
      return data;
    } catch(err) { setError(err.message); return null; }
    finally { setNarrativeLoading(false); }
  }

  async function handleChatSend() {
    const text = chatInput.trim();
    if (!text) return;
    const nextMessages = [...chatMessages, { role:"user", text }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatSending(true);
    try {
      if (!narrative) {
        // First message in the chat: there's no draft yet, so this message
        // is the writing prompt itself.
        const data = await handleGenerateNarrative(text);
        if (data) {
          setChatMessages(m => [...m, { role:"assistant", text:"Here's your draft narrative report. Tell me anything else you'd like me to add, remove, or change and I'll revise it." }]);
        } else {
          setChatMessages(m => [...m, { role:"assistant", text:"Sorry, I couldn't generate the report just now. Try again in a moment." }]);
        }
      } else {
        const data = await api.osas.chatNarrative(selected, monthLabel||null, narrative.narrative, nextMessages);
        setNarrative(prev => ({ ...prev, narrative: data.narrative, generated_by: data.generated_by }));
        setChatMessages(m => [...m, { role:"assistant", text: data.reply }]);
      }
    } catch(err) {
      setChatMessages(m => [...m, { role:"assistant", text: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setChatSending(false);
    }
  }

  const allChecked = selected.length === GROUP_OPTIONS.length;
  const someChecked = selected.length > 0 && !allChecked;

async function handleExport(fmt) {
  try {
    const token = localStorage.getItem("osas_token");

    const params = new URLSearchParams({
      group_by: selected.join(","),
    });

    if (monthLabel) {
      params.append("month_label", monthLabel);
    }

    const exportUrl = `${API_BASE_URL}/osas/reports/export/${fmt}?${params}`;

const response = await fetch(exportUrl, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

    if (!response.ok) {
  const text = await response.text();
  throw new Error(`Export failed (${response.status}): ${text}`);
}

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download =
      fmt === "pdf"
        ? "GeoTrack_Report.pdf"
        : fmt === "excel"
        ? "GeoTrack_Report.xlsx"
        : "GeoTrack_Report.csv";

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert(err.message);
  }
}

async function handleDownloadNarrativeDocx(selected, monthLabel, narrativeText) {
  const token = localStorage.getItem("osas_token");
  const url = `${API_BASE_URL}/osas/reports/narrative/download`;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ group_by: selected.join(","), month_label: monthLabel||null, narrative: narrativeText, messages: [] }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Download failed (${response.status}): ${text}`);
  }
  const blob = await response.blob();
  const objUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl; a.download = "GeoTrack_Narrative_Report.docx";
  document.body.appendChild(a); a.click(); a.remove();
  window.URL.revokeObjectURL(objUrl);
}

async function downloadCharts() {
  const node = document.getElementById("report-charts");

  if (!node) {
    alert("Charts not found");
    return;
  }

  try {
    const dataUrl = await toPng(node, {
      cacheBust: true,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = "GeoTrack_Charts.png";
    link.href = dataUrl;
    link.click();

  } catch (err) {
    console.error(err);
    alert("Failed to export charts");
  }
}

  return (
    <>
      <div className="osas-main-head no-print">
        <div>
          <div className="osas-main-title">Generate tally report</div>
          <div className="osas-main-sub">Select groupings, preview the report, then export as PDF, Excel, or CSV.</div>
        </div>
      </div>

      {error && <div className="error-banner no-print">{error}</div>}

      <div className="card no-print" style={{marginBottom:18}}>
        <div style={{display:"flex",gap:32,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:12.5,fontWeight:700,color:"#544f43",marginBottom:10}}>Group by</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:10,borderBottom:"1px solid var(--line)"}}>
              <input type="checkbox" id="chk-all" checked={allChecked}
                ref={el => { if(el) el.indeterminate = someChecked; }}
                onChange={toggleAll} style={{width:14,height:14,cursor:"pointer"}} />
              <label htmlFor="chk-all" style={{fontSize:12.5,fontWeight:700,cursor:"pointer",color:"var(--moss-dark)"}}>Select all</label>
            </div>
            {GROUP_OPTIONS.map(g => (
              <div key={g.value} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <input type="checkbox" id={`chk-${g.value}`} checked={selected.includes(g.value)}
                  onChange={() => toggleGroup(g.value)} style={{width:14,height:14,cursor:"pointer"}} />
                <label htmlFor={`chk-${g.value}`} style={{fontSize:13,cursor:"pointer",color:"#544f43"}}>{g.label}</label>
              </div>
            ))}
          </div>
          <div>
            <div className="field" style={{minWidth:200}}>
              <label>Month</label>
              <select value={monthLabel} onChange={e=>{setMonthLabel(e.target.value);setReport(null);}}>
                <option value="">All months</option>
                {MONTHS.filter(Boolean).map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{marginTop:16,display:"flex",gap:10,flexWrap:"wrap"}}>
          <button className="btn" onClick={handleGenerate} disabled={loading||!selected.length}>
            {loading ? "Generating..." : "Generate tally & charts"}
          </button>
          <button className="btn primary"
            disabled={!selected.length || narrativeLoading}
            onClick={async () => {
              const data = await handleGenerateNarrative(null);
              if (data) {
                setChatMessages([{ role:"assistant", text:"Here's your draft narrative report. Tell me anything you'd like me to add, remove, or change and I'll revise it." }]);
              }
            }}>
            {narrativeLoading ? "Generating..." : "Generate narrative report"}
          </button>
        </div>
      </div>

      {narrative && (
        <div className="card no-print" style={{marginBottom:18, borderLeft:"4px solid #2f5d4f"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10}}>
            <div className="panel-title" style={{marginBottom:8}}>
              AI report assistant
              {narrative.generated_by === "summary" && (
                <span style={{fontSize:11,color:"#a39c8a",fontWeight:400,marginLeft:8}}>
                  (templated summary - AI generation not configured)
                </span>
              )}
            </div>
            <div style={{display:"flex", gap:8}}>
              <button className="btn" style={{fontSize:11,padding:"5px 10px",whiteSpace:"nowrap"}}
                onClick={() => setChatOpen(true)}>
                Revise with assistant
              </button>
              <button className="btn" style={{fontSize:11,padding:"5px 10px",whiteSpace:"nowrap"}}
                onClick={async () => {
                  try {
                    await handleDownloadNarrativeDocx(selected, monthLabel, narrative.narrative);
                  } catch (err) {
                    alert(err.message);
                  }
                }}>
                Download as Word document
              </button>
            </div>
          </div>
          <div style={{fontSize:12,fontWeight:700,color:"#544f43",margin:"10px 0 4px"}}>Narrative report</div>
          <p style={{fontSize:13,color:"#3a352b",lineHeight:1.6}}>{narrative.narrative}</p>

          {narrative.photos && narrative.photos.length > 0 && (
            <div style={{ marginTop:16, borderTop:"1px solid var(--line)", paddingTop:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#544f43", marginBottom:2 }}>
                Supporting figures
              </div>
              <p style={{ fontSize:11.5, color:"#a39c8a", marginBottom:10 }}>
                Photos students have actually submitted as part of their monthly boarding house
                documentation - this is a tentative set of figures, not a full site-visitation report.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:14 }}>
                {narrative.photos.map((p, i) => (
                  <div key={i}>
                    <img src={p.photo_data_url} alt={p.caption}
                      style={{ width:"100%", height:110, objectFit:"cover", borderRadius:8, border:"1px solid var(--line)" }} />
                    <div style={{ fontSize:10.5, color:"#857d6c", marginTop:4, lineHeight:1.3 }}>{p.caption}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {chatOpen && (
        <div style={{
          position:"fixed", top:0, right:0, bottom:0, width:340, maxWidth:"92vw",
          background:"#fff", borderLeft:"1px solid var(--line)", boxShadow:"-6px 0 24px rgba(28,43,36,.15)",
          zIndex:50, display:"flex", flexDirection:"column",
        }} className="no-print">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid var(--line)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{
                width:28,height:28,borderRadius:"50%",background:"#2f5d4f",color:"#fff",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,
              }}>AI</span>
              <div style={{fontSize:13,fontWeight:700,color:"#3a352b"}}>Report assistant</div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#857d6c"}}>x</button>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
            {chatMessages.map((m,i) => (
              <div key={i} style={{
                alignSelf: m.role==="user" ? "flex-end" : "flex-start",
                background: m.role==="user" ? "#2f5d4f" : "#faf9f5",
                color: m.role==="user" ? "#fff" : "#3a352b",
                border: m.role==="user" ? "none" : "1px solid var(--line)",
                borderRadius:12, padding:"8px 12px", fontSize:12.5, maxWidth:"85%", lineHeight:1.5,
              }}>
                {m.text}
              </div>
            ))}
            {chatSending && <div style={{fontSize:11.5,color:"#a39c8a"}}>Revising the report...</div>}
          </div>

          <div style={{padding:12,borderTop:"1px solid var(--line)",display:"flex",gap:8}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && !chatSending) handleChatSend(); }}
              placeholder="e.g. add a paragraph about the barangay coordination..."
              style={{flex:1,fontSize:12.5,border:"1px solid var(--line)",borderRadius:20,padding:"8px 14px"}} />
            <button className="btn primary" style={{borderRadius:20,padding:"8px 14px"}}
              disabled={chatSending || !chatInput.trim()} onClick={handleChatSend}>
              Send
            </button>
          </div>
        </div>
      )}

      {showPreview && report && (
        <div id="tally-report-printable"> 
          {/* Charts */}
          {report.sections.length > 0 && (
  <div 
    id="report-charts"
      className="osas-grid"    
      style={{
      gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",
      gap:18,
      marginBottom:18
    }}
  >
              {report.sections.map(sec => {
                const yAxisWidth = Math.min(220, Math.max(90,
                  Math.max(0, ...sec.rows.map(r => r.group_label.length)) * 6));
                return (
                <div className="card" key={`chart-${sec.group_by}`}>
                  <div className="panel-title" style={{marginBottom:10}}>
                    {SECTION_LABELS[sec.group_by]||sec.group_by} - chart
                  </div>
                  {sec.rows.length === 0
                    ? <div className="review-empty">No data.</div>
                    : (sec.rows.length <= 5 && sec.group_by !== "boarding_house")
                    ? <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={sec.rows}
                            dataKey="count"
                            nameKey="group_label"
                            cx="40%"
                            cy="50%"
                            outerRadius={65}
                            label={({ count }) => count}
                            labelLine={false}
                          >
                            {sec.rows.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} Students`, "Total"]} />
                          <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12, lineHeight: "18px" }}
                            formatter={(value, entry) => `${value} (${entry.payload.count})`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    : <ResponsiveContainer width="100%" height={Math.max(160, sec.rows.length * 42)}>
                        <BarChart data={sec.rows} layout="vertical" margin={{top:5,right:34,left:10,bottom:5}}>
                          <XAxis type="number" tick={{fontSize:10}} allowDecimals={false} />
                          <YAxis type="category" dataKey="group_label" tick={{fontSize:10}} width={yAxisWidth} />
                          <Tooltip formatter={(value) => [`${value} Students`, "Total"]} />
                          <Bar dataKey="count" name="Students" fill="#2f5d4f" radius={[0,4,4,0]}>
                            <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#3a352b" }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                  }
                </div>
              );})}
            </div>
          )}

          {/* Tables */}
          {report.sections.map(sec => (
            <div className="card" key={sec.group_by} style={{marginBottom:18}}>
              <div className="panel-title">
                {SECTION_LABELS[sec.group_by]||sec.group_by}
                {report.month_label ? ` - ${report.month_label}` : " - All months"}
              </div>
              <table>
                <tbody>
                  {sec.group_by === "boarding_house" ? (
                    <tr><th>Boarding house</th><th>Barangay</th><th>Count</th><th>Amenities</th><th>Students</th></tr>
                  ) : (
                    <tr><th>{SECTION_LABELS[sec.group_by]}</th><th>Count</th><th>Students</th></tr>
                  )}
                  {sec.rows.length===0
                    ? <tr><td colSpan={sec.group_by==="boarding_house" ? 5 : 3} style={{color:"#a39c8a"}}>No data for this selection.</td></tr>
                    : sec.rows.map(row => sec.group_by === "boarding_house" ? (
                        (() => { const { house, barangay } = splitHouseLabel(row.group_label); return (
                          <tr key={row.group_label}>
                            <td style={{verticalAlign:"top"}}>{house}</td>
                            <td style={{verticalAlign:"top"}}>{barangay}</td>
                            <td style={{verticalAlign:"top"}}>{row.count}</td>
                            <td style={{fontSize:12,color:"#544f43",maxWidth:220}}>{row.amenities||"-"}</td>
                            <td style={{fontSize:12,color:"#544f43"}}>{row.student_names?.join(", ")||"-"}</td>
                          </tr>
                        ); })()
                      ) : (
                        <tr key={row.group_label}>
                          <td style={{verticalAlign:"top"}}>{row.group_label}</td>
                          <td style={{verticalAlign:"top"}}>{row.count}</td>
                          <td style={{fontSize:12,color:"#544f43"}}>{row.student_names?.join(", ")||"-"}</td>
                        </tr>
                    ))}
                  {sec.group_by === "boarding_house" ? (
                    <tr><td style={{fontWeight:700}}>Total</td><td></td><td style={{fontWeight:700}}>{sec.total}</td><td></td><td></td></tr>
                  ) : (
                    <tr><td style={{fontWeight:700}}>Total</td><td style={{fontWeight:700}}>{sec.total}</td><td></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}

          <div className="no-print" style={{display:"flex",gap:10,marginBottom:18,position:"relative"}}>
            <div style={{position:"relative"}}>
              <button className="btn primary" onClick={() => setShowDownloadMenu(v => !v)}>
                Downloads {showDownloadMenu ? "▾" : "▴"}
              </button>
              {showDownloadMenu && (
                <div style={{
                  position:"absolute", bottom:"calc(100% + 4px)", left:0, zIndex:20,
                  background:"#fff", border:"1px solid var(--line)", borderRadius:10,
                  boxShadow:"0 -8px 24px rgba(28,43,36,.15)", minWidth:170, overflow:"hidden",
                }}>
                  {[
                    ["PDF", () => handleExport("pdf")],
                    ["Excel", () => handleExport("excel")],
                    ["CSV", () => handleExport("csv")],
                    ["Charts (PNG)", downloadCharts],
                  ].map(([label, fn]) => (
                    <button key={label} className="btn" style={{
                      display:"block", width:"100%", textAlign:"left", border:"none",
                      borderRadius:0, padding:"10px 14px", fontSize:12.5,
                    }} onClick={() => { fn(); setShowDownloadMenu(false); }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
