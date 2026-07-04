import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Check your email</h1>
        <p className="auth-subtitle">
          We sent a confirmation link{email ? ` to ${email}` : ""}. Click it to verify your address —
          you won't be able to log in until you do.
        </p>
        <Link className="btn btn-primary" to="/login">
          Back to login
        </Link>
      </div>
    </div>
  );
}
