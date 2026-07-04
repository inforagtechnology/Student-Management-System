import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap any page that needs a logged-in user.
 * Pass allowedRoles={["admin"]} etc. to also gate by role.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading…</div>;

  if (!session) return <Navigate to="/login" replace />;

  // Session exists but profile hasn't loaded yet (race on first paint)
  if (!profile) return <div className="page-loading">Loading…</div>;

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
