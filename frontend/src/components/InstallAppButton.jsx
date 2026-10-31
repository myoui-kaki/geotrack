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

// The browser fires `beforeinstallprompt` once, early. Capture it at import
// time so a button that mounts later (e.g. inside a closed menu or on a
// different page) can still use it.
let savedPrompt = null;
const listeners = new Set();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    savedPrompt = e;
    listeners.forEach(fn => fn(e));
  });
  window.addEventListener("appinstalled", () => {
    savedPrompt = null;
    listeners.forEach(fn => fn(null));
  });
}

function isIos() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true; // older iOS Safari flag
}

export default function InstallAppButton({ variant = "default" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(savedPrompt);
  const [installed, setInstalled] = useState(isStandalone());
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    const fn = (e) => { setDeferredPrompt(e); if (!e) setInstalled(true); };
    listeners.add(fn);
    setDeferredPrompt(savedPrompt);
    return () => listeners.delete(fn);
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    // iOS has no install API, and some Android/desktop browsers have not
    // offered the prompt (yet): show step-by-step instructions instead.
    setShowIosSteps(true);
  }

  const ios = isIos();

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
          : variant === "compact"
            ? { fontSize:12, padding:"6px 10px", fontWeight:700, marginLeft:"auto", whiteSpace:"nowrap" }
          : variant === "block"
            ? { width:"100%", padding:12, fontSize:13.5, fontWeight:700 }
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
            <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>
              {ios ? "Add GeoTrack to your Home Screen (iPhone/iPad)" : "Add GeoTrack to your Home Screen"}
            </div>
            {ios ? (
              <ol style={{ fontSize:13, color:"#544f43", paddingLeft:18, lineHeight:1.7 }}>
                <li>Open this page in <strong>Safari</strong>.</li>
                <li>Tap the <strong>Share</strong> button (square with an arrow).</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> at the top right.</li>
              </ol>
            ) : (
              <ol style={{ fontSize:13, color:"#544f43", paddingLeft:18, lineHeight:1.7 }}>
                <li>Open this page in <strong>Chrome</strong> (Android) or Edge/Chrome (computer).</li>
                <li>Tap the <strong>menu (&#8942;)</strong> at the top right.</li>
                <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Tap <strong>Install</strong>. GeoTrack will appear on your home screen.</li>
              </ol>
            )}
            <p style={{ fontSize:11.5, color:"#a39c8a", marginTop:8 }}>
              Browsers only let you install from their own menu if the one-tap prompt is not available.
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
