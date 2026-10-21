// src/components/ConfirmDialog.jsx
//
// A centered, styled confirmation popup - replaces window.confirm /
// window.prompt (which the browser draws at the top of the page).
// With `requireReason`, the confirm button stays blocked until the user
// types a reason of at least `minLength` characters.

import { useEffect, useRef, useState } from "react";
import "./ConfirmDialog.css";

export default function ConfirmDialog({
  open,
  title,
  message,
  variant = "primary",          // "primary" | "danger"
  confirmText = "Confirm",
  cancelText = "Cancel",
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "",
  minLength = 5,
  busy = false,
  hideCancel = false,
  onConfirm,                    // (reason?: string) => void
  onCancel,
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setReason(""); setTouched(false); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape" && !busy) onCancel?.(); };
    window.addEventListener("keydown", onKey);
    if (requireReason) setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, requireReason, onCancel]);

  if (!open) return null;

  const tooShort = requireReason && reason.trim().length < minLength;

  function submit() {
    if (tooShort) { setTouched(true); inputRef.current?.focus(); return; }
    onConfirm?.(requireReason ? reason.trim() : undefined);
  }

  return (
    <div className="cd-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onCancel?.(); }}>
      <div className="cd-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className={`cd-icon ${variant}`}>{variant === "danger" ? "!" : hideCancel ? "i" : "?"}</div>
        <div className="cd-title">{title}</div>
        {message && <div className="cd-msg">{message}</div>}

        {requireReason && (
          <>
            <label className="cd-label">{reasonLabel} <span className="req">*</span></label>
            <textarea
              ref={inputRef}
              className={`cd-input ${touched && tooShort ? "err" : ""}`}
              value={reason}
              placeholder={reasonPlaceholder}
              onChange={e => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
            />
            {touched && tooShort && (
              <div className="cd-err">Please enter a reason (at least {minLength} characters).</div>
            )}
          </>
        )}

        <div className="cd-actions">
          {!hideCancel && <button type="button" onClick={onCancel} disabled={busy}>{cancelText}</button>}
          <button type="button" className={`cd-ok ${variant}`} onClick={submit} disabled={busy}>
            {busy ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
