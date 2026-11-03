// src/components/OsasGeoMap.jsx
//
// OSAS map: every barangay gets a circle, and the pins inside it are the
// boarding houses located in that barangay (not students). The circle is
// drawn around that barangay's boarding houses, so it grows to cover them.

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api/client";

const DEFAULT_CENTER = [14.0711, 121.3204];

const COLORS = ["#2f5d4f", "#c1502e", "#2f6fa8", "#a8762f", "#7a4fa0", "#2f8f8f", "#8f2f5d", "#5d8f2f"];

const pinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// metres between two lat/lng points (equirectangular approximation is plenty here)
function metres(a, b) {
  const dLat = (b[0] - a[0]) * 111320;
  const dLng = (b[1] - a[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export default function OsasGeoMap({ height = 520 }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.osas.listBoardingHouses()
      .then(setHouses)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const { groups, center } = useMemo(() => {
    const by = {};
    houses.forEach(h => {
      if (h.rejected_at || h.latitude == null || h.longitude == null) return;
      (by[h.barangay || "Unknown"] ||= []).push(h);
    });
    const groups = Object.entries(by).sort(([a], [b]) => a.localeCompare(b)).map(([name, list], i) => {
      const c = [
        list.reduce((s, h) => s + h.latitude, 0) / list.length,
        list.reduce((s, h) => s + h.longitude, 0) / list.length,
      ];
      const radius = Math.max(150, ...list.map(h => metres(c, [h.latitude, h.longitude]) + 70));
      return { name, list, center: c, radius, color: COLORS[i % COLORS.length] };
    });
    const center = groups.length
      ? [groups.reduce((s, g) => s + g.center[0], 0) / groups.length, groups.reduce((s, g) => s + g.center[1], 0) / groups.length]
      : DEFAULT_CENTER;
    return { groups, center };
  }, [houses]);

  if (loading) return <div className="loading-text">Loading map...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div>
      <div style={{ height, borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)" }}>
        <MapContainer key={groups.length} center={center} zoom={groups.length > 1 ? 14 : 16} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {groups.map(g => (
            <Circle key={g.name} center={g.center} radius={g.radius}
              pathOptions={{ color: g.color, fillColor: g.color, fillOpacity: 0.12 }}>
              <Popup><strong>{g.name}</strong><br />{g.list.length} boarding house{g.list.length === 1 ? "" : "s"}</Popup>
            </Circle>
          ))}
          {groups.flatMap(g => g.list.map(h => (
            <Marker key={h.id} position={[h.latitude, h.longitude]} icon={pinIcon}>
              <Popup>
                <strong>{h.name}</strong><br />
                <span style={{ color: "#857d6c" }}>{g.name}</span><br />
                {h.is_verified ? "Verified" : "Waiting for approval of OSAS"}<br />
                <a href={directionsUrl(h.latitude, h.longitude)} target="_blank" rel="noreferrer"
                  style={{ display: "inline-block", marginTop: 6, fontWeight: 700, color: "#2f5d4f" }}>
                  Get directions →
                </a>
              </Popup>
            </Marker>
          )))}
        </MapContainer>
      </div>

      {groups.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10, fontSize: 12 }}>
          {groups.map(g => (
            <span key={g.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: g.color, opacity: .7 }} />
              {g.name} ({g.list.length})
            </span>
          ))}
        </div>
      )}
      {groups.length === 0 && (
        <div style={{ padding: 12, fontSize: 12, color: "#857d6c", textAlign: "center" }}>
          No boarding houses with a map location yet.
        </div>
      )}
    </div>
  );
}
