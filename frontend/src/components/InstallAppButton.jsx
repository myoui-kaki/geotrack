// src/components/InstallAppButton.jsx
//
// A "Download app" button for installing GeoTrack as a PWA.
//
// Important platform reality (not something code can work around):
// - Android Chrome, and desktop Chrome/Edge (Windows/Mac) support the
//   `beforeinstallprompt` event. When it fires, we can show a button that
//   triggers the browser's own native install confirmation - one click,
//   then the browser handles pinning it to the home screen / Start Menu /
//   Applications folder itself.
// - iOS Safari has NO equivalent API. Apple deliberately does not allow
//   any website to trigger "Add to Home Screen" programmatically - it is
//   only ever available through the manual Share -> Add to Home Screen
//   path. No amount of code changes this; we detect iOS Safari and show
//   instructions instead of a fake "download" action.
// - If the app is already running installed (standalone mode), there's
//   nothing to prompt, so the button hides itself.

import { useEffect, useState } from "react";

function isIos() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true; // older iOS Safari flag
}

export default function InstallAppButton({ variant = "default" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    if (isIos()) {
      setShowIosSteps(true);
      return;
    }
    // Neither path available (e.g. already dismissed once this session,
    // or a browser with no install support at all) - nothing to do.
  }

  // On iOS there's no browser event to wait for, so show the button as
  // soon as we know we're on iOS and not yet installed.
  const canShow = !!deferredPrompt || isIos();
  if (!canShow) return null;

  // The default ".btn" style (light background, dark text) reads fine on a
  // light page, but looks like a stray white blob sitting in a dark sidebar
  // next to the nav links / sign-out button. In that spot, match the same
  // ghost-button treatment already used for "Sign out" instead.
  const sidebarStyle = {
    width: "100%",
    padding: "10px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,.2)",
    color: "#e9f1ec",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
  };

  return (
    <>
      <button
        className={variant === "sidebar" ? "" : "btn"}
        style={variant === "sidebar"
          ? sidebarStyle
          : { fontSize:12.5, padding:"8px 14px", fontWeight:700 }}
        onClick={handleClick}
      >
        📲 Download app
      </button>

      {showIosSteps && (
        <div onClick={() => setShowIosSteps(false)} style={{
          position:"fixed", inset:0, zIndex:200, background:"rgba(20,30,25,.45)",
          display:"flex", alignItems:"flex-end", justifyContent:"center",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background:"#fff", borderRadius:"16px 16px 0 0", padding:20, maxWidth:420, width:"100%",
          }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>Install on iPhone/iPad</div>
            <ol style={{ fontSize:13, color:"#544f43", paddingLeft:18, lineHeight:1.7 }}>
              <li>Tap the <strong>Share</strong> button in Safari (the square with an arrow, at the bottom of the screen).</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> at the top right.</li>
            </ol>
            <p style={{ fontSize:11.5, color:"#a39c8a", marginTop:8 }}>
              Note: iOS only allows this through Safari's own Share menu - no app or website can trigger it automatically.
            </p>
            <button className="btn primary" style={{ width:"100%", marginTop:10 }} onClick={() => setShowIosSteps(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
