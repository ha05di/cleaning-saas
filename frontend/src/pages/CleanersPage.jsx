import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function CleanersPage() {
  const token = localStorage.getItem("token");

  const [cleaners, setCleaners] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    status: "active",
    team: "",
    notes: "",
  });

  useEffect(() => {
    fetchCleaners();
    fetchJobs();
  }, []);

  async function fetchCleaners() {
    try {
      const res = await axios.get(`${API}/cleaners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCleaners(res.data.cleaners || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to fetch cleaners");
    }
  }

  async function fetchJobs() {
    try {
      const res = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data.jobs || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to fetch jobs");
    }
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Cleaner name is required");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API}/cleaners/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API}/cleaners`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      resetForm();
      fetchCleaners();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to save cleaner");
    }
  }

  function handleEdit(cleaner) {
    setEditingId(cleaner.id);
    setForm({
      name: cleaner.name || "",
      phone: cleaner.phone || "",
      status: cleaner.status || "active",
      team: cleaner.team || "",
      notes: cleaner.notes || "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      status: "active",
      team: "",
      notes: "",
    });
  }

  function getCleanerWorkload(cleanerId) {
    const assignedCount = jobs.filter(
      (job) => job.cleanerId === cleanerId && job.status === "assigned"
    ).length;

    if (assignedCount === 0) {
      return { label: "idle", color: "#6b7280", bg: "#f3f4f6" };
    }

    if (assignedCount === 1) {
      return { label: "busy", color: "#2563eb", bg: "#dbeafe" };
    }

    return { label: "full", color: "#b91c1c", bg: "#fee2e2" };
  }

  const filteredCleaners = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cleaners;

    return cleaners.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const notes = (c.notes || "").toLowerCase();
      const status = (c.status || "").toLowerCase();
      const team = (c.team || "").toLowerCase();
      const workload = getCleanerWorkload(c.id).label.toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        notes.includes(q) ||
        status.includes(q) ||
        team.includes(q) ||
        workload.includes(q)
      );
    });
  }, [cleaners, search, jobs]);

  return (
    <AppLayout title="Cleaners">
      <div style={styles.page}>
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <input
            style={styles.input}
            name="name"
            placeholder="Cleaner Name"
            value={form.name}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />

          <select
            style={styles.input}
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <input
            style={styles.input}
            name="team"
            placeholder="Team (optional)"
            value={form.team}
            onChange={handleChange}
          />

          <input
            style={styles.input}
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
          />

          <button type="submit" style={styles.primaryBtn}>
            {editingId ? "Update Cleaner" : "Add Cleaner"}
          </button>

          {editingId && (
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </form>

        <div style={styles.searchCard}>
          <input
            style={styles.input}
            placeholder="Search by name, phone, status, team, notes, workload"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.resultCount}>
          {filteredCleaners.length} result
          {filteredCleaners.length === 1 ? "" : "s"}
        </div>

        <div style={styles.grid}>
          {filteredCleaners.map((cleaner) => {
            const workload = getCleanerWorkload(cleaner.id);

            return (
              <div key={cleaner.id} style={styles.card}>
                <div style={styles.name}>{cleaner.name}</div>
                <div style={styles.meta}>Phone: {cleaner.phone || "-"}</div>
                <div style={styles.meta}>Team: {cleaner.team || "-"}</div>
                <div style={styles.meta}>
                  Status:{" "}
                  <span
                    style={
                      cleaner.status === "active"
                        ? styles.activeStatus
                        : styles.inactiveStatus
                    }
                  >
                    {cleaner.status}
                  </span>
                </div>

                <div style={styles.meta}>
                  Workload:{" "}
                  <span
                    style={{
                      background: workload.bg,
                      color: workload.color,
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "700",
                      display: "inline-block",
                    }}
                  >
                    {workload.label}
                  </span>
                </div>

                <div style={styles.meta}>Notes: {cleaner.notes || "-"}</div>

                <div style={styles.actions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => handleEdit(cleaner)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}

          {filteredCleaners.length === 0 && (
            <div style={styles.empty}>No cleaners found</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "20px",
  },
  formCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  searchCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
  },
  primaryBtn: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  secondaryBtn: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  resultCount: {
    color: "#6b7280",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gap: "14px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  name: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  meta: {
    color: "#6b7280",
    marginBottom: "6px",
  },
  actions: {
    marginTop: "12px",
  },
  editBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
  },
  activeStatus: {
    color: "#15803d",
    fontWeight: "700",
  },
  inactiveStatus: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  empty: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    color: "#6b7280",
  },
};