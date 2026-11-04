// src/components/BarangaySelect.jsx
// Searchable dropdown of every San Pablo City barangay. Click the box, type to
// filter (e.g. "remed"), then pick one. Only listed barangays can be chosen.
import { useEffect, useRef, useState } from "react";
import { SAN_PABLO_BARANGAYS } from "../data/sanPabloBarangays";

const norm = s => (s || "").toLowerCase().replace(/[.]/g, " ").replace(/\b(brgy|barangay)\b/g, " ").replace(/\s+/g, " ").trim();

export default function BarangaySelect({ value, onChange, placeholder = "Select barangay", disabled }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function away(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const nq = norm(q);
  const list = SAN_PABLO_BARANGAYS.filter(b => !nq || norm(b).includes(nq));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={open ? q : (value || "")}
        placeholder={open ? "Type to search..." : placeholder}
        disabled={disabled}
        readOnly={!open}
        onFocus={() => { setQ(""); setOpen(true); }}
        onClick={() => { if (!open) { setQ(""); setOpen(true); } }}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); if (list.length) { onChange(list[0]); setOpen(false); } }
          if (e.key === "Escape") setOpen(false);
        }}
        style={{ cursor: "pointer" }}
        autoComplete="off"
      />
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#a39c8a", pointerEvents: "none" }}>
        {open ? "▴" : "▾"}
      </span>
      {open && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4, zIndex: 3000,
          background: "#fff", border: "1px solid var(--line)", borderRadius: 12,
          boxShadow: "0 8px 24px rgba(28,43,36,.18)", maxHeight: 240, overflowY: "auto",
        }}>
          {list.length === 0
            ? <div style={{ padding: 12, fontSize: 13, color: "#857d6c" }}>No barangay found.</div>
            : list.map(b => (
              <div key={b} onMouseDown={e => { e.preventDefault(); onChange(b); setOpen(false); }}
                style={{ padding: "9px 12px", fontSize: 13.5, cursor: "pointer",
                         background: b === value ? "#eef3ee" : "transparent", fontWeight: b === value ? 700 : 400 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f6f4ee")}
                onMouseLeave={e => (e.currentTarget.style.background = b === value ? "#eef3ee" : "transparent")}>
                {b}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
