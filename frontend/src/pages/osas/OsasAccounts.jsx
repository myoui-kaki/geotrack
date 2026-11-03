// src/pages/osas/OsasAccounts.jsx
//
// Account management: OSAS staff, Students, Barangay accounts, plus an
// Archived tab. Accounts are never deleted - they are archived (and can be
// restored), and the Archived tab shows when each was archived and what the
// account did (its activity history).

import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { dialog } from "../../components/dialogs";

const fmt = d => (d ? new Date(d).toLocaleString() : "-");
const ROLE_LABEL = { osas_admin: "OSAS staff", student: "Student", barangay: "Barangay" };
const btn = { padding: "5px 10px", fontSize: 11, marginRight: 4 };

export default function OsasAccounts() {
  const { fullName } = useAuth();
  const [tab, setTab] = useState("osas"); // osas | students | barangay | archived
  const [archFilter, setArchFilter] = useState("");

  const [osasAccounts, setOsasAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [historyFor, setHistoryFor] = useState(null); // { account, history }

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    Promise.all([
      api.osas.listAccounts(),
      api.osas.listStudents({ is_archived: false }),
      api.osas.listBarangayAccounts(),
      api.osas.archivedAccounts(),
    ])
      .then(([a, s, b, ar]) => { setOsasAccounts(a); setStudents(s); setBarangays(b); setArchived(ar); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function run(fn) {
    try { await fn(); load(); } catch (err) { setError(err.message); }
  }

  async function archive(kind, id, name) {
    if (!(await dialog.confirm({
      title: "Archive this account?",
      message: `${name} will lose access and move to the Archived tab. You can restore it any time.`,
      confirmText: "Archive",
    }))) return;
    run(() => kind === "osas" ? api.osas.archiveAccount(id)
            : kind === "student" ? api.osas.archiveStudent(id)
            : api.osas.archiveBarangayAccount(id));
  }

  async function restore(a) {
    if (!(await dialog.confirm({ title:"Restore this account?", message:`${a.full_name} will be able to sign in again.`, confirmText:"Restore" }))) return;
    run(() => a.role === "osas_admin" ? api.osas.unarchiveAccount(a.id)
            : a.role === "student" ? api.osas.unarchiveStudent(a.id)
            : api.osas.unarchiveBarangayAccount(a.id));
  }

  async function openHistory(id) {
    try { setHistoryFor(await api.osas.accountHistory(id)); }
    catch (err) { setError(err.message); }
  }

  function startEdit(account) {
    setEditingId(account.id);
    setEditForm({ full_name: account.full_name, position: account.position || "" });
  }
  async function saveEdit(id) {
    try { await api.osas.updateAccount(id, editForm); setEditingId(null); load(); }
    catch (err) { setError(err.message); }
  }

  const shownArchived = archFilter ? archived.filter(a => a.role === archFilter) : archived;
  const tabs = [
    ["osas", `OSAS staff (${osasAccounts.length})`],
    ["students", `Students (${students.length})`],
    ["barangay", `Barangay (${barangays.length})`],
    ["archived", `Archived (${archived.length})`],
  ];

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Account management</div>
          <div className="osas-main-sub">OSAS staff, student and barangay accounts. Accounts are archived, not deleted.</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {tabs.map(([k, l]) => (
          <button key={k} className={`btn ${tab === k ? "primary" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {loading ? <div className="loading-text">Loading...</div> : tab === "osas" ? (
        <div className="card" style={{ overflowX: "auto" }}>
          <div className="panel-title">OSAS staff accounts</div>
          <table>
            <tbody>
              <tr><th>Name</th><th>Email</th><th>Position</th><th>Contact number</th><th>Status</th><th></th></tr>
              {osasAccounts.map(a => (
                <tr key={a.id}>
                  {editingId === a.id ? (
                    <>
                      <td><input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} style={{ width: "100%", fontSize: 12, padding: 4 }} /></td>
                      <td style={{ fontSize: 12, color: "#a39c8a" }}>{a.email}</td>
                      <td><input value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })} style={{ width: "100%", fontSize: 12, padding: 4 }} /></td>
                      <td>{a.contact_number || "-"}</td>
                      <td>{a.full_name === fullName && <span className="badge ok">You</span>}</td>
                      <td>
                        <button className="btn primary" style={btn} onClick={() => saveEdit(a.id)}>Save</button>
                        <button className="btn" style={btn} onClick={() => setEditingId(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{a.full_name}</td>
                      <td style={{ fontSize: 12, color: "#857d6c" }}>{a.email}</td>
                      <td>{a.position || "-"}</td>
                      <td>{a.contact_number || "-"}</td>
                      <td>{a.full_name === fullName && <span className="badge ok">You</span>}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn" style={btn} onClick={() => startEdit(a)}>Edit</button>
                        {a.full_name !== fullName && (
                          <button className="btn" style={{ ...btn, color: "var(--pin)" }} onClick={() => archive("osas", a.id, a.full_name)}>Archive</button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: "#a39c8a", marginTop: 10 }}>
            New OSAS accounts are created through the registration form on the OSAS login page.
          </div>
        </div>
      ) : tab === "students" ? (
        <div className="card" style={{ overflowX: "auto" }}>
          <div className="panel-title">Student accounts</div>
          {students.length === 0 ? <div className="review-empty">No active students.</div> : (
            <table>
              <tbody>
                <tr><th>Name</th><th>Email</th><th>Course &amp; section</th><th>Department</th><th>Sex</th><th>Joined</th><th></th></tr>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>{s.full_name}</td>
                    <td style={{ fontSize: 12, color: "#857d6c" }}>{s.email}</td>
                    <td>{s.course_section || "-"}</td>
                    <td>{s.department || "-"}</td>
                    <td style={{ textTransform: "capitalize" }}>{s.gender || "-"}</td>
                    <td style={{ fontSize: 12, color: "#a39c8a" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td><button className="btn" style={{ ...btn, color: "var(--pin)" }} onClick={() => archive("student", s.id, s.full_name)}>Archive</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ fontSize: 11, color: "#a39c8a", marginTop: 10 }}>
            Students are also archived automatically after 3 years without a boarding-house status update.
          </div>
        </div>
      ) : tab === "barangay" ? (
        <div className="card" style={{ overflowX: "auto" }}>
          <div className="panel-title">Barangay accounts</div>
          {barangays.length === 0 ? <div className="review-empty">No barangay accounts yet.</div> : (
            <table>
              <tbody>
                <tr><th>Name</th><th>Barangay</th><th>Position</th><th>Contact number</th><th>Email</th><th></th></tr>
                {barangays.map(b => (
                  <tr key={b.id}>
                    <td>{b.full_name}</td>
                    <td>{b.barangay_name || "-"}</td>
                    <td>{b.position || "-"}</td>
                    <td>{b.contact_number || "-"}</td>
                    <td style={{ fontSize: 12, color: "#857d6c" }}>{b.email}</td>
                    <td><button className="btn" style={{ ...btn, color: "var(--pin)" }} onClick={() => archive("barangay", b.id, b.full_name)}>Archive</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            <div className="panel-title" style={{ marginBottom: 0 }}>Archived accounts</div>
            <select value={archFilter} onChange={e => setArchFilter(e.target.value)} style={{ fontSize: 12.5, padding: "6px 10px" }}>
              <option value="">All (OSAS, Students, Barangay)</option>
              <option value="osas_admin">OSAS staff</option>
              <option value="student">Students</option>
              <option value="barangay">Barangay</option>
            </select>
          </div>
          {shownArchived.length === 0 ? <div className="review-empty">No archived accounts.</div> : (
            <table>
              <tbody>
                <tr><th>Name</th><th>Type</th><th>Email</th><th>Details</th><th>Archived on</th><th></th></tr>
                {shownArchived.map(a => (
                  <tr key={a.id}>
                    <td>{a.full_name}</td>
                    <td><span className="badge pending">{ROLE_LABEL[a.role] || a.role}</span></td>
                    <td style={{ fontSize: 12, color: "#857d6c" }}>{a.email}</td>
                    <td style={{ fontSize: 12, color: "#6b6457" }}>
                      {a.role === "student" ? [a.course_section, a.department].filter(Boolean).join(" · ") || "-"
                        : [a.position, a.barangay_name, a.contact_number].filter(Boolean).join(" · ") || "-"}
                    </td>
                    <td style={{ fontSize: 12 }}>{fmt(a.archived_at)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn" style={btn} onClick={() => openHistory(a.id)}>History</button>
                      <button className="btn primary" style={btn} onClick={() => restore(a)}>Restore</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {historyFor && (
        <div onClick={() => setHistoryFor(null)} style={{
          position: "fixed", inset: 0, background: "rgba(20,30,25,.45)", zIndex: 2000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 620, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div className="panel-title" style={{ marginBottom: 2 }}>{historyFor.account.full_name}</div>
                <div style={{ fontSize: 12, color: "#857d6c" }}>
                  {ROLE_LABEL[historyFor.account.role] || historyFor.account.role} · {historyFor.account.email}
                </div>
              </div>
              <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => setHistoryFor(null)}>Close</button>
            </div>
            <div style={{ fontSize: 12.5, margin: "12px 0", lineHeight: 1.7 }}>
              <div><b>Account created:</b> {fmt(historyFor.account.created_at)}</div>
              <div><b>Archived on:</b> {fmt(historyFor.account.archived_at)}</div>
              {historyFor.account.course_section && <div><b>Course &amp; section:</b> {historyFor.account.course_section}</div>}
              {historyFor.account.department && <div><b>Department:</b> {historyFor.account.department}</div>}
              {historyFor.account.position && <div><b>Position:</b> {historyFor.account.position}</div>}
              {historyFor.account.barangay_name && <div><b>Barangay:</b> {historyFor.account.barangay_name}</div>}
              {historyFor.account.contact_number && <div><b>Contact:</b> {historyFor.account.contact_number}</div>}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#544f43", marginBottom: 6 }}>Activity history</div>
            {historyFor.history.length === 0 ? <div className="review-empty">No recorded activity.</div> : (
              <table>
                <tbody>
                  <tr><th>When</th><th>Action</th><th>Details</th></tr>
                  {historyFor.history.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{fmt(h.created_at)}</td>
                      <td style={{ fontSize: 12, textTransform: "capitalize" }}>{h.action} {h.resource_type?.replace("_", " ")}</td>
                      <td style={{ fontSize: 12, color: "#6b6457" }}>
                        {[h.resource_label, h.detail].filter(Boolean).join(" - ") || "-"}
                        {h.actor_name && <div style={{ fontSize: 10.5, color: "#a39c8a" }}>by {h.actor_name}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  );
}
