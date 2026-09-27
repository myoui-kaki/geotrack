// src/pages/osas/OsasMessaging.jsx
// Merges "Announcements" and "Notifications" into one sidebar entry with
// two tabs - one is OSAS sending messages out, the other is OSAS receiving
// system notices, but both are the same "messages" area of the app.

import OsasTabbedPage from "./OsasTabbedPage";
import OsasAnnouncements from "./OsasAnnouncements";
import OsasNotifications from "./OsasNotifications";

export default function OsasMessaging({ defaultTab = 0 }) {
  return (
    <OsasTabbedPage
      defaultTab={defaultTab}
      tabs={[
        { label: "Announcements", Component: OsasAnnouncements },
        { label: "Notifications", Component: OsasNotifications },
      ]}
    />
  );
}
