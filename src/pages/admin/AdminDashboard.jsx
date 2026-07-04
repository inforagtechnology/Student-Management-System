import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabaseClient";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("id, roll_number, course, phone, date_of_birth, address, profiles(full_name, email)")
      .order("updated_at", { ascending: false });

    if (!error) setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({
      roll_number: s.roll_number || "",
      course: s.course || "",
      phone: s.phone || "",
      date_of_birth: s.date_of_birth || "",
      address: s.address || "",
    });
  };

  const saveEdit = async (id) => {
    const { error } = await supabase.from("students").update(editForm).eq("id", id);
    if (error) {
      setMessage(`Couldn't save: ${error.message}`);
    } else {
      setMessage("Student updated.");
      setEditingId(null);
      loadStudents();
    }
  };

  const deleteStudent = async (id, name) => {
    const ok = window.confirm(`Delete ${name || "this student"}? This removes their account entirely.`);
    if (!ok) return;
    // Deleting the profile cascades to the students row (see schema.sql).
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      setMessage(`Couldn't delete: ${error.message}`);
    } else {
      setMessage("Student removed.");
      loadStudents();
    }
  };

  return (
    <div>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <h1>Students</h1>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        {loading ? (
          <p>Loading…</p>
        ) : students.length === 0 ? (
          <p className="empty-state">No students yet.</p>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.profiles?.full_name || "—"}</td>
                    <td>{s.profiles?.email}</td>
                    {editingId === s.id ? (
                      <>
                        <td>
                          <input
                            value={editForm.roll_number}
                            onChange={(e) => setEditForm({ ...editForm, roll_number: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            value={editForm.course}
                            onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={editForm.date_of_birth || ""}
                            onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          />
                        </td>
                        <td className="row-actions">
                          <button className="btn btn-primary btn-sm" onClick={() => saveEdit(s.id)}>
                            Save
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{s.roll_number || "—"}</td>
                        <td>{s.course || "—"}</td>
                        <td>{s.phone || "—"}</td>
                        <td>{s.date_of_birth || "—"}</td>
                        <td>{s.address || "—"}</td>
                        <td className="row-actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(s)}>
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteStudent(s.id, s.profiles?.full_name)}
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
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
