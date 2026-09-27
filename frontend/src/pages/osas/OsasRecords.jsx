// src/pages/osas/OsasRecords.jsx
// Merges "Activity logs" and "Reports" into one sidebar entry with two
// tabs - both are historical/summary views of what's happened in the
// system rather than something OSAS needs to act on directly.

import OsasTabbedPage from "./OsasTabbedPage";
import OsasAuditLogs from "./OsasAuditLogs";
import OsasReports from "./OsasReports";

export default function OsasRecords({ defaultTab = 0 }) {
  return (
    <OsasTabbedPage
      defaultTab={defaultTab}
      tabs={[
        { label: "Activity logs", Component: OsasAuditLogs },
        { label: "Reports", Component: OsasReports },
      ]}
    />
  );
}
