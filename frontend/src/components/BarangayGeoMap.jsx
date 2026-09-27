// src/components/BarangayGeoMap.jsx
//
// Barangay-scoped version of OsasGeoMap: one marker per student, but only
// for students currently boarding within this barangay account's own
// barangay. This is what makes "where exactly is this student dorming"
// visible to the barangay, the same way it's already visible to OSAS -
// previously a barangay account only saw a plain table with no map at all.

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api/client";
import BarangayContactLine from "./BarangayContactLine";

const FALLBACK_CENTER = [14.0711, 121.3204]; // San Pablo City area

function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

const greenIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "geotrack-marker-flagged",
});

export default function BarangayGeoMap({ height = 360 }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.barangay
      .geoMapPoints()
      .then(setPoints)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-text">Loading map...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  const center = points.length
    ? [
        points.reduce((s, p) => s + p.latitude, 0) / points.length,
        points.reduce((s, p) => s + p.longitude, 0) / points.length,
      ]
    : FALLBACK_CENTER;

  return (
    <div>
      <div style={{ height, borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)" }}>
        <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {points.map((p, i) => (
            <Marker
              key={i}
              position={[p.latitude, p.longitude]}
              icon={p.is_flagged ? redIcon : greenIcon}
            >
              <Popup>
                <strong>{p.student_name}</strong>
                <br />
                {p.boarding_house_name}
                <br />
                <span style={{ color: "#857d6c" }}>{p.barangay}</span>
                {p.is_flagged && (
                  <>
                    <br />
                    <span style={{ color: "#c1502e", fontWeight: 700 }}>Flagged</span>
                  </>
                )}
                <br />
                <BarangayContactLine barangay={p.barangay} />
                <a href={directionsUrl(p.latitude, p.longitude)} target="_blank" rel="noreferrer"
                  style={{ display:"inline-block", marginTop:6, fontWeight:700, color:"#2f5d4f" }}>
                  Get directions →
                </a>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {points.length === 0 && (
        <div style={{ padding: 12, fontSize: 12, color: "#857d6c", textAlign: "center" }}>
          No students with a linked boarding house location in your barangay yet.
        </div>
      )}
    </div>
  );
}
