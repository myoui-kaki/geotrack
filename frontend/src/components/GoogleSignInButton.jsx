// src/components/GoogleSignInButton.jsx
//
// Renders Google's own "Sign in with Google" button via Google Identity
// Services (script loaded globally in index.html), and on success exchanges
// the ID token it returns for a GeoTrack session through api.googleAuth.
// One button does both sign-in AND first-time sign-up - the backend decides
// which, based on whether the email already has an account.
//
// Used by StudentLogin / OsasLogin / BarangayLogin - only `role` and the
// success/error callbacks differ between them.
import { useEffect, useRef } from "react";
import { api } from "../api/client";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function GoogleSignInButton({ role, extra, onSuccess, onError, disabled = false }) {
  const divRef = useRef(null);
  // Refs so the Google callback (registered once, on mount) always sees the
  // latest `extra` / handlers instead of whatever they were on first render.
  const extraRef = useRef(extra);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => { extraRef.current = extra; }, [extra]);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!CLIENT_ID || !divRef.current) return;
    let cancelled = false;
    let pollId, timeoutId;

    function init() {
      if (cancelled || !window.google?.accounts?.id || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            const session = await api.googleAuth(role, response.credential, extraRef.current || {});
            onSuccessRef.current?.(session);
          } catch (err) {
            onErrorRef.current?.(err.message || "Google sign-in failed. Please try again.");
          }
        },
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline", size: "large", width: 320, text: "continue_with",
      });
    }

    // The GSI <script defer> in index.html may not have finished loading
    // yet when this mounts - poll briefly instead of assuming a fixed delay.
    if (window.google?.accounts?.id) {
      init();
    } else {
      pollId = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(pollId); init(); }
      }, 150);
      timeoutId = setTimeout(() => clearInterval(pollId), 8000);
    }

    return () => { cancelled = true; clearInterval(pollId); clearTimeout(timeoutId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Nothing to show until VITE_GOOGLE_CLIENT_ID is actually configured -
  // fails invisibly rather than rendering a button that can't work yet.
  if (!CLIENT_ID) return null;

  return (
    <div style={{
      opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto",
      display: "flex", justifyContent: "center",
    }}>
      <div ref={divRef} />
    </div>
  );
}
