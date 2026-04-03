import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function JobsPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, dateFilter]);

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
      const orderNo = (job.orderNo || "").toLowerCase();
      const source = (job.source || "").toLowerCase();
      const address = (job.customer?.address || "").toLowerCase();

      return (
        customerName.includes(q) ||
        cleanerName.includes(q) ||
        serviceType.includes(q) ||
        status.includes(q) ||
        serviceTime.includes(q) ||
        orderNo.includes(q) ||
        source.includes(q) ||
        address.includes(q)
      );
    });
  }, [jobs, search]);

  const stats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    assigned: jobs.filter((j) => j.status === "assigned").length,
    completed: jobs.filter((j) => j.status === "completed").length,
  };

  return (
    <AppLayout title="Jobs">
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Jobs</h1>
            <div style={styles.subtitle}>
              Manage bookings, assignments, and job progress.
            </div>
          </div>

          <button
            style={styles.newJobBtn}
            onClick={() => navigate("/jobs/new")}
          >
            + New Job
          </button>
        </div>

        <div style={styles.kpiGrid}>
          <KpiCard label="Total Jobs" value={stats.total} />
          <KpiCard label="Pending" value={stats.pending} />
          <KpiCard label="Assigned" value={stats.assigned} />
          <KpiCard label="Completed" value={stats.completed} />
        </div>

        <div style={styles.filterBar}>
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
            placeholder="Search order no, customer, cleaner, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        <div style={styles.tableWrap}>
          <div style={styles.tableHeader}>
            <div>Client</div>
            <div>Job number</div>
            <div>Property</div>
            <div>Schedule</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filteredJobs.length === 0 ? (
            <div style={styles.emptyRow}>
              <div style={styles.emptyTitle}>No jobs found</div>
              <div style={styles.emptySub}>
                Try changing filters or create a new booking.
              </div>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                style={styles.tableRow}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div style={styles.clientCell}>
                  <div style={styles.clientName}>
                    {job.customer?.name || "Unknown Customer"}
                  </div>
                  <div style={styles.clientSub}>
                    {job.customer?.phone || "-"}
                  </div>
                </div>

                <div style={styles.jobNumberCell}>
                  <div style={styles.jobNumberMain}>
                    {job.orderNo || `JOB-${job.id}`}
                  </div>
                  <div style={styles.jobNumberSub}>
                    {job.serviceType || "-"}
                  </div>
                </div>

                <div style={styles.propertyCell}>
                  <div style={styles.propertyText}>
                    {job.customer?.address || "-"}
                  </div>
                </div>

                <div style={styles.scheduleCell}>
                  <div style={styles.scheduleMain}>
                    {formatDate(job.serviceDate)}
                  </div>
                  <div style={styles.scheduleSub}>
                    {job.serviceTime || "-"}
                  </div>
                </div>

                <div style={styles.statusCell}>
                  <div style={getStatusBadge(job.status)}>{job.status}</div>
                </div>

                <div
                  style={styles.actionsCell}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionMenu
                    job={job}
                    refresh={fetchJobs}
                    onOpen={() => navigate(`/jobs/${job.id}`)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function KpiCard({ label, value }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

function ActionMenu({ job, refresh, onOpen }) {
  const token = localStorage.getItem("token");
  const [open, setOpen] = useState(false);

  async function updateStatus(status) {
    try {
      await axios.put(
        `${API}/jobs/${job.id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refresh();
      setOpen(false);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to update status");
    }
  }

  async function remove() {
    const confirmed = window.confirm("Are you sure you want to delete this job?");
    if (!confirmed) return;

    try {
      await axios.delete(`${API}/jobs/${job.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      refresh();
      setOpen(false);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to delete job");
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        style={styles.menuBtn}
        onClick={() => setOpen((prev) => !prev)}
      >
        •••
      </button>

      {open && (
        <div style={styles.menu}>
          <button style={styles.menuItem} onClick={onOpen}>
            Open
          </button>

          {job.status !== "assigned" && (
            <button
              style={styles.menuItem}
              onClick={() => updateStatus("assigned")}
            >
              Mark Assigned
            </button>
          )}

          {job.status !== "completed" && (
            <button
              style={styles.menuItem}
              onClick={() => updateStatus("completed")}
            >
              Mark Completed
            </button>
          )}

          <button
            style={{ ...styles.menuItem, ...styles.menuDanger }}
            onClick={remove}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(d) {
  if (!d) return "";
  return d.split("T")[0];
}

function getStatusBadge(status) {
  if (status === "completed") return styles.greenBadge;
  if (status === "assigned") return styles.blueBadge;
  return styles.grayBadge;
}

const styles = {
  page: {
    display: "grid",
    gap: 16,
  },

  header: {
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

  newJobBtn: {
    padding: "12px 16px",
    border: "none",
    borderRadius: 12,
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },

  kpiCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  kpiLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: 700,
  },

  kpiValue: {
    fontSize: 28,
    fontWeight: 850,
    color: "#111827",
  },

  filterBar: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.6fr auto",
    gap: 10,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  input: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    minWidth: 0,
    fontSize: 14,
    outline: "none",
  },

  secondaryBtn: {
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },

  tableWrap: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1.1fr 1.4fr 1fr 0.9fr 90px",
    gap: 18,
    padding: "16px 18px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1.1fr 1.4fr 1fr 0.9fr 90px",
    gap: 18,
    padding: "18px 18px",
    borderBottom: "1px solid #f1f5f9",
    alignItems: "center",
    cursor: "pointer",
  },

  clientCell: {
    minWidth: 0,
  },

  clientName: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 4,
  },

  clientSub: {
    fontSize: 13,
    color: "#6b7280",
  },

  jobNumberCell: {
    minWidth: 0,
  },

  jobNumberMain: {
    fontSize: 15,
    fontWeight: 800,
    color: "#1d4ed8",
    marginBottom: 4,
  },

  jobNumberSub: {
    fontSize: 13,
    color: "#6b7280",
  },

  propertyCell: {
    minWidth: 0,
  },

  propertyText: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    lineHeight: 1.45,
    wordBreak: "break-word",
  },

  scheduleCell: {
    minWidth: 0,
  },

  scheduleMain: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  },

  scheduleSub: {
    fontSize: 13,
    color: "#6b7280",
  },

  statusCell: {
    display: "flex",
    alignItems: "center",
  },

  actionsCell: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  menuBtn: {
    width: 40,
    height: 40,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 16,
    color: "#111827",
  },

  menu: {
    position: "absolute",
    right: 0,
    top: 46,
    minWidth: 180,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 8,
    display: "grid",
    gap: 4,
    boxShadow: "0 14px 30px rgba(15,23,42,0.12)",
    zIndex: 20,
  },

  menuItem: {
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    cursor: "pointer",
  },

  menuDanger: {
    color: "#dc2626",
  },

  greenBadge: {
    background: "#dcfce7",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
    width: "fit-content",
  },

  blueBadge: {
    background: "#dbeafe",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
    width: "fit-content",
  },

  grayBadge: {
    background: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
    width: "fit-content",
  },

  emptyRow: {
    padding: "28px 18px",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
  },

  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: "#6b7280",
  },
};