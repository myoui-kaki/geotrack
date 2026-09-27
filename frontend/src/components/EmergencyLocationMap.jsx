// src/components/EmergencyLocationMap.jsx
//
// A small single-pin map showing exactly where a student was when they
// triggered an SOS alert, with a "Get directions" link so OSAS or a
// barangay account can navigate there directly instead of asking the
// student or landlord where the boarding house or incident location is.

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const redIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "geotrack-marker-flagged",
});

function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export default function EmergencyLocationMap({ latitude, longitude, height = 180 }) {
  if (latitude == null || longitude == null) {
    return (
      <div style={{ fontSize:12, color:"#a39c8a", padding:"8px 0" }}>
        No location was shared with this alert.
      </div>
    );
  }

  return (
    <div>
      <div style={{ height, borderRadius:10, overflow:"hidden", border:"1px solid var(--line)" }}>
        <MapContainer center={[latitude, longitude]} zoom={16} style={{ height:"100%", width:"100%" }}
          scrollWheelZoom={false} key={`${latitude}-${longitude}`}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[latitude, longitude]} icon={redIcon}>
            <Popup>Location when SOS was triggered</Popup>
          </Marker>
        </MapContainer>
      </div>
      <a href={directionsUrl(latitude, longitude)} target="_blank" rel="noreferrer"
        className="btn" style={{ display:"inline-block", marginTop:8, fontSize:11.5, fontWeight:700, color:"#2f5d4f" }}>
        Get directions →
      </a>
    </div>
  );
}
