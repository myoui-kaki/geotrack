# GeoTrack — branded splash screen (from your Framer prototype + logo)

## What this is

You shared a Framer component (`GeoTrackSplash.tsx`) and your actual logo
artwork (radar-ring mark + "GeoTrack" wordmark on near-black). That Framer
component is a **splash/intro overlay** — it plays once, then disappears —
not the login form itself. So what I built is: your real login screens
(already restyled in earlier passes) stay exactly as they are, and this
splash now plays on top of them for about 2.6 seconds the first time
someone opens the app in a browser tab, then fades away to reveal the
login card underneath.

If you actually meant "restyle the login form itself to be dark like
this," say so and I'll do that separately — this assumes the splash-only
reading since that's literally what the component you sent does.

**Preview (see the real motion, not just code):**
https://claude.ai/artifact/Mia2juHg4n15nkK55D8Q3a
(hit "Replay splash" to watch it again — the mock login card behind it is
just for context, your real one is untouched)

## Where these files go

- `src/App.jsx` → `frontend/src/App.jsx` (one import + one line added,
  nothing else touched — see below)
- `src/components/GeoTrackSplash.jsx` → new file
- `src/components/GeoTrackSplash.css` → new file
- `src/assets/geotrack-logo.png` → new file (your uploaded logo, saved
  into the project — new `assets/` folder under `src/`)

## What changed in `App.jsx`

Two lines, both additive:
```jsx
import GeoTrackSplash from "./components/GeoTrackSplash";
...
<AuthProvider>
  <GeoTrackSplash />
  <BrowserRouter>
```
Nothing else in the file was touched — routes, auth, everything else is
unchanged.

## Porting notes (Framer → plain React)

Your component was written for the Framer canvas runtime, which isn't
present in a plain Vite app, so these were removed/adapted:
- `import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"` —
  removed. There's no property-control panel or canvas here, so this became
  a plain component with the colors hardcoded to what you gave me
  (`#151515` background, `#1f3a2d` forest, `#b55a43` accent) rather than
  exposed as editable props nobody will edit.
- `useIsStaticRenderer()` / `isStatic` branches — removed. That was for
  detecting Framer's static canvas export; in a real browser it's always
  "live," so those branches never applied anyway.
- `replayInCanvas` prop — removed (Framer-canvas-only concept).
- `logoImage` control → replaced with your actual uploaded PNG, imported
  directly as `src/assets/geotrack-logo.png`.

**Everything else — the actual behavior — was kept as-is:**
- Session-gated via `sessionStorage` (`geotrack:splash:seen`), so it
  plays once per browser tab per session, not on every navigation
- `prefers-reduced-motion` handling, including live updates if the user
  changes that setting mid-session
- The three expanding "wave" rings, the orbit ring with its trailing dot,
  and the center pulse — same timings (2.8s wave, 9s orbit, 2.2s pulse)
- The reveal (`scale(.92)` → `scale(1)`) and exit (fade + slight scale-up)
  transitions on the logo itself
- The cycling status text ("Initializing GeoTrack…" → "Connecting to
  GeoTrack…" → "Preparing your workspace…")

One adjustment I made: the animated rings are positioned to sit exactly
over the radar icon baked into your logo artwork. I measured your actual
uploaded PNG (not the placeholder dimensions in the Framer code) and the
icon center sits at 26.7% down / 50.4% across — I used `top: 27%` instead
of the Framer version's `31%` so the animated rings actually align with
the static ones drawn into the logo, instead of sitting slightly below them.

## Not touched

The actual login form styling (StudentLogin/OsasLogin/BarangayLogin) from
the earlier passes — this only adds the splash on top. Your uploaded
logo image isn't used anywhere else yet (nav bar still uses text
"GEOTRACK", not this mark) — let me know if you want it swapped in there
too.
