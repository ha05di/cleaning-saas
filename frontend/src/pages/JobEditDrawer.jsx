import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { DEFAULT_COMPANY_TIMEZONE, normalizeTimeZone, getDateKeyInTimeZone } from "../utils/time";

const API = API_BASE_URL;

const INITIAL_FORM = {
  title: "",
  serviceType: "",
  serviceDate: "",
  serviceTime: "",
  endDate: "",
  endTime: "",
  address: "",
  notes: "",
  instructions: "",
  cleanerId: "",
  status: "pending",
};

export default function JobEditDrawer({
  open,
  job,
  cleaners = [],
  onClose,
  onSaved,
}) {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [companyTimezone, setCompanyTimezone] = useState(DEFAULT_COMPANY_TIMEZONE);

  useEffect(() => {
    if (!open) return;
    fetchCompanySettings();
  }, [open]);

  useEffect(() => {
    if (!open || !job) return;

    setForm({
      title: job.title || "",
      serviceType: job.serviceType || "",
      serviceDate: toDateInput(job.serviceDate, companyTimezone),
      serviceTime: job.serviceTime || "",
      endDate: toDateInput(job.endDate, companyTimezone),
      endTime: job.endTime || "",
      address: job.address || "",
      notes: job.notes || "",
      instructions: job.instructions || "",
      cleanerId: job.cleanerId ? String(job.cleanerId) : "",
      status: job.status || "pending",
    });
  }, [open, job, companyTimezone]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);


  async function fetchCompanySettings() {
    try {
      const res = await axios.get(`${API}/api/settings/company`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const settings = res.data?.settings || {};
      setCompanyTimezone(normalizeTimeZone(settings.timezone));
    } catch (error) {
      console.error("Failed to fetch company settings", error);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!job?.id) return;

    try {
      setSaving(true);

      await axios.put(
        `${API}/jobs/${job.id}`,
        {
          title: form.title.trim(),
          serviceType: form.serviceType.trim(),
          serviceDate: form.serviceDate || null,
          serviceTime: form.serviceTime.trim(),
          endDate: form.endDate || null,
          endTime: form.endTime.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
          instructions: form.instructions.trim(),
          cleanerId: form.cleanerId ? Number(form.cleanerId) : null,
          status: form.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await onSaved();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to update job");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !job) return null;

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />

      <aside style={styles.drawer}>
        <div style={styles.drawerHeader}>
          <h2 style={styles.drawerTitle}>Edit Job</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Job details</h3>

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Job title"
              style={styles.input}
            />

            <input
              name="serviceType"
              value={form.serviceType}
              onChange={handleChange}
              placeholder="Job type / service type"
              style={styles.input}
            />
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Schedule</h3>

            <div style={styles.row2}>
              <input
                type="date"
                name="serviceDate"
                value={form.serviceDate}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                type="time"
                name="serviceTime"
                value={form.serviceTime}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.row2}>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Assignment</h3>

            <select
              name="cleanerId"
              value={form.cleanerId}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Unassigned</option>
              {cleaners.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Address & notes</h3>

            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              style={styles.input}
            />

            <textarea
              name="instructions"
              value={form.instructions}
              onChange={handleChange}
              placeholder="Instructions"
              rows={4}
              style={styles.textarea}
            />

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Internal notes"
              rows={4}
              style={styles.textarea}
            />
          </section>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>

            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? "Updating..." : "Update Job"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

function toDateInput(value, timeZone = DEFAULT_COMPANY_TIMEZONE) {
  return getDateKeyInTimeZone(value, timeZone);
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.28)",
    zIndex: 9998,
  },

  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    height: "100vh",
    width: "min(640px, 100vw)",
    background: "#fff",
    boxShadow: "-20px 0 50px rgba(15,23,42,0.16)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
  },

  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "28px 28px 18px",
    borderBottom: "1px solid #e5e7eb",
    flexShrink: 0,
  },

  drawerTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 850,
    color: "#0f172a",
  },

  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: 24,
    cursor: "pointer",
    color: "#475569",
    lineHeight: 1,
  },

  form: {
    padding: 28,
    overflowY: "auto",
    display: "grid",
    gap: 28,
  },

  section: {
    display: "grid",
    gap: 14,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: "#0f172a",
  },

  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  input: {
    width: "100%",
    minHeight: 50,
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    background: "#fff",
    fontSize: 15,
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: 110,
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    background: "#fff",
    fontSize: 15,
    color: "#111827",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 8,
  },

  cancelBtn: {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },

  saveBtn: {
    border: "none",
    background: "#2f7d1f",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
  },
};