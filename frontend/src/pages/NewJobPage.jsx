import { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function NewJobPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    serviceType: "",
    serviceDate: "",
    serviceTime: "",
    cleanerId: "",
    notes: "",
  });

  useEffect(() => {
    fetchCustomers();
    fetchCleaners();
  }, []);

  async function fetchCustomers() {
    try {
      const res = await axios.get(`${API}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(res.data.customers || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to fetch customers");
    }
  }

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

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.customerId || !form.serviceDate) {
      alert("Customer and date are required");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API}/jobs`,
        {
          customerId: Number(form.customerId),
          cleanerId: form.cleanerId ? Number(form.cleanerId) : undefined,
          serviceType: form.serviceType,
          serviceDate: form.serviceDate,
          serviceTime: form.serviceTime,
          notes: form.notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      navigate("/jobs");
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="New Job">
      <div style={styles.page}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>New Job</h1>
            <div style={styles.subtitle}>
              Create a new customer booking.
            </div>
          </div>

          <button style={styles.backBtn} onClick={() => navigate("/jobs")}>
            ← Back to Jobs
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.formWrap}>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Job Information</div>
            <div style={styles.sectionGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Customer</label>
                <select
                  name="customerId"
                  value={form.customerId}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Service Type</label>
                <input
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  placeholder="e.g. Deep clean"
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Schedule</div>
            <div style={styles.sectionGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  name="serviceDate"
                  value={form.serviceDate}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Time</label>
                <input
                  name="serviceTime"
                  value={form.serviceTime}
                  onChange={handleChange}
                  placeholder="e.g. 3PM"
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Assignment</div>
            <div style={styles.sectionGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Cleaner</label>
                <select
                  name="cleanerId"
                  value={form.cleanerId}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Unassigned</option>
                  {cleaners.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Notes</div>
            <div style={styles.field}>
              <label style={styles.label}>Internal Note</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add internal notes for this job..."
                style={styles.textarea}
              />
            </div>
          </div>

          <div style={styles.footerActions}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => navigate("/jobs")}
            >
              Cancel
            </button>

            <button type="submit" style={styles.primaryBtn} disabled={loading}>
              {loading ? "Saving..." : "Save Job"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: 20,
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.05,
    fontWeight: 850,
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  subtitle: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 14,
  },

  backBtn: {
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },

  formWrap: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
    overflow: "hidden",
  },

  section: {
    padding: 22,
    borderBottom: "1px solid #eef2f7",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 16,
  },

  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },

  field: {
    display: "grid",
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
  },

  input: {
    padding: "13px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    minWidth: 0,
    fontSize: 14,
    outline: "none",
  },

  textarea: {
    minHeight: 120,
    padding: "13px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: 14,
    resize: "vertical",
    outline: "none",
  },

  footerActions: {
    padding: 22,
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    background: "#fcfcfd",
  },

  primaryBtn: {
    padding: "12px 16px",
    border: "none",
    borderRadius: 12,
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
  },

  secondaryBtn: {
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },
};