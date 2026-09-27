// src/components/PortalFooter.jsx
//
// Shared campus-attribution footer, used at the bottom of every portal
// (student, OSAS, barangay) so it's consistent wherever GeoTrack is used.

export default function PortalFooter() {
  return (
    <footer className="geotrack-footer">
      LSPU – San Pablo City Campus
      <span className="geotrack-footer-sub"> · </span>
    </footer>
  );
}
