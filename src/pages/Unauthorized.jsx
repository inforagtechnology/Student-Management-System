import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Access denied</h1>
        <p className="auth-subtitle">Your account doesn't have permission to view that page.</p>
        <Link className="btn btn-primary" to="/login">
          Back to login
        </Link>
      </div>
    </div>
  );
}
