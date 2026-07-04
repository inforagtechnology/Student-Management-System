import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function StudentProfile() {
  const { profile } = useAuth();
  const [form, setForm] = useState({ roll_number: "", course: "", phone: "", date_of_birth: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("roll_number, course, phone, date_of_birth, address")
        .eq("id", profile.id)
        .single();
      if (!error && data) setForm(data);
      setLoading(false);
    };
    if (profile) load();
  }, [profile]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    // roll_number and course are typically set by the institution, so
    // students only get to edit their own contact-style details here.
    const { phone, date_of_birth, address } = form;
    const { error } = await supabase
      .from("students")
      .update({ phone, date_of_birth, address })
      .eq("id", profile.id);
    setSaving(false);
    setMessage(error ? `Couldn't save: ${error.message}` : "Saved.");
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="page">Loading…</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="page page-narrow">
        <div className="page-header">
          <h1>My details</h1>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        <div className="card-form">
          <label>Full name</label>
          <input value={profile.full_name || ""} disabled />

          <label>Email</label>
          <input value={profile.email || ""} disabled />

          <label>Roll number</label>
          <input value={form.roll_number || "Not assigned yet"} disabled />

          <label>Course</label>
          <input value={form.course || "Not assigned yet"} disabled />
        </div>

        <form className="card-form" onSubmit={handleSubmit}>
          <label>Phone</label>
          <input name="phone" value={form.phone || ""} onChange={handleChange} />

          <label>Date of birth</label>
          <input type="date" name="date_of_birth" value={form.date_of_birth || ""} onChange={handleChange} />

          <label>Address</label>
          <input name="address" value={form.address || ""} onChange={handleChange} />

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
