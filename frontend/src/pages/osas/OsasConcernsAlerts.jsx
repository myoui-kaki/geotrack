// src/pages/osas/OsasConcernsAlerts.jsx
// Merges "Reported concerns" and "Emergency / SOS cases" into one sidebar
// entry with two tabs - both are things a student reported to OSAS, split
// by urgency rather than living on two unrelated-looking pages.

import OsasTabbedPage from "./OsasTabbedPage";
import OsasConcerns from "./OsasConcerns";
import OsasEmergencies from "./OsasEmergencies";

export default function OsasConcernsAlerts({ defaultTab = 0 }) {
  return (
    <OsasTabbedPage
      defaultTab={defaultTab}
      tabs={[
        { label: "Reported concerns", Component: OsasConcerns },
        { label: "Emergency / SOS cases", Component: OsasEmergencies },
      ]}
    />
  );
}
