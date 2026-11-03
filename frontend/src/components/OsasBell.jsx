// src/components/OsasBell.jsx - notification bell (top right) listing what OSAS still has to do.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function OsasBell() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  function load() { api.osas.actionItems().then(setData).catch(() => {}); }
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    function away(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const total = data?.total || 0;
  function go(path) { setOpen(false); navigate(path); }

  const Section = ({ title, count, children }) => (
    <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--moss-dark)", marginBottom: 4 }}>
        {title} <span style={{ color: "#c1502e" }}>({count})</span>
      </div>
      {children}
    </div>
  );
  const Row = ({ children, onClick }) => (
    <div onClick={onClick} style={{ fontSize: 12.5, padding: "3px 0", cursor: onClick ? "pointer" : "default", color: "#3a352b" }}>{children}</div>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" aria-label="Notifications" onClick={() => { setOpen(v => !v); if (!open) load(); }}
        style={{ position: "relative", background: "#fff", border: "1px solid var(--line)", borderRadius: 12,
                 width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {total > 0 && (
          <span style={{ position: "absolute", top: -5, right: -5, background: "#c1502e", color: "#fff",
                         borderRadius: 10, fontSize: 10.5, fontWeight: 700, padding: "2px 6px", minWidth: 18, textAlign: "center" }}>
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: 50, width: 330, maxWidth: "calc(100vw - 32px)", maxHeight: "70vh",
                      overflowY: "auto", background: "#fff", border: "1px solid var(--line)", borderRadius: 14,
                      boxShadow: "0 12px 32px rgba(28,43,36,.2)", zIndex: 500 }}>
          <div style={{ padding: "12px 14px", fontWeight: 700, borderBottom: "1px solid var(--line)" }}>
            To do{data?.month ? ` - ${data.month}` : ""}
          </div>
          {!data ? <div className="loading-text" style={{ padding: 14 }}>Loading...</div>
          : total === 0 ? <div className="review-empty" style={{ padding: 16 }}>You're all caught up.</div> : (
            <>
              {data.active_emergencies > 0 && (
                <Section title="Active emergency / SOS cases" count={data.active_emergencies}>
                  <Row onClick={() => go("/osas/emergencies")}>Open the SOS cases →</Row>
                </Section>
              )}
              {data.houses_to_verify.length > 0 && (
                <Section title="Boarding houses to verify" count={data.houses_to_verify.length}>
                  {data.houses_to_verify.slice(0, 6).map(h => (
                    <Row key={h.id} onClick={() => go("/osas/housing-oversight")}>{h.name} <span style={{ color: "#857d6c" }}>- {h.barangay}</span></Row>
                  ))}
                  {data.houses_to_verify.length > 6 && <Row onClick={() => go("/osas/housing-oversight")}>+{data.houses_to_verify.length - 6} more →</Row>}
                </Section>
              )}
              {data.students_to_update.length > 0 && (
                <Section title="Students who still need to update" count={data.students_to_update.length}>
                  {data.students_to_update.slice(0, 6).map(s => (
                    <Row key={s.id} onClick={() => go("/osas/status-updates")}>{s.name}</Row>
                  ))}
                  {data.students_to_update.length > 6 && <Row onClick={() => go("/osas/status-updates")}>+{data.students_to_update.length - 6} more →</Row>}
                </Section>
              )}
              {data.flagged_updates > 0 && (
                <Section title="Flagged status updates" count={data.flagged_updates}>
                  <Row onClick={() => go("/osas/status-updates")}>Review flagged students →</Row>
                </Section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
