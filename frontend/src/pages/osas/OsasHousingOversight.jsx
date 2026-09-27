// src/pages/osas/OsasHousingOversight.jsx
// Merges "Boarding house verification" and "Student reviews" into one
// sidebar entry with two tabs - both are views of the same boarding
// houses OSAS oversees. Compliance monitoring used to be a third tab here
// but is no longer part of this grouping.

import OsasTabbedPage from "./OsasTabbedPage";
import OsasVerification from "./OsasVerification";
import OsasReviews from "./OsasReviews";

export default function OsasHousingOversight({ defaultTab = 0 }) {
  return (
    <OsasTabbedPage
      defaultTab={defaultTab}
      tabs={[
        { label: "Boarding house verification", Component: OsasVerification },
        { label: "Student reviews", Component: OsasReviews },
      ]}
    />
  );
}
