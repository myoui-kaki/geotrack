// src/pages/osas/OsasTabbedPage.jsx
//
// Shared wrapper that lets several previously-separate OSAS admin pages
// live under one sidebar entry as tabs. Each existing page component is
// reused as-is (same state, same API calls, same title/subtitle it always
// had) - this only changes how they're grouped and navigated to, so
// nothing about how any individual feature works has changed.
//
// The sidebar went from 13 entries to a shorter list because several pages
// covered closely related ground (e.g. two different "how is this student
// doing" views, or two different "things a student reported" views) and
// were easier to scan side-by-side as tabs than as separate top-level pages.

import { useState } from "react";

export default function OsasTabbedPage({ tabs, defaultTab = 0 }) {
  const [active, setActive] = useState(defaultTab);
  const ActiveComponent = tabs[active].Component;

  return (
    <>
      <div className="pill-row" style={{ marginBottom: 20 }}>
        {tabs.map((t, i) => (
          <button
            key={t.label}
            className="btn"
            onClick={() => setActive(i)}
            style={{
              fontSize: 12.5,
              padding: "8px 16px",
              fontWeight: 700,
              background: active === i ? "var(--moss-dark)" : "transparent",
              color: active === i ? "#fff" : "inherit",
              borderColor: active === i ? "var(--moss-dark)" : undefined,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </>
  );
}

