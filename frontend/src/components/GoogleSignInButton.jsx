// src/components/GoogleSignInButton.jsx
//
// "or" divider + Google's own "Continue with Google" button, used on the
// Student / OSAS / Barangay login pages.
//
// One button does both sign-in and sign-up:
//   - Google account already has a GeoTrack account -> onSuccess() right
//     away, so the page takes them straight to their dashboard/home.
//   - Brand-new person -> NOTHING is created yet. The Terms & Conditions
//     open first; only after "I agree" is the account created and
//     onSuccess() called. (Barangay accounts also type which barangay they
//     represent in that same step.) Cancel = no account is made.
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { STUDENT_TERMS, STAFF_TERMS } from "./termsText";

// A Google OAuth *client ID* is public by design (it's visible in every
// site that uses Google sign-in) - it is not the secret. The fallback keeps
// the button working even if the VITE_GOOGLE_CLIENT_ID env file isn't
// picked up by the build.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || "249006624482-udjh3rd9j2f3kukce53rfknns1e43s38.apps.googleusercontent.com";

export default function GoogleSignInButton({ role, onSuccess, onError, divider = true }) {
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const [pending, setPending] = useState(null);      // Google credential awaiting Terms
  const [barangayName, setBarangayName] = useState("");
  const [modalError, setModalError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !btnRef.current) return;
    let cancelled = false, pollId, timeoutId;

    function init() {
      if (cancelled || !window.google?.accounts?.id || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            const session = await api.googleAuth(role, response.credential);
            if (session.requires_terms) {
              setModalError(""); setBarangayName(""); setPending(response.credential);
            } else {
              onSuccessRef.current?.(session);
            }
          } catch (err) {
            onErrorRef.current?.(err.message || "Google sign-in failed. Please try again.");
          }
        },
      });
      // Fill the width of the form (Google allows 200-400px).
      const w = Math.max(200, Math.min(400, Math.round(wrapRef.current?.clientWidth || 320)));
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline", size: "large", width: w, text: "continue_with", logo_alignment: "left",
      });
    }

    if (window.google?.accounts?.id) init();
    else {
      // The Google script is loaded with `defer` - wait for it to be ready.
      pollId = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(pollId); init(); }
      }, 150);
      timeoutId = setTimeout(() => clearInterval(pollId), 8000);
    }
    return () => { cancelled = true; clearInterval(pollId); clearTimeout(timeoutId); };
  }, [role]);

  async function agreeAndCreate() {
    if (role === "barangay" && !barangayName.trim()) {
      setModalError("Please enter which barangay you represent."); return;
    }
    setBusy(true); setModalError("");
    try {
      const session = await api.googleAuth(role, pending, {
        accept_terms: true,
        ...(role === "barangay" ? { barangay_name: barangayName.trim() } : {}),
      });
      setPending(null);
      onSuccessRef.current?.(session);
    } catch (err) {
      setModalError(err.message || "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  if (!CLIENT_ID) return null;

  return (
    <>
      {divider && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0 16px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span style={{ fontSize: 13, color: "#544f43" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>
      )}
      <div ref={wrapRef} style={{ width: "100%" }}>
        <div ref={btnRef} style={{ display: "flex", justifyContent: "center" }} />
      </div>

      {pending && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(28,43,36,.6)", zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 24, maxWidth: 520, width: "100%",
            maxHeight: "85vh", display: "flex", flexDirection: "column",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              Terms &amp; Conditions
            </div>
            <div style={{ fontSize: 12.5, color: "#857d6c", marginBottom: 12 }}>
              Welcome! Since this is your first time, please read and agree before we create your account.
            </div>
            <pre style={{
              flex: 1, overflowY: "auto", fontSize: 11.5, lineHeight: 1.65, whiteSpace: "pre-wrap",
              color: "#544f43", fontFamily: "var(--font-body)", margin: "0 0 14px", padding: "0 4px",
              minHeight: 120,
            }}>{role === "student" ? STUDENT_TERMS : STAFF_TERMS}</pre>

            {role === "barangay" && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: "#544f43" }}>
                  Barangay you represent
                </label>
                <input value={barangayName} onChange={e => setBarangayName(e.target.value)}
                  placeholder="e.g. Brgy. Del Remedio"
                  style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid var(--line)",
                           fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            )}

            {modalError && <div className="error-banner" style={{ marginBottom: 12 }}>{modalError}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn primary" style={{ flex: 1, padding: 12 }} disabled={busy}
                onClick={agreeAndCreate}>{busy ? "Creating account..." : "I agree & continue"}</button>
              <button className="btn" style={{ flex: 1, padding: 12 }} disabled={busy}
                onClick={() => setPending(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
