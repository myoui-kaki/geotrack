// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import GeoTrackSplash from "./components/GeoTrackSplash";
import { DialogHost } from "./components/dialogs";

// Student pages
import StudentLogin     from "./pages/student/StudentLogin";
import StudentLayout    from "./pages/student/StudentLayout";
import StudentHome      from "./pages/student/StudentHome";
import StudentStatus    from "./pages/student/StudentStatus";
import StudentDirectory from "./pages/student/StudentDirectory";
import DormDetail       from "./pages/student/DormDetail";
import StudentSOS       from "./pages/student/StudentSOS";
import StudentProfile   from "./pages/student/StudentProfile";
import ForgotPassword   from "./pages/student/ForgotPassword";
import ResetPassword    from "./pages/student/ResetPassword";
import VerifyOTP        from "./pages/student/VerifyOTP";
import TwoFAVerify      from "./pages/student/TwoFAVerify";

// OSAS pages
import OsasLogin          from "./pages/osas/OsasLogin";
import OsasLayout         from "./pages/osas/OsasLayout";
import OsasDashboard      from "./pages/osas/OsasDashboard";
import OsasAccounts       from "./pages/osas/OsasAccounts";
import OsasStatusUpdates    from "./pages/osas/OsasStatusUpdates";
import OsasHousingOversight from "./pages/osas/OsasHousingOversight";
import OsasReports           from "./pages/osas/OsasReports";
import OsasGeoMapPage        from "./pages/osas/OsasGeoMapPage";
import OsasEmergencies       from "./pages/osas/OsasEmergencies";

// Barangay pages
import BarangayLogin      from "./pages/barangay/BarangayLogin";
import BarangayLayout     from "./pages/barangay/BarangayLayout";
import BarangayBoardingHouses from "./pages/barangay/BarangayBoardingHouses";
import BarangayEmergencies    from "./pages/barangay/BarangayEmergencies";
import BarangayProfile        from "./pages/barangay/BarangayProfile";

export default function App() {
  return (
    <AuthProvider>
      <GeoTrackSplash />
      <DialogHost />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/student/login" replace />} />

          {/* -- Student (public) -- */}
          <Route path="/student/login"          element={<StudentLogin />} />
          <Route path="/student/forgot-password" element={<ForgotPassword />} />
          <Route path="/student/reset-password"  element={<ResetPassword />} />
          <Route path="/student/verify-otp"      element={<VerifyOTP />} />
          <Route path="/student/2fa-verify"      element={<TwoFAVerify />} />

          {/* -- Student (protected) -- */}
          <Route path="/student" element={
            <ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>
          }>
            <Route path="home"             element={<StudentHome />} />
            <Route path="status"           element={<StudentStatus />} />
            <Route path="directory"        element={<StudentDirectory />} />
            <Route path="directory/:houseId" element={<DormDetail />} />
            <Route path="concern"          element={<Navigate to="/student/home" replace />} />
            <Route path="sos"              element={<StudentSOS />} />
            <Route path="profile"          element={<StudentProfile />} />
          </Route>

          {/* -- OSAS (public) -- */}
          <Route path="/osas/login" element={<OsasLogin />} />
          <Route path="/osas/forgot-password" element={<ForgotPassword />} />
          <Route path="/osas/reset-password"  element={<ResetPassword />} />

          {/* -- OSAS (protected) -- */}
          <Route path="/osas" element={
            <ProtectedRoute requiredRole="osas_admin"><OsasLayout /></ProtectedRoute>
          }>
            <Route path="dashboard"      element={<OsasDashboard />} />
            <Route path="accounts"       element={<OsasAccounts />} />
            <Route path="reports"        element={<OsasReports />} />
            <Route path="status-updates" element={<OsasStatusUpdates />} />

            {/* -- Consolidated pages (sidebar entries) -- */}
            <Route path="housing-oversight" element={<OsasHousingOversight />} />
            <Route path="geo-map"           element={<OsasGeoMapPage />} />
            <Route path="concerns"          element={<Navigate to="/osas/emergencies" replace />} />
            <Route path="concerns-alerts"   element={<Navigate to="/osas/emergencies" replace />} />

            {/* -- Old paths kept working, landing on the matching tab, so
                 existing internal links/navigate() calls and any bookmarks
                 still go to the right place -- */}
            <Route path="risk-assessment" element={<Navigate to="/osas/status-updates" replace />} />
            <Route path="verification"    element={<OsasHousingOversight defaultTab={0} />} />
            <Route path="reviews"         element={<OsasHousingOversight defaultTab={1} />} />
            <Route path="emergencies"     element={<OsasEmergencies />} />
          </Route>

          {/* -- Barangay (public) -- */}
          <Route path="/barangay/login" element={<BarangayLogin />} />
          <Route path="/barangay/forgot-password" element={<ForgotPassword />} />
          <Route path="/barangay/reset-password"  element={<ResetPassword />} />

          {/* -- Barangay (protected) -- */}
          <Route path="/barangay" element={
            <ProtectedRoute requiredRole="barangay"><BarangayLayout /></ProtectedRoute>
          }>
            <Route path="boarding-houses" element={<BarangayBoardingHouses />} />
            <Route path="emergencies"     element={<BarangayEmergencies />} />
            <Route path="profile"         element={<BarangayProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/student/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
