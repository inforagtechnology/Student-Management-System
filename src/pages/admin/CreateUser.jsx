import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabaseClient";

export default function CreateUser() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "student" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setLoading(true);

    // supabase-js automatically attaches the current admin's access
    // token, which the edge function checks before doing anything.
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: form,
    });

    setLoading(false);

    if (error || data?.error) {
      setStatus({ type: "error", message: data?.error || error.message });
      return;
    }

    setStatus({ type: "success", message: `${form.role === "hr" ? "HR" : "Student"} account created for ${form.email}.` });
    setForm({ full_name: "", email: "", password: "", role: "student" });
  };

  return (
    <div>
      <Navbar />
      <div className="page page-narrow">
        <div className="page-header">
          <h1>Create an account</h1>
        </div>
        <p className="muted">
          Accounts created here are confirmed automatically — no verification email is sent, since you're
          vouching for them directly.
        </p>

        {status.message && (
          <div className={`alert ${status.type === "error" ? "alert-error" : "alert-info"}`}>{status.message}</div>
        )}

        <form className="card-form" onSubmit={handleSubmit}>
          <label>Role</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="hr">HR</option>
          </select>

          <label>Full name</label>
          <input name="full_name" value={form.full_name} onChange={handleChange} required />

          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />

          <label>Temporary password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
