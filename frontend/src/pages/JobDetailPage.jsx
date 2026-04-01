import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function JobDetailPage() {
  const token = localStorage.getItem("token");
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [cleaners, setCleaners] = useState([]);
  const [selectedCleaner, setSelectedCleaner] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchJobDetail();
    fetchCleaners();
  }, [id]);

  async function fetchJobDetail() {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const jobs = res.data.jobs || [];
      const foundJob = jobs.find((item) => String(item.id) === String(id));

      if (!foundJob) {
        setJob(null);
        return;
      }

      setJob(foundJob);
      setSelectedCleaner(foundJob.cleaner?.id ? String(foundJob.cleaner.id) : "");
    } catch (error) {
      console.error("Failed to fetch job detail:", error);
      alert(error?.response?.data?.error || "Failed to fetch job detail");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCleaners() {
    try {
      const res = await axios.get(`${API}/cleaners`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCleaners(res.data.cleaners || []);
    } catch (error) {
      console.error("Failed to fetch cleaners:", error);
    }
  }

  async function handleAssignCleaner() {
    if (!selectedCleaner) {
      alert("Please select a cleaner");
      return;
    }

    try {
      setAssigning(true);

      await axios.put(
        `${API}/jobs/${id}/assign`,
        { cleanerId: Number(selectedCleaner) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchJobDetail();
      alert("Cleaner assigned successfully");
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to assign cleaner");
    } finally {
      setAssigning(false);
    }
  }

  async function handleStatusChange(status) {
    try {
      setUpdatingStatus(true);

      await axios.put(
        `${API}/jobs/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchJobDetail();
      alert(`Job marked as ${status}`);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this job?");
    if (!confirmed) return;

    try {
      setDeleting(true);

      await axios.delete(`${API}/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/jobs");
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to delete job");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Job Detail">
        <div style={styles.loadingCard}>Loading job detail...</div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout title="Job Detail">
        <div style={styles.emptyCard}>Job not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={job.orderNo || `Job #${job.id}`}>
      <div style={styles.page}>
        <div style={styles.topActions}>
          <button style={styles.secondaryBtn} onClick={() => navigate("/jobs")}>
            ← Back to Jobs
          </button>

          <button style={styles.primaryBtn} onClick={() => navigate("/jobs")}>
            Go to Jobs List
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.headerRow}>
            <div style={styles.headerLeft}>
              <h2 style={styles.cardTitle}>Job Information</h2>
              <div style={styles.orderNoBadge}>
                {job.orderNo || `JOB-${job.id}`}
              </div>
            </div>
            <span style={getStatusBadge(job.status)}>{job.status}</span>
          </div>

          <div style={styles.infoGrid}>
            <InfoItem label="Order No" value={job.orderNo || `JOB-${job.id}`} />
            <InfoItem label="Job ID" value={`#${job.id}`} />
            <InfoItem label="Customer" value={job.customer?.name || "-"} />
            <InfoItem label="Phone" value={job.customer?.phone || "-"} />
            <InfoItem label="Address" value={job.customer?.address || "-"} />
            <InfoItem label="Date" value={formatDate(job.serviceDate)} />
            <InfoItem label="Time" value={job.serviceTime || "-"} />
            <InfoItem label="Service Type" value={job.serviceType || "-"} />
            <InfoItem label="Cleaner" value={job.cleaner?.name || "Not assigned"} />
            <InfoItem label="Source" value={job.source || "-"} />
            <InfoItem label="Created By" value={job.createdBy || "-"} />
            <InfoItem label="External Ref" value={job.externalRef || "-"} />
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Assign Cleaner</h2>

          <div style={styles.assignRow}>
            <select
              style={styles.input}
              value={selectedCleaner}
              onChange={(e) => setSelectedCleaner(e.target.value)}
            >
              <option value="">Select Cleaner</option>
              {cleaners.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.name}
                </option>
              ))}
            </select>

            <button
              style={styles.primaryBtn}
              onClick={handleAssignCleaner}
              disabled={assigning}
            >
              {assigning ? "Assigning..." : "Assign Cleaner"}
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Update Status</h2>

          <div style={styles.buttonRow}>
            <button
              style={styles.grayBtn}
              onClick={() => handleStatusChange("pending")}
              disabled={updatingStatus}
            >
              Mark Pending
            </button>

            <button
              style={styles.blueBtn}
              onClick={() => handleStatusChange("assigned")}
              disabled={updatingStatus}
            >
              Mark Assigned
            </button>

            <button
              style={styles.greenBtn}
              onClick={() => handleStatusChange("completed")}
              disabled={updatingStatus}
            >
              Mark Completed
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Danger Zone</h2>

          <button
            style={styles.deleteBtn}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Job"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={styles.infoItem}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return dateString.split("T")[0];
}

function getStatusBadge(status) {
  if (status === "completed") {
    return {
      background: "#dcfce7",
      color: "#15803d",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "600",
      display: "inline-block",
    };
  }

  if (status === "assigned") {
    return {
      background: "#dbeafe",
      color: "#2563eb",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "600",
      display: "inline-block",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#6b7280",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
  };
}

const styles = {
  page: {
    display: "grid",
    gap: "20px",
  },
  topActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  headerLeft: {
    display: "grid",
    gap: "10px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
  },
  orderNoBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: "700",
    width: "fit-content",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  infoItem: {
    padding: "14px",
    borderRadius: "12px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "8px",
  },
  infoValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
  },
  assignRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    minWidth: "220px",
  },
  primaryBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  secondaryBtn: {
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  grayBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#6b7280",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  blueBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  greenBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#16a34a",
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
  loadingCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e5e7eb",
  },
  emptyCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e5e7eb",
    color: "#6b7280",
  },
};