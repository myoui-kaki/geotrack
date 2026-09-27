// src/pages/osas/OsasStudentMonitor.jsx
// Merges "Risk assessment" and "Student status monitor" into one sidebar
// entry with two tabs - both are different views of the same underlying
// question (how is this student doing right now), so they read better
// side-by-side than as two separate pages.

import OsasTabbedPage from "./OsasTabbedPage";
import OsasRiskAssessment from "./OsasRiskAssessment";
import OsasStatusUpdates from "./OsasStatusUpdates";

export default function OsasStudentMonitor({ defaultTab = 0 }) {
  return (
    <OsasTabbedPage
      defaultTab={defaultTab}
      tabs={[
        { label: "Risk assessment", Component: OsasRiskAssessment },
        { label: "Status updates", Component: OsasStatusUpdates },
      ]}
    />
  );
}
