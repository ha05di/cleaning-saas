import { useEffect, useMemo, useState } from "react";
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

      const [customerRes, jobsRes] = await Promise.all([
        axios.get(`${API}/customers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const foundCustomer = customerRes.data.customer || null;
      const allJobs = jobsRes.data.jobs || [];

      if (!foundCustomer) {
        setCustomer(null);
        setJobs([]);
        return;
      }

      const customerJobs = allJobs
        .filter((job) => String(job.customerId) === String(id))
        .sort((a, b) => {
          const aTime = new Date(a.serviceDate || a.createdAt || 0).getTime();
          const bTime = new Date(b.serviceDate || b.createdAt || 0).getTime();
          return bTime - aTime;
        });

      setCustomer(foundCustomer);
      setJobs(customerJobs);
    } catch (error) {
      console.error("Failed to fetch customer detail:", error);
      alert(error?.response?.data?.error || "Failed to fetch customer detail");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const totalOrders = jobs.length;
    const completedOrders = jobs.filter((j) => j.status === "completed").length;
    const assignedOrders = jobs.filter((j) => j.status === "assigned").length;
    const latestOrder =
      jobs.length > 0
        ? formatDateTime(jobs[0].serviceDate, jobs[0].serviceTime)
        : "-";

    return {
      totalOrders,
      completedOrders,
      assignedOrders,
      latestOrder,
    };
  }, [jobs]);

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

  return (
    <AppLayout title="Customer Detail">
      <div style={styles.page}>
        <div style={styles.topBar}>
          <div>
            <div style={styles.eyebrow}>Customer profile</div>
            <h1 style={styles.pageTitle}>{customer.name || "Unnamed Customer"}</h1>
            <p style={styles.pageSubtitle}>
              View customer details, lead information, address, and job history.
            </p>
          </div>

          <div style={styles.topActions}>
            <button
              style={styles.secondaryBtn}
              onClick={() => navigate("/customers")}
            >
              Back
            </button>

            <button
              style={styles.primaryBtn}
              onClick={() => navigate("/customers")}
            >
              Go to Customers
            </button>
          </div>
        </div>

        <div style={styles.heroGrid}>
          <div style={styles.profileCard}>
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>{getInitial(customer.name)}</div>

              <div>
                <div style={styles.customerName}>
                  {customer.name || "Unnamed Customer"}
                </div>
                <div style={styles.customerSub}>
                  {customer.companyName || "Individual Client"}
                </div>
              </div>
            </div>

            <div style={styles.profileMetaGrid}>
              <MetaBlock label="Phone" value={customer.phone || "-"} />
              <MetaBlock label="Email" value={customer.email || "-"} />
              <MetaBlock label="Lead source" value={customer.leadSource || "-"} />
              <MetaBlock label="Customer ID" value={`#${customer.id}`} />
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryTitle}>Summary</div>

            <div style={styles.summaryList}>
              <SummaryRow label="Total jobs" value={String(stats.totalOrders)} />
              <SummaryRow label="Assigned" value={String(stats.assignedOrders)} />
              <SummaryRow label="Completed" value={String(stats.completedOrders)} />
              <SummaryRow label="Latest order" value={stats.latestOrder} />
            </div>
          </div>
        </div>

        <div style={styles.sectionGrid}>
          <section style={styles.card}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Client details</h2>
            </div>

            <div style={styles.detailsGrid}>
              <InfoItem label="Full name" value={customer.name || "-"} />
              <InfoItem label="Company name" value={customer.companyName || "-"} />
              <InfoItem label="Phone number" value={customer.phone || "-"} />
              <InfoItem label="Email" value={customer.email || "-"} />
              <InfoItem label="Lead source" value={customer.leadSource || "-"} />
              <InfoItem label="Notes" value={customer.notes || "-"} full />
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Property address</h2>
            </div>

            <div style={styles.detailsGrid}>
              <InfoItem label="Street 1" value={customer.street1 || "-"} />
              <InfoItem label="Street 2" value={customer.street2 || "-"} />
              <InfoItem label="City" value={customer.city || "-"} />
              <InfoItem label="Province" value={customer.province || "-"} />
              <InfoItem label="Postal code" value={customer.postalCode || "-"} />
              <InfoItem label="Country" value={customer.country || "-"} />
              <InfoItem
                label="Formatted address"
                value={customer.address || "-"}
                full
              />
            </div>
          </section>
        </div>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Client schedule</h2>
            <div style={styles.sectionHeaderRight}>
              <div style={styles.filterChip}>Type | All</div>
              <button
                style={styles.plusBtn}
                onClick={() => navigate("/jobs/new")}
                title="Add job"
              >
                +
              </button>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div style={styles.emptyInline}>No jobs yet</div>
          ) : (
            <div style={styles.historyTableWrap}>
              <div style={styles.historyHead}>
                <div>Schedule</div>
                <div>Title</div>
                <div>Assigned</div>
                <div></div>
              </div>

              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  style={{
                    ...styles.historyRow,
                    ...(index !== jobs.length - 1 ? styles.historyRowBorder : {}),
                  }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div style={styles.scheduleCol}>
                    <div style={styles.scheduleTop}>
                      <span style={styles.scheduleIcon}>
                        {job.status === "completed" ? "✓" : "▣"}
                      </span>
                      <span style={styles.scheduleDate}>
                        {formatSchedule(job.serviceDate, job.serviceTime)}
                      </span>
                    </div>

                    {job.status === "completed" && (
                      <div style={styles.scheduleSub}>Completed</div>
                    )}
                  </div>

                  <div style={styles.titleCol}>
                    <div style={styles.titleMain}>
                      {job.title || job.serviceType || `Job #${job.id}`}
                    </div>
                    <div style={styles.titleSub}>
                      {job.instructions ||
                        job.notes ||
                        job.address ||
                        job.customer?.address ||
                        "No additional details"}
                    </div>
                  </div>

                  <div style={styles.assignedCol}>
                    {job.cleaner?.name ? (
                      <div style={styles.assignedBox}>
                        <div style={styles.assignedAvatar}>
                          {getInitial(job.cleaner.name)}
                        </div>
                        <span style={styles.assignedName}>{job.cleaner.name}</span>
                      </div>
                    ) : (
                      <div style={styles.unassignedBox}>
                        <span style={styles.unassignedIcon}>⊘</span>
                        <span style={styles.unassignedText}>Unassigned</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.rowActionCol}>
                    <span style={getStatusBadge(job.status)}>
                      {formatStatus(job.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function MetaBlock({ label, value }) {
  return (
    <div style={styles.metaBlock}>
      <div style={styles.metaLabel}>{label}</div>
      <div style={styles.metaValue}>{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={styles.summaryRow}>
      <span style={styles.summaryLabel}>{label}</span>
      <span style={styles.summaryValue}>{value}</span>
    </div>
  );
}

function InfoItem({ label, value, full = false }) {
  return (
    <div
      style={{
        ...styles.infoItem,
        ...(full ? { gridColumn: "1 / -1" } : {}),
      }}
    >
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function getInitial(name = "") {
  return name.trim()?.charAt(0)?.toUpperCase() || "C";
}

function formatDateTime(dateString, timeString) {
  if (!dateString) return "-";

  const dateOnly = String(dateString).includes("T")
    ? String(dateString).split("T")[0]
    : String(dateString);

  return timeString ? `${dateOnly} · ${timeString}` : dateOnly;
}

function formatSchedule(dateString, timeString) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);

  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return timeString ? `${formattedDate}, ${timeString}` : formattedDate;
}

function formatStatus(status) {
  const value = String(status || "").replaceAll("_", " ");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusBadge(status) {
  const value = String(status || "").toLowerCase();

  if (value === "completed") {
    return {
      ...styles.statusBadgeBase,
      background: "#dcfce7",
      color: "#15803d",
      border: "1px solid #bbf7d0",
    };
  }

  if (value === "assigned") {
    return {
      ...styles.statusBadgeBase,
      background: "#dbeafe",
      color: "#2563eb",
      border: "1px solid #bfdbfe",
    };
  }

  if (value === "pending") {
    return {
      ...styles.statusBadgeBase,
      background: "#fef3c7",
      color: "#b45309",
      border: "1px solid #fde68a",
    };
  }

  return {
    ...styles.statusBadgeBase,
    background: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
  };
}

const styles = {
  page: {
    display: "grid",
    gap: 20,
    paddingBottom: 24,
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },

  eyebrow: {
    fontSize: 13,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 8,
  },

  pageTitle: {
    margin: 0,
    fontSize: 38,
    lineHeight: 1.05,
    fontWeight: 850,
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  pageSubtitle: {
    margin: "10px 0 0 0",
    fontSize: 16,
    color: "#64748b",
    lineHeight: 1.6,
    maxWidth: 780,
  },

  topActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  primaryBtn: {
    padding: "12px 16px",
    border: "none",
    borderRadius: 12,
    background: "#2563eb",
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
    color: "#111827",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(300px, 0.9fr)",
    gap: 18,
    alignItems: "stretch",
  },

  profileCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 22,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
    display: "grid",
    gap: 18,
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: "999px",
    background: "#163B4D",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    fontWeight: 800,
    flexShrink: 0,
  },

  customerName: {
    fontSize: 28,
    fontWeight: 850,
    color: "#0f172a",
    lineHeight: 1.1,
  },

  customerSub: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
  },

  profileMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  metaBlock: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
  },

  metaLabel: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#64748b",
    marginBottom: 8,
  },

  metaValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    wordBreak: "break-word",
  },

  summaryCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 22,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
    display: "grid",
    gap: 16,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: 850,
    color: "#0f172a",
  },

  summaryList: {
    display: "grid",
    gap: 12,
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
  },

  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: 600,
  },

  summaryValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: 800,
    textAlign: "right",
  },

  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
    alignItems: "start",
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 22,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },

  sectionHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 850,
    color: "#0f172a",
  },

  sectionSub: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 700,
  },

  filterChip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    padding: "0 16px",
    borderRadius: 999,
    background: "#f3f4f6",
    color: "#111827",
    fontSize: 14,
    fontWeight: 700,
  },

  plusBtn: {
    width: 40,
    height: 40,
    border: "none",
    borderRadius: 12,
    background: "transparent",
    color: "#2f7d1f",
    fontSize: 30,
    lineHeight: 1,
    cursor: "pointer",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  infoItem: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#64748b",
    marginBottom: 8,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },

  historyTableWrap: {
    border: "1px solid #dbe2ea",
    borderRadius: 14,
    overflow: "hidden",
    background: "#fff",
  },

  historyHead: {
    display: "grid",
    gridTemplateColumns: "1.2fr 2fr 1.2fr 120px",
    gap: 16,
    padding: "14px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 14,
    fontWeight: 800,
    color: "#163B4D",
  },

  historyRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 2fr 1.2fr 120px",
    gap: 16,
    padding: "18px 16px",
    alignItems: "center",
    cursor: "pointer",
    background: "#fff",
  },

  historyRowBorder: {
    borderBottom: "1px solid #eef2f7",
  },

  scheduleCol: {
    minWidth: 0,
    display: "grid",
    gap: 8,
  },

  scheduleTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },

  scheduleIcon: {
    fontSize: 18,
    color: "#65a30d",
    lineHeight: 1,
    flexShrink: 0,
  },

  scheduleDate: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.35,
    wordBreak: "break-word",
  },

  scheduleSub: {
    fontSize: 13,
    color: "#64748b",
    paddingLeft: 28,
  },

  titleCol: {
    minWidth: 0,
    display: "grid",
    gap: 6,
  },

  titleMain: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.3,
    wordBreak: "break-word",
  },

  titleSub: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.45,
    wordBreak: "break-word",
  },

  assignedCol: {
    minWidth: 0,
  },

  assignedBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  assignedAvatar: {
    width: 28,
    height: 28,
    borderRadius: "999px",
    background: "#163B4D",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },

  assignedName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    wordBreak: "break-word",
  },

  unassignedBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  unassignedIcon: {
    color: "#ef4444",
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
  },

  unassignedText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: 600,
  },

  rowActionCol: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  statusBadgeBase: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
    display: "inline-block",
  },

  loadingCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 24,
    border: "1px solid #e5e7eb",
  },

  emptyCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 24,
    border: "1px solid #e5e7eb",
    color: "#6b7280",
  },

  emptyInline: {
    color: "#6b7280",
    fontSize: 14,
  },
};