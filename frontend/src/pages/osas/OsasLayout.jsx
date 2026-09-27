// src/pages/osas/OsasLayout.jsx - with 15-min session timeout
import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSessionTimeout } from "../../hooks/useSessionTimeout";
import InstallAppButton from "../../components/InstallAppButton";
import PortalFooter from "../../components/PortalFooter";
import "./osas.css";

export default function OsasLayout() {
  const { fullName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout(ask = true) {
    if (ask && !window.confirm("Are you sure you want to sign out?")) return;
    logout(); navigate("/osas/login");
  }

  useSessionTimeout(
    () => { logout(); navigate("/osas/login?timeout=1"); },
    () => setShowTimeoutWarning(true),
    true
  );

  function closeMenu() { setMenuOpen(false); }

  return (
    <div className="osas-shell">
      {showTimeoutWarning && (
        <div style={{
          position:"fixed",bottom:24,right:24,zIndex:9999,
          background:"#fff",border:"1px solid var(--line)",borderRadius:14,
          padding:"16px 20px",boxShadow:"0 8px 32px rgba(28,43,36,.2)",maxWidth:300,
        }}>
          <div style={{fontWeight:700,marginBottom:6,color:"var(--moss-dark)"}}>Session expiring soon</div>
          <div style={{fontSize:13,color:"#6b6457",marginBottom:12}}>
            You'll be signed out in 1 minute due to inactivity.
          </div>
          <button className="btn primary" style={{width:"100%",padding:10}}
            onClick={() => setShowTimeoutWarning(false)}>
            Keep me signed in
          </button>
        </div>
      )}

      {/* Hidden on desktop via CSS - mobile/tablet only */}
      <div className={`nav-backdrop ${menuOpen ? "open" : ""}`} onClick={closeMenu}></div>

      <aside className={`osas-sidebar ${menuOpen ? "open" : ""}`}>
        <button className="nav-close-btn" onClick={closeMenu} aria-label="Close menu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="brand-mark"><span className="pin-dot"></span> GEOTRACK</div>
        <div className="role-pill">OSAS administrator</div>
        <nav style={{marginTop:18}}>
          {[
            ["/osas/dashboard",         "Geo-map overview"],
            ["/osas/status-updates",    "Student status monitor"],
            ["/osas/housing-oversight", "Housing oversight"],
            ["/osas/concerns-alerts",   "Concerns & alerts"],
            ["/osas/reports",           "Reports"],
            ["/osas/accounts",          "Account management"],
          ].map(([to, label]) => (
            <NavLink key={to} to={to} onClick={closeMenu}
              className={({isActive}) => `osas-nav-item ${isActive?"active":""}`}>
              <span className="dot"></span> {label}
            </NavLink>
          ))}
        </nav>
        <div className="osas-sidebar-spacer"></div>
        <div style={{marginBottom:8}}><InstallAppButton variant="sidebar" /></div>
        <button className="osas-logout-btn" onClick={() => handleLogout(true)}>
          Sign out ({fullName})
        </button>
      </aside>
      <main className="osas-main" style={{display:"flex",flexDirection:"column"}}>
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
        <div className="page-fade" style={{flex:1}} key={location.pathname}><Outlet /></div>
        <PortalFooter />
      </main>
    </div>
  );
}
