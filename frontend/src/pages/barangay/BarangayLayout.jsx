// src/pages/barangay/BarangayLayout.jsx
//
// Only 3 nav destinations here, unlike Student (6) or OSAS (6) - too few
// to justify a hamburger + slide-in drawer. On mobile they're shown
// directly as a fixed bottom tab bar instead (one tap, no menu to open
// first). Desktop keeps the same docked sidebar as OSAS for consistency.
import { useNavigate, useLocation, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import InstallAppButton from "../../components/InstallAppButton";
import PortalFooter from "../../components/PortalFooter";
import "../osas/osas.css";

const NAV_ITEMS = [
  ["/barangay/boarding-houses", "Boarding house permits", "Permits"],
  ["/barangay/emergencies",     "Student emergencies",    "Emergencies"],
  ["/barangay/concerns",        "Reported concerns",      "Concerns"],
];

// Desktop sidebar also gets a Profile link (mobile reaches it via the
// icon in the top bar instead, keeping the bottom tab bar at just the 3
// main destinations).
const DESKTOP_NAV_ITEMS = [...NAV_ITEMS, ["/barangay/profile", "Profile"]];

export default function BarangayLayout() {
  const { fullName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    logout(); navigate("/barangay/login");
  }

  return (
    <div className="osas-shell barangay-shell">
      {/* Desktop-docked sidebar (same as OSAS). Hidden on mobile in favor
          of the bottom tab bar below, so no open/close state is needed. */}
      <aside className="osas-sidebar">
        <div className="brand-mark"><span className="pin-dot"></span> GEOTRACK</div>
        <div className="role-pill">Barangay account</div>
        <nav style={{marginTop:18}}>
          {DESKTOP_NAV_ITEMS.map(([to, label]) => (
            <NavLink key={to} to={to}
              className={({isActive}) => `osas-nav-item ${isActive?"active":""}`}>
              <span className="dot"></span> {label}
            </NavLink>
          ))}
        </nav>
        <div className="osas-sidebar-spacer"></div>
        <div style={{marginBottom:8}}><InstallAppButton variant="sidebar" /></div>
        <button className="osas-logout-btn" onClick={handleLogout}>
          Sign out ({fullName})
        </button>
      </aside>

      <main className="osas-main" style={{display:"flex",flexDirection:"column"}}>
        <div className="mobile-topbar">
          <div className="brand-mark"><span className="pin-dot"></span> GEOTRACK</div>
          <button className="brgy-logout-icon" onClick={() => navigate("/barangay/profile")} aria-label="Profile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
        </div>
        <div className="page-fade" style={{flex:1}} key={location.pathname}><Outlet /></div>
        <PortalFooter />
      </main>

      {/* Mobile-only bottom tab bar - the 3 items are always visible and
          directly tappable, no menu/drawer step in between. */}
      <nav className="brgy-tabbar">
        {NAV_ITEMS.map(([to, , shortLabel]) => (
          <NavLink key={to} to={to}
            className={({isActive}) => `brgy-tab ${isActive?"active":""}`}>
            <span className="brgy-tab-dot"></span>
            <span>{shortLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
