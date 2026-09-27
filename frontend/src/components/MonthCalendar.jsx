// src/components/MonthCalendar.jsx
//
// A full calendar-grid month picker - year dropdown, month dropdown with
// prev/next arrows, a "Today" jump button, and a day grid below (Mon-Sun)
// so it looks and behaves like an actual calendar rather than a plain
// list of month names. Since every page that uses this only cares about
// month granularity, clicking any day in the grid just resolves to that
// day's month - there's no separate "day" concept being tracked.
//
// Used as: <MonthCalendar year={y} month={m} onSelect={(y,m)=>...} />
// `month` is 0-indexed (0 = January), matching JS Date conventions.

import { useState } from "react";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first weekday index (0=Mon ... 6=Sun) for the 1st of the month.
function firstWeekdayMon(year, month) {
  const jsDay = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
  return (jsDay + 6) % 7;
}

export function monthLabel(year, month) {
  return `${MONTH_NAMES[month]} ${year}`;
}

export default function MonthCalendar({ year, month, onSelect, minYear = 2019, maxYear = new Date().getFullYear() + 1 }) {
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const years = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  function go(deltaMonths) {
    let m = month + deltaMonths;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    onSelect(y, m);
  }

  const totalDays = daysInMonth(year, month);
  const leadBlanks = firstWeekdayMon(year, month);
  const cells = [];
  for (let i = 0; i < leadBlanks; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ background:"#fff", border:"1px solid var(--line)", borderRadius:12, padding:14, minWidth:280 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <select value={year} onChange={(e) => onSelect(parseInt(e.target.value), month)}
          style={{ fontSize:12.5, padding:"5px 6px" }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button type="button" className="btn" style={{ padding:"4px 8px", fontSize:12 }} onClick={() => go(-1)}>‹</button>
        <select value={month} onChange={(e) => onSelect(year, parseInt(e.target.value))}
          style={{ fontSize:12.5, padding:"5px 6px", flex:1, minWidth:90 }}>
          {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <button type="button" className="btn" style={{ padding:"4px 8px", fontSize:12 }} onClick={() => go(1)}>›</button>
        <button type="button" className="btn" style={{ padding:"4px 10px", fontSize:11.5 }}
          onClick={() => onSelect(today.getFullYear(), today.getMonth())}>
          Today
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ fontSize:10, fontWeight:700, color:"#a39c8a", textAlign:"center" }}>{w}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((d, i) => {
          const isToday = isCurrentMonth && d === today.getDate();
          return (
            <div key={i} onClick={() => d && onSelect(year, month)} style={{
              aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12.5, borderRadius:6, cursor: d ? "pointer" : "default",
              color: d ? "#3a352b" : "transparent",
              border: isToday ? "1.5px solid var(--moss-dark)" : "1.5px solid transparent",
              fontWeight: isToday ? 700 : 400,
            }}>
              {d || "."}
            </div>
          );
        })}
      </div>
    </div>
  );
}
