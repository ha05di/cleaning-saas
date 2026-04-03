import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useCompany } from "../context/CompanyContext";
import {
  getTodayKeyInTimeZone,
  getHourInTimeZone,
  normalizeFirstDayOfWeek,
} from "../utils/time";

const API = API_BASE_URL;

function getSuggestedTime(timezone) {
  const hour = getHourInTimeZone(new Date(), timezone);

  if (hour < 8) return "09:00";
  if (hour >= 18) return "09:00";

  const nextHour = Math.min(hour + 1, 18);
  return `${String(nextHour).padStart(2, "0")}:00`;
}

export default function NewJobPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const {
    company,
    timezone,
    firstDayOfWeek,
    loading: companyLoading,
  } = useCompany();

  const [customers, setCustomers] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bootstrappedDefaults, setBootstrappedDefaults] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (companyLoading || bootstrappedDefaults) return;

    setForm((prev) => ({
      ...prev,
      serviceDate: prev.serviceDate || getTodayKeyInTimeZone(timezone),
      serviceTime: prev.serviceTime || getSuggestedTime(timezone),
    }));
    setBootstrappedDefaults(true);
  }, [companyLoading, bootstrappedDefaults, timezone]);

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
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function applySuggestedTime() {
    setForm((prev) => ({
      ...prev,
      serviceTime: getSuggestedTime(timezone),
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

  const companyLabel = useMemo(() => {
    return company?.companyName || "Your company";
  }, [company]);

  const firstDayLabel = useMemo(() => {
    return normalizeFirstDayOfWeek(firstDayOfWeek);
  }, [firstDayOfWeek]);

  return (
    <AppLayout title="New Job">
      <div style={styles.page}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>New Job</h1>
            <div style={styles.subtitle}>Create a new customer booking.</div>
          </div>

          <button style={styles.backBtn} onClick={() => navigate("/jobs")}>
            ← Back to Jobs
          </button>
        </div>

        <div style={styles.infoBanner}>
          <div style={styles.infoTitle}>{companyLabel}</div>
          <div style={styles.infoText}>
            Defaults use <strong>{timezone}</strong>. Week starts on <strong>{firstDayLabel}</strong>.
          </div>
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
                <div style={styles.timeRow}>
                  <input
                    type="time"
                    name="serviceTime"
                    value={form.serviceTime}
                    onChange={handleChange}
                    style={styles.input}
                  />
                  <button
                    type="button"
                    style={styles.smallActionBtn}
                    onClick={applySuggestedTime}
                  >
                    Auto
                  </button>
                </div>
                <div style={styles.helperText}>
                  Suggested time follows company timezone.
                </div>
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
                placeholder="Add internal notes for this job."
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
    marginTop: 8,
    color: "#64748b",
    fontSize: 15,
  },
  backBtn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  infoBanner: {
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    borderRadius: 18,
    padding: 16,
  },
  infoTitle: {
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 6,
  },
  infoText: {
    color: "#475569",
    fontSize: 14,
  },
  formWrap: {
    display: "grid",
    gap: 18,
  },
  section: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 6px 20px rgba(15,23,42,0.04)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 16,
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    color: "#0f172a",
    boxSizing: "border-box",
    background: "#fff",
  },
  timeRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    alignItems: "center",
  },
  smallActionBtn: {
    border: "1px solid #bfdbfe",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
  },
  textarea: {
    minHeight: 110,
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    color: "#0f172a",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
  },
  footerActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },
  secondaryBtn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 14,
    padding: "12px 18px",
    fontWeight: 800,
    cursor: "pointer",
  },
  primaryBtn: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 14,
    padding: "12px 18px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37,99,235,0.18)",
  },
};
