import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (!profile) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">Student Management System</div>
      <div className="navbar-links">
        {profile.role === "admin" && (
          <>
            <Link to="/admin">Students</Link>
            <Link to="/admin/create">Create account</Link>
          </>
        )}
        {profile.role === "hr" && <Link to="/hr">Students</Link>}
        {profile.role === "student" && <Link to="/me">My details</Link>}
      </div>
      <div className="navbar-user">
        <span className="badge">{profile.role}</span>
        <span className="navbar-name">{profile.full_name || profile.email}</span>
        <button className="btn btn-ghost" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
