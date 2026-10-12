// src/components/CalendarPopover.jsx
//
// Floating panel for the month calendar. It is rendered into document.body
// (a portal) and positioned with position:fixed from the trigger button's
// on-screen rect. The old version was an absolutely-positioned child inside
// the form card, so it could get clipped by scrolling/overflow containers,
// painted underneath later cards (every .card is its own stacking context
// because of its fade-in animation), and picked up the form's global
// ".field select" styles. Out here none of that applies.
//
// Usage:
//   const btnRef = useRef(null);
//   <button ref={btnRef} onClick={() => setOpen(v => !v)}>...</button>
//   <CalendarPopover open={open} onClose={() => setOpen(false)} anchorRef={btnRef}>
//     <MonthCalendar ... />
//   </CalendarPopover>

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function CalendarPopover({ open, onClose, anchorRef, children, width = 340 }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);

  function place() {
    const a = anchorRef?.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(width, vw - 16);
    const left = Math.min(Math.max(8, r.left), vw - w - 8);
    const h = panelRef.current?.offsetHeight || 380;
    let top = r.bottom + 6;
    if (top + h > vh - 8) top = Math.max(8, r.top - h - 6);   // flip above if no room below
    setPos({ top, left, width: w });
  }

  useLayoutEffect(() => { if (open) place(); /* eslint-disable-next-line */ }, [open, children]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(28,43,36,.22)" }} />
      <div ref={panelRef} role="dialog" aria-label="Choose month" style={{
        position:"fixed", top: pos ? pos.top : 0, left: pos ? pos.left : 0,
        width: pos ? pos.width : width, zIndex:2001, visibility: pos ? "visible" : "hidden",
        background:"#fff", border:"1px solid var(--line)", borderRadius:12,
        boxShadow:"0 12px 32px rgba(28,43,36,.28)", padding:12,
        maxHeight:"calc(100vh - 16px)", overflowY:"auto",
      }}>
        {children}
      </div>
    </>,
    document.body
  );
}
