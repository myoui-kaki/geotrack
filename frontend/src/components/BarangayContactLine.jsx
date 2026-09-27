// src/components/BarangayContactLine.jsx
//
// A collapsed "Barangay contact" toggle used inside map popups and
// directory rows - lets a student or OSAS user look up the barangay
// chairman's name and number for a given barangay on demand, instead of
// relying on the base map tile's own (often overlapping/unreadable)
// barangay name labels. Fetched lazily on click, not on mount, since
// several of these can appear on one page (one per map marker).
import { useState } from "react";
import { api } from "../api/client";

export default function BarangayContactLine({ barangay }) {
  const [state, setState] = useState("idle"); // idle | loading | loaded | error
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  function reveal() {
    setState("loading");
    api.student.barangayInfo(barangay)
      .then((d) => { setInfo(d); setState("loaded"); })
      .catch((err) => { setError(err.message); setState("error"); });
  }

  if (!barangay) return null;

  if (state === "idle") {
    return (
      <button
        onClick={reveal}
        style={{
          background: "none", border: "none", padding: 0, marginTop: 4,
          color: "#2f5d4f", fontWeight: 700, fontSize: 12, cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Barangay contact →
      </button>
    );
  }
  if (state === "loading") {
    return <div style={{ fontSize: 12, color: "#857d6c", marginTop: 4 }}>Loading barangay contact...</div>;
  }
  if (state === "error") {
    return <div style={{ fontSize: 12, color: "#c1502e", marginTop: 4 }}>{error}</div>;
  }
  return (
    <div style={{ fontSize: 12, marginTop: 4 }}>
      <span style={{ color: "#857d6c" }}>Barangay chairman: </span>
      <strong>{info.chairman_name}</strong>
      {info.contact_number && (
        <>
          <br />
          <span style={{ color: "#857d6c" }}>{info.contact_number}</span>
        </>
      )}
    </div>
  );
}
