// src/components/dialogs.jsx
//
// App-wide centered popups. Use anywhere (components or plain helpers):
//
//   import { dialog } from "../../components/dialogs";
//   if (!(await dialog.confirm({ title:"Delete?", message:"...", variant:"danger", confirmText:"Delete" }))) return;
//   const reason = await dialog.prompt({ title:"Flag student", reasonLabel:"Reason" });   // null if cancelled
//   await dialog.alert({ title:"Export failed", message:"..." });
//
// <DialogHost /> is mounted once in App.jsx and draws the popup in the
// middle of the screen (instead of the browser's own top-of-page dialogs).

import { useEffect, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

let host = null;   // set by <DialogHost />

function open(kind, opts) {
  return new Promise(resolve => {
    if (!host) {   // host not mounted yet - fall back to the browser
      if (kind === "alert")   { window.alert(opts.message || opts.title); return resolve(); }
      if (kind === "prompt")  return resolve(window.prompt(opts.title || opts.message || ""));
      return resolve(window.confirm(opts.message || opts.title));
    }
    host({ kind, opts, resolve });
  });
}

export const dialog = {
  confirm: opts => open("confirm", opts),   // -> true / false
  prompt:  opts => open("prompt",  opts),   // -> string / null
  alert:   opts => open("alert",   opts),   // -> undefined
};

export function DialogHost() {
  const [item, setItem] = useState(null);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    host = next => setQueue(q => [...q, next]);
    return () => { host = null; };
  }, []);

  useEffect(() => {
    if (!item && queue.length) { setItem(queue[0]); setQueue(q => q.slice(1)); }
  }, [item, queue]);

  if (!item) return null;
  const { kind, opts, resolve } = item;
  const close = value => { setItem(null); resolve(value); };

  return (
    <ConfirmDialog
      open
      title={opts.title}
      message={opts.message}
      variant={opts.variant || "primary"}
      confirmText={opts.confirmText || (kind === "alert" ? "OK" : "Confirm")}
      cancelText={opts.cancelText || "Cancel"}
      hideCancel={kind === "alert"}
      requireReason={kind === "prompt"}
      reasonLabel={opts.reasonLabel || "Reason"}
      reasonPlaceholder={opts.reasonPlaceholder || ""}
      minLength={opts.minLength || 3}
      onConfirm={val => close(kind === "prompt" ? val : kind === "alert" ? undefined : true)}
      onCancel={() => close(kind === "prompt" ? null : kind === "alert" ? undefined : false)}
    />
  );
}
