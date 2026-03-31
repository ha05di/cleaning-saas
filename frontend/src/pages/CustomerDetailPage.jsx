import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function CustomerDetailPage() {
  const token = localStorage.getItem("token");
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetail();
  }, [id]);

  async function fetchCustomerDetail() {
    try {
      setLoading(true);

      const [customersRes, jobsRes] = await Promise.all([
        axios.get(`${API}/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const customers = customersRes.data.customers || [];
      const allJobs = jobsRes.data.jobs || [];

      const foundCustomer = customers.find(
        (item) => String(item.id) === String(id)
      );

      if (!foundCustomer) {
        setCustomer(null);
        setJobs([]);
        return;
      }

      const customerJobs = allJobs
        .filter((job) => String(job.customerId) === String(id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setCustomer(foundCustomer);
      setJobs(customerJobs);
    } catch (error) {
      console.error("Failed to fetch customer detail:", error);
      alert(error?.response?.data?.error || "Failed to fetch customer detail");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Customer Detail">
        <div style={styles.loadingCard}>Loading customer detail...</div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout title="Customer Detail">
        <div style={styles.emptyCard}>Customer not found</div>
      </AppLayout>
    );
  }

  const totalOrders = jobs.length;
  const latestOrderDate =
    jobs.length > 0 ? formatDate(jobs[0].serviceDate) : "-";

  return (
    <AppLayout title={`Customer #${customer.id}`}>
      <div style={styles.page}>
        <div style={styles.topActions}>
          <button
            style={styles.secondaryBtn}
            onClick={() => navigate("/customers")}
          >
            ← Back to Customers
          </button>

          <button
            style={styles.primaryBtn}
            onClick={() => navigate("/customers")}
          >
            Go to Customers List
          </button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Customer Information</h2>

          <div style={styles.infoGrid}>
            <InfoItem label="Customer ID" value={`#${customer.id}`} />
            <InfoItem label="Name" value={customer.name || "-"} />
            <InfoItem label="Phone" value={customer.phone || "-"} />
            <InfoItem label="Address" value={customer.address || "-"} />
            <InfoItem label="Total Orders" value={String(totalOrders)} />
            <InfoItem label="Latest Order" value={latestOrderDate} />
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Order History</h2>

          {jobs.length === 0 ? (
            <div style={styles.emptyInline}>No orders yet</div>
          ) : (
            <div style={styles.jobsList}>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  style={styles.jobCard}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div style={styles.jobMain}>
                    <div style={styles.jobTitle}>Job #{job.id}</div>
                    <div style={styles.jobMeta}>
                      {formatDate(job.serviceDate)}
                      {job.serviceTime ? ` · ${job.serviceTime}` : ""}
                    </div>
                    <div style={styles.jobMeta}>
                      {job.serviceType || "No service type"}
                    </div>
                  </div>

                  <div style={styles.jobRight}>
                    <span style={getStatusBadge(job.status)}>{job.status}</span>
                    <span style={styles.jobMeta}>
                      {job.cleaner?.name || "No cleaner"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
  cardTitle: {
    marginTop: 0,
    marginBottom: "16px",
    fontSize: "20px",
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
  jobsList: {
    display: "grid",
    gap: "12px",
  },
  jobCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
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
    alignItems: "flex-end",
    textAlign: "right",
  },
  jobTitle: {
    fontWeight: "700",
    fontSize: "16px",
  },
  jobMeta: {
    fontSize: "13px",
    color: "#6b7280",
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
  emptyInline: {
    color: "#6b7280",
  },
};