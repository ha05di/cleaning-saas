import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function JobsPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickCustomerLoading, setQuickCustomerLoading] = useState(false);

  const [quickCustomerForm, setQuickCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [form, setForm] = useState({
    customerId: "",
    serviceDate: "",
    serviceTime: "",
    serviceType: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, dateFilter]);

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

  async function fetchJobs() {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
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

  function handleQuickCustomerChange(e) {
    setQuickCustomerForm({
      ...quickCustomerForm,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.customerId || !form.serviceDate) {
      alert("Please select customer and date");
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await axios.put(
          `${API}/jobs/${editingId}`,
          {
            customerId: Number(form.customerId),
            serviceDate: form.serviceDate,
            serviceTime: form.serviceTime,
            serviceType: form.serviceType,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post(
          `${API}/jobs`,
          {
            customerId: Number(form.customerId),
            serviceDate: form.serviceDate,
            serviceTime: form.serviceTime,
            serviceType: form.serviceType,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      resetForm();
      await fetchJobs();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to save job");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickCreateCustomer(e) {
    e.preventDefault();

    if (!quickCustomerForm.name.trim()) {
      alert("Customer name is required");
      return;
    }

    setQuickCustomerLoading(true);

    try {
      const res = await axios.post(
        `${API}/customers`,
        {
          name: quickCustomerForm.name,
          phone: quickCustomerForm.phone,
          address: quickCustomerForm.address,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newCustomer = res.data.customer;

      await fetchCustomers();

      setForm((prev) => ({
        ...prev,
        customerId: String(newCustomer.id),
      }));

      setQuickCustomerForm({
        name: "",
        phone: "",
        address: "",
      });

      setShowQuickCustomer(false);
      alert("New customer created and selected");
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to create customer");
    } finally {
      setQuickCustomerLoading(false);
    }
  }

  function handleEdit(job) {
    setEditingId(job.id);
    setForm({
      customerId: job.customerId ? String(job.customerId) : "",
      serviceDate: formatDate(job.serviceDate),
      serviceTime: job.serviceTime || "",
      serviceType: job.serviceType || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      customerId: "",
      serviceDate: "",
      serviceTime: "",
      serviceType: "",
    });
  }

  function clearFilters() {
    setStatusFilter("");
    setDateFilter("");
    setSearch("");
  }

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;

    return jobs.filter((job) => {
      const customerName = (job.customer?.name || "").toLowerCase();
      const cleanerName = (job.cleaner?.name || "").toLowerCase();
      const serviceType = (job.serviceType || "").toLowerCase();
      const status = (job.status || "").toLowerCase();
      const serviceTime = (job.serviceTime || "").toLowerCase();

      return (
        customerName.includes(q) ||
        cleanerName.includes(q) ||
        serviceType.includes(q) ||
        status.includes(q) ||
        serviceTime.includes(q)
      );
    });
  }, [jobs, search]);

  return (
    <AppLayout title="Jobs">
      <div style={styles.page}>
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <div style={styles.customerSelectWrap}>
            <select
              name="customerId"
              value={form.customerId}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              style={styles.addInlineBtn}
              onClick={() => setShowQuickCustomer((prev) => !prev)}
            >
              {showQuickCustomer ? "Close New Customer" : "+ New Customer"}
            </button>
          </div>

          <input
            type="date"
            name="serviceDate"
            value={form.serviceDate}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            placeholder="Time"
            name="serviceTime"
            value={form.serviceTime}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            placeholder="Service Type"
            name="serviceType"
            value={form.serviceType}
            onChange={handleChange}
            style={styles.input}
          />

          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading
              ? editingId
                ? "Updating..."
                : "Creating..."
              : editingId
              ? "Update Job"
              : "Create"}
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

        {showQuickCustomer && (
          <form onSubmit={handleQuickCreateCustomer} style={styles.quickCustomerCard}>
            <div style={styles.quickCustomerTitle}>Quick New Customer</div>

            <input
              style={styles.input}
              name="name"
              placeholder="Customer Name"
              value={quickCustomerForm.name}
              onChange={handleQuickCustomerChange}
            />

            <input
              style={styles.input}
              name="phone"
              placeholder="Phone"
              value={quickCustomerForm.phone}
              onChange={handleQuickCustomerChange}
            />

            <input
              style={styles.input}
              name="address"
              placeholder="Address"
              value={quickCustomerForm.address}
              onChange={handleQuickCustomerChange}
            />

            <button
              type="submit"
              style={styles.primaryBtn}
              disabled={quickCustomerLoading}
            >
              {quickCustomerLoading ? "Saving..." : "Save Customer"}
            </button>
          </form>
        )}

        <div style={styles.filterCard}>
          <select
            style={styles.input}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
          </select>

          <input
            type="date"
            style={styles.input}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Search customer, cleaner, type, status, time"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

        <div style={styles.resultCount}>
          {filteredJobs.length} result
          {filteredJobs.length === 1 ? "" : "s"}
        </div>

        <div style={styles.list}>
          {filteredJobs.length === 0 ? (
            <div style={styles.empty}>No jobs found</div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} style={styles.card}>
                <div
                  style={{ ...styles.customerName, cursor: "pointer" }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  {job.customer?.name || "Unknown Customer"}
                </div>

                <div style={styles.meta}>
                  {formatDate(job.serviceDate)}
                  {job.serviceTime ? ` · ${job.serviceTime}` : ""}
                </div>

                <div style={styles.meta}>
                  {job.serviceType || "No service type"}
                </div>

                <div style={styles.meta}>
                  Status:{" "}
                  <span style={getStatusStyle(job.status)}>
                    {job.status}
                  </span>
                </div>

                <div style={styles.meta}>
                  Cleaner: {job.cleaner?.name || "Not assigned"}
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    style={styles.editBtn}
                    onClick={() => handleEdit(job)}
                  >
                    Edit
                  </button>

                  {job.status !== "completed" && (
                    <AssignCleaner job={job} onUpdated={fetchJobs} />
                  )}

                  {job.status === "assigned" && (
                    <button
                      type="button"
                      style={styles.completeBtn}
                      onClick={() => handleComplete(job.id, token, fetchJobs)}
                    >
                      Mark Completed
                    </button>
                  )}

                  <button
                    type="button"
                    style={styles.deleteBtn}
                    onClick={() =>
                      handleDelete(job.id, editingId, resetForm, token, fetchJobs)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function AssignCleaner({ job, onUpdated }) {
  const token = localStorage.getItem("token");
  const [cleaners, setCleaners] = useState([]);
  const [selected, setSelected] = useState(
    job.cleaner?.id ? String(job.cleaner.id) : ""
  );
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchCleaners();
  }, []);

  async function fetchCleaners() {
    try {
      const res = await axios.get(`${API}/cleaners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCleaners(res.data.cleaners || []);
    } catch (error) {
      console.error("Failed to fetch cleaners", error);
    }
  }

  async function handleAssign() {
    if (!selected) {
      alert("Please select a cleaner");
      return;
    }

    setAssigning(true);

    try {
      await axios.put(
        `${API}/jobs/${job.id}/assign`,
        { cleanerId: Number(selected) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await onUpdated();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to assign cleaner");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div style={styles.assignWrap}>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={styles.input}
      >
        <option value="">Assign Cleaner</option>
        {cleaners.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        style={styles.assignBtn}
        onClick={handleAssign}
        disabled={assigning}
      >
        {assigning ? "Assigning..." : "Assign"}
      </button>
    </div>
  );
}

async function handleComplete(jobId, token, refreshFn) {
  try {
    await axios.put(
      `${API}/jobs/${jobId}/status`,
      { status: "completed" },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    await refreshFn();
  } catch (error) {
    alert(error?.response?.data?.error || "Failed to mark completed");
  }
}

async function handleDelete(jobId, editingId, resetForm, token, refreshFn) {
  const confirmed = window.confirm("Are you sure you want to delete this job?");
  if (!confirmed) return;

  try {
    await axios.delete(`${API}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (editingId === jobId) {
      resetForm();
    }

    await refreshFn();
  } catch (error) {
    alert(error?.response?.data?.error || "Failed to delete job");
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  return dateString.split("T")[0];
}

function getStatusStyle(status) {
  if (status === "completed") return { color: "#15803d", fontWeight: 700 };
  if (status === "assigned") return { color: "#2563eb", fontWeight: 700 };
  return { color: "#6b7280", fontWeight: 700 };
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
  quickCustomerCard: {
    background: "#fff",
    border: "1px solid #dbeafe",
    borderRadius: "16px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  quickCustomerTitle: {
    gridColumn: "1 / -1",
    fontSize: "18px",
    fontWeight: "700",
    color: "#2563eb",
  },
  customerSelectWrap: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    alignItems: "center",
  },
  filterCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    minWidth: 0,
  },
  primaryBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  addInlineBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  resultCount: {
    color: "#6b7280",
    fontSize: "14px",
  },
  list: {
    display: "grid",
    gap: "14px",
  },
  empty: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  customerName: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  meta: {
    color: "#4b5563",
    marginBottom: "6px",
  },
  actions: {
    marginTop: "14px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  assignWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  assignBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  completeBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#16a34a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  editBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  deleteBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
};