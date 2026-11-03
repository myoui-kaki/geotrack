// src/components/MonthFilterDropdown.jsx
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import MonthCalendar, { monthLabel } from "./MonthCalendar";

// Dropdown button that opens the month calendar right under it. The panel is
// rendered on document.body (so no card/overflow can clip it) and placed with
// page coordinates, so it stays attached to the button even when the page is
// scrolled sideways.
export default function MonthFilterDropdown({ month, onChange }) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [pos, setPos] = useState({ top:0, left:0, width:340 });
  const btnRef = useRef(null);

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const sx = window.scrollX || 0, sy = window.scrollY || 0;
      const vw = document.documentElement.clientWidth;
      const width = Math.min(340, vw - 16);
      const left = sx + Math.max(8, Math.min(r.left, vw - width - 8));
      setPos({ top: sy + r.bottom + 4, left, width });
    }
    setOpen(v => !v);
  }

  return (
    <div>
      <button ref={btnRef} type="button" className="btn"
        style={{ minWidth:170, textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}
        onClick={toggle}>
        <span>📅 {month || "All months"}</span>
        <span style={{ color:"#a39c8a" }}>{open ? "▴" : "▾"}</span>
      </button>
      {open && createPortal(
        <>
          <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:1000, background:"transparent" }} />
          <div style={{
            position:"absolute", top:pos.top, left:pos.left, width:pos.width, zIndex:1001,
            background:"#fff", border:"1px solid var(--line)", borderRadius:12,
            boxShadow:"0 8px 24px rgba(28,43,36,.18)", padding:12, boxSizing:"border-box",
          }}>
            <MonthCalendar year={viewYear} month={viewMonth} onSelect={(y,m) => {
              setViewYear(y); setViewMonth(m); onChange(monthLabel(y, m)); setOpen(false);
            }} />
            <button type="button" className="btn" style={{ width:"100%", marginTop:8, fontSize:12 }}
              onClick={() => { onChange(""); setOpen(false); }}>
              Clear (show all months)
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

