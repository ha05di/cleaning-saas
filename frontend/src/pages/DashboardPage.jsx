import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function DashboardPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data.jobs || []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const todayJobs = jobs.filter(
    (job) => job.serviceDate && job.serviceDate.split("T")[0] === today
  ).length;

  const pendingJobs = jobs.filter((job) => job.status === "pending").length;
  const assignedJobs = jobs.filter((job) => job.status === "assigned").length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <AppLayout title="Dashboard">
      {loading ? (
        <div style={styles.loadingCard}>Loading dashboard...</div>
      ) : (
        <>
          <div style={styles.grid}>
            <StatCard label="Today Jobs" value={todayJobs} />
            <StatCard label="Pending Jobs" value={pendingJobs} />
            <StatCard label="Assigned Jobs" value={assignedJobs} />
            <StatCard label="Completed Jobs" value={completedJobs} />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Recent Jobs</h2>

            {recentJobs.length === 0 ? (
              <div style={styles.empty}>No jobs yet</div>
            ) : (
              <div style={styles.list}>
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    style={styles.jobCard}
                    onClick={() => navigate("/jobs")}
                  >
                    <div style={styles.jobMain}>
                      <strong>{job.customer?.name || "Unknown"}</strong>
                      <span style={styles.jobMeta}>
                        {formatDate(job.serviceDate)}
                        {job.serviceTime ? ` · ${job.serviceTime}` : ""}
                      </span>
                    </div>

                    <div style={styles.jobRight}>
                      <span style={getStatusBadge(job.status)}>
                        {job.status}
                      </span>
                      <span style={styles.jobMeta}>
                        {job.cleaner?.name || "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardValue}>{value}</div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "";
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
  loadingCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e5e7eb",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "22px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  cardLabel: {
    fontSize: "15px",
    color: "#6b7280",
    marginBottom: "10px",
  },
  cardValue: {
    fontSize: "36px",
    fontWeight: "700",
  },
  section: {
    marginTop: "28px",
  },
  sectionTitle: {
    fontSize: "20px",
    marginBottom: "12px",
  },
  list: {
    display: "grid",
    gap: "10px",
  },
  jobCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "14px",
    border: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  jobMain: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  jobRight: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    textAlign: "right",
    alignItems: "flex-end",
  },
  jobMeta: {
    fontSize: "13px",
    color: "#6b7280",
  },
  empty: {
    background: "#fff",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
};