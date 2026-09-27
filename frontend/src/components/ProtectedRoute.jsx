import { Navigate } from "react-router-dom";
import { api } from "../api/client";

function loginPathFor(role) {
  if (role === "osas_admin") return "/osas/login";
  if (role === "barangay") return "/barangay/login";
  return "/student/login";
}

export default function ProtectedRoute({ requiredRole, children }) {
  const role = api.getRole();
  const token = api.getToken();

  if (!token) {
    return <Navigate to={loginPathFor(requiredRole)} replace />;
  }

  if (role !== requiredRole) {
    return <Navigate to={loginPathFor(requiredRole)} replace />;
  }

  return children;
}
