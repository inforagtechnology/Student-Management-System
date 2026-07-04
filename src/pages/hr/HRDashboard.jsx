import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabaseClient";

// HR can see every student's details but has no edit or delete
// controls — that's enforced here in the UI and, more importantly,
// by the students_update_admin / students_delete_admin RLS policies
// in schema.sql, which only match role = 'admin'.
export default function HRDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, roll_number, course, phone, date_of_birth, address, profiles(full_name, email)")
        .order("updated_at", { ascending: false });
      if (!error) setStudents(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.profiles?.full_name?.toLowerCase().includes(q) ||
      s.profiles?.email?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <h1>Students</h1>
          <input
            className="search-input"
            placeholder="Search by name, email or roll no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state">No matching students.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roll no.</th>
                  <th>Course</th>
                  <th>Phone</th>
                  <th>Date of birth</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>{s.profiles?.full_name || "—"}</td>
                    <td>{s.profiles?.email}</td>
                    <td>{s.roll_number || "—"}</td>
                    <td>{s.course || "—"}</td>
                    <td>{s.phone || "—"}</td>
                    <td>{s.date_of_birth || "—"}</td>
                    <td>{s.address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
