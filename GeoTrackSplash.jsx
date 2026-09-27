// src/components/GeoTrackSplash.jsx
import { useEffect, useState } from "react";
import logo from "../assets/geotrack-splash-logo.png";
import "./GeoTrackSplash.css";

const MESSAGES = [
  "Locating your campus network",
  "Connecting to GeoTrack",
  "Preparing your workspace",
];

const SESSION_KEY = "geotrack:splash:seen";
const MESSAGE_CYCLE_MS = 900;
const EXIT_DELAY_MS = 3300;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function GeoTrackSplash() {
  // Plays once per browser tab (sessionStorage), not on every navigation.
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && !window.sessionStorage.getItem(SESSION_KEY)
  );
  const [messageIndex, setMessageIndex] = useState(0);
  const [reduced, setReduced] = useState(prefersReducedMotion);

  // Keep reduced-motion state live if the user changes the OS setting mid-session.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event) => setReduced(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    const dismiss = () => {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      setVisible(false);
    };

    // Reduced-motion users skip the animated wait entirely.
    if (reduced) {
      dismiss();
      return undefined;
    }

    const textTimer = window.setInterval(
      () => setMessageIndex((current) => (current + 1) % MESSAGES.length),
      MESSAGE_CYCLE_MS
    );
    const exitTimer = window.setTimeout(dismiss, EXIT_DELAY_MS);

    return () => {
      window.clearInterval(textTimer);
      window.clearTimeout(exitTimer);
    };
  }, [visible, reduced]);

  if (!visible) return null;

  return (
    <div className="gt-splash" role="status" aria-live="polite">
      <div className="gt-splash__glow gt-splash__glow--one" />
      <div className="gt-splash__glow gt-splash__glow--two" />

      <div className="gt-splash__content">
        <div className="gt-splash__logo-wrap">
          <div className="gt-orbit gt-orbit--outer">
            <span />
          </div>
          <div className="gt-orbit gt-orbit--middle" />
          <img
            className="gt-splash__logo"
            src={logo}
            alt="GeoTrack Student Monitoring System"
          />
        </div>

        <div className="gt-splash__status">
          <span className="gt-splash__status-dot" aria-hidden="true" />
          <p key={messageIndex}>{MESSAGES[messageIndex]}</p>
        </div>

        <div className="gt-splash__progress" aria-hidden="true">
          <span />
        </div>
      </div>

      <p className="gt-splash__footer">LSPU · SAN PABLO CITY CAMPUS</p>
    </div>
  );
}
