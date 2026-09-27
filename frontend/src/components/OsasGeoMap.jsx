// src/components/OsasGeoMap.jsx
//
// Interactive Leaflet map for the OSAS dashboard: one marker per student
// at their most recently confirmed boarding house (red = flagged, green =
// everyone else). Each marker's popup includes a "Get directions" link
// (opens Google Maps directions to that exact point) so OSAS or a
// barangay account can find the place themselves without needing to ask
// the student or landlord for directions.
//
// A "Show density heatmap" checkbox layers a heat overlay on top of the
// markers - it's an optional add-on, not a separate view that replaces
// the markers, so both are visible together when turned on.

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { api } from "../api/client";
import BarangayContactLine from "./BarangayContactLine";

// Centered on the Brgy. Del Remedio boarding-house cluster - that's where
// OSAS's permit-verification workflow is active for now, so this is the
// area for the map to open on and show clearly.
const CAMPUS_CENTER = [14.0711, 121.3204];

function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// Leaflet's default marker icon path breaks under Vite's bundling unless
// pointed at the package's own asset URLs explicitly.
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
  className: "geotrack-marker-flagged", // tinted red via CSS filter, see osas.css
});

// Renders (and cleans up) a leaflet.heat layer on the parent map. This has
// to be a child of <MapContainer> so useMap() can reach the underlying
// Leaflet map instance - react-leaflet has no built-in heatmap component.
function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    if (points.length === 0) return;
    layerRef.current = L.heatLayer(
      points.map(p => [p.latitude, p.longitude, p.is_flagged ? 1 : 0.6]),
      { radius: 28, blur: 22, maxZoom: 17, gradient: { 0.3: "#5a8a3c", 0.6: "#d4a017", 1: "#c1502e" } }
    ).addTo(map);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
  }, [map, points]);

  return null;
}

export default function OsasGeoMap({ height = 360 }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    api.osas
      .geoMapPoints()
      .then(setPoints)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-text">Loading map...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div>
      <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, fontSize:12.5, cursor:"pointer" }}>
        <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />
        Show density heatmap (on top of markers)
      </label>

      <div style={{ height, borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)" }}>
        <MapContainer center={CAMPUS_CENTER} zoom={16} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Reference point for the Brgy. Del Remedio boarding-house cluster */}
          <Circle center={CAMPUS_CENTER} radius={150} pathOptions={{ color: "#2f5d4f", fillOpacity: 0.15 }}>
            <Popup>Brgy. Del Remedio</Popup>
          </Circle>

          {showHeatmap && <HeatLayer points={points} />}

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
          No students with a linked boarding house location yet.
        </div>
      )}
    </div>
  );
}
