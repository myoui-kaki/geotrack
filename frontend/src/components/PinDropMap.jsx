// src/components/PinDropMap.jsx
//
// Interactive Leaflet map for picking a boarding house's location by hand -
// click anywhere to drop the pin, or drag an existing pin to fine-tune it.
// Used on the Student registration form and the "Transferred" status
// update, so a student's own reported boarding house always ends up with
// real coordinates instead of just a typed address.

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// San Pablo City Campus - sensible default center when nothing is pinned yet.
const CAMPUS_CENTER = [14.0683, 121.325];

function ClickToPin({ onPick }) {
  useMapEvents({
    click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return null;
}

// Re-centers the map whenever the pin jumps to a new spot from OUTSIDE the
// map itself (e.g. the "Find on map" geocode button) - not on every click/
// drag, since the user's own click already puts it exactly where they want.
function RecenterOnExternalChange({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], 17);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

export default function PinDropMap({ latitude, longitude, onChange, height = 220 }) {
  const hasPin = latitude != null && longitude != null;
  const position = hasPin ? [latitude, longitude] : CAMPUS_CENTER;

  return (
    <div>
      <div style={{ height, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
        <MapContainer center={position} zoom={hasPin ? 17 : 15}
          style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPin onPick={onChange} />
          <RecenterOnExternalChange lat={latitude} lng={longitude} />
          {hasPin && (
            <Marker
              position={position}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend(e) {
                  const { lat, lng } = e.target.getLatLng();
                  onChange({ lat, lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p style={{ fontSize: 11, color: "#a39c8a", marginTop: 6 }}>
        {hasPin ? "Drag the pin or tap elsewhere on the map to adjust it." : "Tap on the map to drop a pin at your boarding house."}
      </p>
    </div>
  );
}
