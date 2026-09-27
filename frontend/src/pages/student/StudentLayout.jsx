// src/pages/student/StudentLayout.jsx
//
// Shared phone-shell wrapper used by every student page. On mobile/tablet
// (below 900px) the nav becomes a hamburger-triggered slide-in panel
// instead of a sidebar or a stacked block under the content; at desktop
// width it's a normal docked sidebar (see the 900px+ rules in
// student.css). React Router's <Outlet /> renders whichever child page
// is active.

import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import InstallAppButton from "../../components/InstallAppButton";
import PortalFooter from "../../components/PortalFooter";
import "./student.css";

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, fullName } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    logout();
    navigate("/student/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="student-shell">
      <div className={`nav-backdrop ${menuOpen ? "open" : ""}`} onClick={closeMenu}></div>

      <div className="student-phone">
        <div className="student-main">
          {/* Sticky top bar, same pattern as OSAS/Barangay's .mobile-topbar -
              normal document flow (not position:fixed to the viewport, not
              floating over the device shell), so it always reserves its
              own space and can never overlap page content. */}
          <div className="mobile-topbar">
            <button className="hamburger-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="brand-mark"><span className="pin-dot"></span> GEOTRACK</div>
          </div>

          <div className="page-fade" key={location.pathname}><Outlet /></div>
          <PortalFooter />
        </div>

        <div className={`bottom-nav ${menuOpen ? "open" : ""}`}>

          <button className="nav-close-btn" onClick={closeMenu} aria-label="Close menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="student-sidebar-brand">
            <div className="brand-mark">
              <span className="pin-dot"></span> GEOTRACK
            </div>

            <div className="student-role-pill">
              Student Portal
            </div>
          </div>

          <NavLink to="/student/home" onClick={closeMenu}
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
            <div className="ic"></div>Home
          </NavLink>

          <NavLink to="/student/status" onClick={closeMenu}
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
            <div className="ic"></div>Status
          </NavLink>

          <NavLink to="/student/directory" onClick={closeMenu}
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
            <div className="ic"></div>Directory
          </NavLink>

          <NavLink to="/student/concern" onClick={closeMenu}
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
            <div className="ic"></div>Concerns
          </NavLink>

          <NavLink to="/student/sos" onClick={closeMenu}
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
            <div className="ic"></div>SOS
          </NavLink>

          <NavLink to="/student/profile" onClick={closeMenu}
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
            <div className="ic"></div>Profile
          </NavLink>

          {/* Spacer para itulak ang Sign Out sa pinakababa */}
          <div style={{ flex: 1 }}></div>

          <div style={{ padding: "0 4px 8px" }}><InstallAppButton variant="sidebar" /></div>

          <button className="student-signout-btn" onClick={handleLogout}>
            Sign out ({fullName})
          </button>
        </div>
      </div>
    </div>
  );
}
