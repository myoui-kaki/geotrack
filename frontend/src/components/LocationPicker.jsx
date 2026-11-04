// src/components/LocationPicker.jsx
// Pin the exact boarding house location: click the map, drag the pin, use the
// device's GPS, or search a street/landmark. onChange({lat, lng}) every time.
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SAN_PABLO_CENTER } from "../data/sanPabloBarangays";

const pinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function ClickToPin({ onPick }) {
  useMapEvents({ click: e => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}
function FlyTo({ point, zoom }) {
  const map = useMap();
  useEffect(() => { if (point) map.setView([point.lat, point.lng], zoom ?? Math.max(map.getZoom(), 17)); }, [point?.lat, point?.lng]); // eslint-disable-line
  return null;
}

async function geocode(q) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Location search failed.");
  const d = await res.json();
  return d.length ? { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) } : null;
}

export default function LocationPicker({ value, onChange, barangay, height = 260 }) {
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState(null);

  // Jump to the chosen barangay so the student doesn't start from the whole city.
  useEffect(() => {
    if (!barangay || value) return;
    let off = false;
    geocode(`${barangay.replace(/^Brgy\.\s*/, "Barangay ")}, San Pablo City, Laguna, Philippines`)
      .then(p => { if (!off && p) setFocus({ ...p, zoom: 16 }); }).catch(() => {});
    return () => { off = true; };
  }, [barangay]); // eslint-disable-line

  function pick(p) { setMsg(""); onChange(p); setFocus({ ...p, zoom: 18 }); }

  async function search() {
    if (!query.trim()) return;
    setBusy(true); setMsg("");
    try {
      const p = await geocode(`${query}, ${barangay || ""} San Pablo City, Laguna, Philippines`);
      if (p) pick(p); else setMsg("Not found - click the map to place the pin yourself.");
    } catch (e) { setMsg(e.message + " Click the map to place the pin yourself."); }
    finally { setBusy(false); }
  }
  function gps() {
    if (!navigator.geolocation) { setMsg("GPS isn't available on this device."); return; }
    setBusy(true); setMsg("");
    navigator.geolocation.getCurrentPosition(
      pos => { setBusy(false); pick({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => { setBusy(false); setMsg("Couldn't get your location. Click the map instead."); },
      { enableHighAccuracy: true, timeout: 10000 });
  }

  const center = value ? [value.lat, value.lng] : SAN_PABLO_CENTER;
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search street / landmark (optional)"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
          style={{ flex: 1, minWidth: 160 }} />
        <button type="button" className="btn" onClick={search} disabled={busy}>Search</button>
        <button type="button" className="btn" onClick={gps} disabled={busy}>Use my location</button>
      </div>
      <div style={{ height, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
        <MapContainer center={center} zoom={value ? 17 : 14} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickToPin onPick={pick} />
          <FlyTo point={focus} zoom={focus?.zoom} />
          {value && (
            <Marker position={[value.lat, value.lng]} icon={pinIcon} draggable
              eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); onChange({ lat: p.lat, lng: p.lng }); } }} />
          )}
        </MapContainer>
      </div>
      <div style={{ fontSize: 11.5, marginTop: 6, color: value ? "var(--ok)" : "#8a6a1f" }}>
        {value ? `Pinned (${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}) - drag the pin to adjust.`
               : "Tap/click the map where the boarding house is, to drop the pin."}
      </div>
      {msg && <div style={{ fontSize: 11.5, color: "var(--pin)", marginTop: 4 }}>{msg}</div>}
    </div>
  );
}
