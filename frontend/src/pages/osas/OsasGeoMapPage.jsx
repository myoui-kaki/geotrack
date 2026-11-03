// src/pages/osas/OsasGeoMapPage.jsx - map only.
import OsasGeoMap from "../../components/OsasGeoMap";

export default function OsasGeoMapPage() {
  return (
    <>
      <div className="osas-main-head">
        <div>
          <div className="osas-main-title">Geo-map overview</div>
          <div className="osas-main-sub">Each circle is a barangay; the pins are the boarding houses in it.</div>
        </div>
      </div>
      <div className="card"><OsasGeoMap height={560} /></div>
    </>
  );
}
