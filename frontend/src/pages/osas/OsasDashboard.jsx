// src/pages/osas/OsasDashboard.jsx
// The dashboard is the report, shown as live charts: students per boarding
// house, students per barangay, boarding houses per barangay, sex, and
// every department (zero when empty).
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts";
import { api } from "../../api/client";
import MonthFilterDropdown from "../../components/MonthFilterDropdown";

const GROUPS = ["boarding_house", "barangay", "barangay_houses", "gender", "department"];
const TITLES = {
  boarding_house: "Students per boarding house",
  barangay: "Students per barangay",
  barangay_houses: "Boarding houses per barangay",
  gender: "Students by sex",
  department: "Students by department",
};
const COLORS = ["#2f5d4f", "#c1502e", "#d4a017", "#5a8a3c", "#6b6457", "#203f36", "#e07b39", "#3c7a5c"];

function Kpi({ label, value, tone }) {
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 11.5, color: "#857d6c", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: tone || "var(--moss-dark)", lineHeight: 1.2 }}>{value ?? "-"}</div>
    </div>
  );
}

function Chart({ sec }) {
  const unit = sec.group_by === "barangay_houses" ? "Boarding houses" : "Students";
  if (!sec.rows.length) return <div className="review-empty">No data.</div>;
  if (sec.group_by === "gender") {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={sec.rows} dataKey="count" nameKey="group_label" cx="40%" cy="50%" outerRadius={70}
            label={({ count }) => count} labelLine={false}>
            {sec.rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={v => [`${v} Students`, "Total"]} />
          <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle"
            wrapperStyle={{ fontSize: 12 }} formatter={(v, e) => `${v} (${e.payload.count})`} />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  const w = Math.min(220, Math.max(90, Math.max(0, ...sec.rows.map(r => r.group_label.length)) * 6));
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, sec.rows.length * 38)}>
      <BarChart data={sec.rows} layout="vertical" margin={{ top: 5, right: 34, left: 10, bottom: 5 }}>
        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
        <YAxis type="category" dataKey="group_label" tick={{ fontSize: 10 }} width={w} interval={0} />
        <Tooltip formatter={v => [v, unit]} />
        <Bar dataKey="count" name={unit} fill="#2f5d4f" radius={[0, 4, 4, 0]}>
          <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#3a352b" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function OsasDashboard() {
  const [month, setMonth] = useState(new Date().toLocaleString("en-US", { month: "long", year: "numeric" }));
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.osas.dashboard().then(setStats).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    setLoading(true);
    api.osas.generateTallyReport(GROUPS, month || null)
      .then(r => { setReport(r); setError(""); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Dashboard</div>
          <div className="osas-main-sub">Live report charts{month ? ` as of ${month}` : " for all months"}.</div>
        </div>
        <MonthFilterDropdown month={month} onChange={setMonth} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {stats && (
        <div className="osas-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 18 }}>
          <Kpi label="Total students" value={stats.total_students} />
          <Kpi label="Status updates submitted" value={stats.updates_submitted} />
          <Kpi label="Waiting for OSAS approval" value={stats.pending_verifications} tone="#d4a017" />
          <Kpi label="Active emergencies" value={stats.active_emergencies} tone={stats.active_emergencies ? "#c1502e" : undefined} />
        </div>
      )}

      {loading && !report ? <div className="loading-text">Loading...</div> : report && (
        <div className="osas-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 18 }}>
          {report.sections.map(sec => (
            <div className="card" key={sec.group_by}>
              <div className="panel-title" style={{ marginBottom: 4 }}>{TITLES[sec.group_by] || sec.title}</div>
              <div style={{ fontSize: 11.5, color: "#857d6c", marginBottom: 10 }}>
                Total: {sec.total}
              </div>
              <Chart sec={sec} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
