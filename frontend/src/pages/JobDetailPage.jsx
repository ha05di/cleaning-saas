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
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate("/jobs")}>
            ← Back to Jobs
          </button>
        </div>

        <div style={styles.heroCard}>
          <div style={styles.heroLeft}>
            <div style={styles.orderPill}>{job.orderNo || `JOB-${job.id}`}</div>
            <div style={styles.customerName}>
              {job.customer?.name || "Unknown Customer"}
            </div>
            <div style={styles.heroMeta}>
              <span>{formatDate(job.serviceDate)}</span>
              {job.serviceTime ? <span>· {job.serviceTime}</span> : null}
              {job.serviceType ? <span>· {job.serviceType}</span> : null}
            </div>
          </div>

          <div style={styles.heroRight}>
            <div style={getStatusBadge(job.status)}>{job.status}</div>
          </div>
        </div>

        <div style={styles.contentGrid}>
          <div style={styles.detailCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Job Details</div>
              <div style={styles.cardSub}>Core information for this order</div>
            </div>

            <div style={styles.detailList}>
              <DetailRow label="Job ID" value={`#${job.id}`} />
              <DetailRow label="Phone" value={job.customer?.phone || "-"} />
              <DetailRow label="Address" value={job.customer?.address || "-"} />
              <DetailRow label="Cleaner" value={job.cleaner?.name || "Not assigned"} />
              <DetailRow label="Source" value={job.source || "-"} />
              <DetailRow label="Created By" value={job.createdBy || "-"} />
              <DetailRow label="External Ref" value={job.externalRef || "-"} />
            </div>
          </div>

          <div style={styles.actionCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Actions</div>
              <div style={styles.cardSub}>Manage assignment and status</div>
            </div>

            <div style={styles.actionBlock}>
              <div style={styles.blockTitle}>Assign Cleaner</div>
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

            <div style={styles.softDivider} />

            <div style={styles.actionBlock}>
              <div style={styles.blockTitle}>Update Status</div>

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
        </div>

        <div style={styles.dangerInline}>
          <div>
            <div style={styles.dangerTitle}>Delete Job</div>
            <div style={styles.dangerText}>
              Permanently remove this job record.
            </div>
          </div>

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

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={styles.detailValue}>{value}</div>
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
      border: "1px solid #bbf7d0",
      padding: "8px 14px",
      borderRadius: "999px",
      fontSize: "13px",
      fontWeight: "700",
      textTransform: "capitalize",
    };
  }

  if (status === "assigned") {
    return {
      background: "#dbeafe",
      color: "#2563eb",
      border: "1px solid #bfdbfe",
      padding: "8px 14px",
      borderRadius: "999px",
      fontSize: "13px",
      fontWeight: "700",
      textTransform: "capitalize",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700",
    textTransform: "capitalize",
  };
}

const styles = {
  page: {
    display: "grid",
    gap: "20px",
  },
  topBar: {
    display: "flex",
    justifyContent: "flex-start",
  },
  backBtn: {
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    color: "#111827",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  },
  heroCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
  },
  heroLeft: {
    display: "grid",
    gap: "10px",
  },
  heroRight: {
    display: "flex",
    alignItems: "flex-start",
  },
  orderPill: {
    background: "#eef4ff",
    color: "#1d4ed8",
    border: "1px solid #c7d7fe",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "800",
    width: "fit-content",
    letterSpacing: "0.02em",
  },
  customerName: {
    fontSize: "30px",
    lineHeight: 1.1,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },
  heroMeta: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    fontSize: "15px",
    color: "#6b7280",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.5fr) minmax(340px, 0.88fr)",
    gap: "20px",
    alignItems: "start",
  },
  detailCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "22px",
    padding: "24px 24px 14px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },
  actionCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
    position: "sticky",
    top: "20px",
  },
  cardHeader: {
    marginBottom: "18px",
  },
  cardTitle: {
    fontSize: "21px",
    fontWeight: "800",
    color: "#111827",
    letterSpacing: "-0.02em",
  },
  cardSub: {
    marginTop: "5px",
    fontSize: "13px",
    color: "#6b7280",
  },
  detailList: {
    display: "grid",
    gap: "2px",
  },
  detailRow: {
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    gap: "20px",
    padding: "16px 0",
    borderBottom: "1px solid #f1f5f9",
    alignItems: "start",
  },
  detailLabel: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#111827",
    wordBreak: "break-word",
  },
  actionBlock: {
    display: "grid",
    gap: "12px",
  },
  blockTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#111827",
  },
  softDivider: {
    height: "1px",
    background: "#eef2f7",
    margin: "18px 0",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: "14px",
    outline: "none",
  },
  primaryBtn: {
    padding: "13px 16px",
    border: "none",
    borderRadius: "14px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px",
    boxShadow: "0 6px 14px rgba(37,99,235,0.18)",
  },
  grayBtn: {
    padding: "13px 16px",
    border: "none",
    borderRadius: "14px",
    background: "#6b7280",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px",
  },
  blueBtn: {
    padding: "13px 16px",
    border: "none",
    borderRadius: "14px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px",
  },
  greenBtn: {
    padding: "13px 16px",
    border: "none",
    borderRadius: "14px",
    background: "#16a34a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px",
  },
  dangerInline: {
    background: "#fff",
    border: "1px solid #fecaca",
    borderRadius: "18px",
    padding: "18px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    boxShadow: "0 8px 24px rgba(15,23,42,0.03)",
  },
  dangerTitle: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#991b1b",
  },
  dangerText: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#7f1d1d",
  },
  deleteBtn: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "14px",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px",
  },
  loadingCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e5e7eb",
  },
  emptyCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e5e7eb",
    color: "#6b7280",
  },
};