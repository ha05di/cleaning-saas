import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";
import { useCompany } from "../context/CompanyContext";
import { compareJobsBySchedule, formatDateForDisplay } from "../utils/time";

const API = API_BASE_URL;

export default function CustomerDetailPage() {
  const token = localStorage.getItem("token");
  const { id } = useParams();
  const navigate = useNavigate();
  const { timezone } = useCompany();

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
        .sort((a, b) => compareJobsBySchedule(b, a, timezone));

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
        ? formatDateTime(jobs[0].serviceDate, jobs[0].serviceTime, timezone)
        : "-";

    return {
      totalOrders,
      completedOrders,
      assignedOrders,
      latestOrder,
    };
  }, [jobs, timezone]);

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

  const fullName = getCustomerFullName(customer);
  const companyName = customer.companyName?.trim() || "";
  const headerTitle = fullName || companyName || customer.name || "Unnamed Customer";
  const profileSub = companyName || "Individual Client";

  return (
    <AppLayout title="Customer Detail">
      <div style={styles.page}>
        <div style={styles.topBar}>
          <div>
            <div style={styles.eyebrow}>Customer profile</div>
            <h1 style={styles.pageTitle}>{headerTitle}</h1>
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
              <div style={styles.avatar}>{getInitial(headerTitle)}</div>

              <div>
                <div style={styles.customerName}>{headerTitle}</div>
                <div style={styles.customerSub}>{profileSub}</div>
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
              <InfoItem label="Full name" value={fullName || "-"} />
              <InfoItem label="Company name" value={companyName || "-"} />
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
                        {formatSchedule(job.serviceDate, job.serviceTime, timezone)}
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

function getCustomerFullName(customer) {
  const first = (customer?.firstName || "").trim();
  const last = (customer?.lastName || "").trim();
  const combined = [first, last].filter(Boolean).join(" ").trim();

  if (combined) return combined;

  const company = (customer?.companyName || "").trim();
  const name = (customer?.name || "").trim();

  if (name && company && name.toLowerCase() === company.toLowerCase()) {
    return "";
  }

  return name || "";
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

function formatDateTime(dateString, timeString, timezone) {
  if (!dateString) return "-";

  const formattedDate = formatDateForDisplay(dateString, timezone);
  return timeString ? `${formattedDate} · ${timeString}` : formattedDate;
}

function formatSchedule(dateString, timeString, timezone) {
  if (!dateString) return "-";

  const formattedDate = formatDateForDisplay(dateString, timezone);
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
    color: "#475569",
    border: "1px solid #e5e7eb",
  };
}

const styles = {
  page: {
    display: "grid",
    gap: 20,
    paddingBottom: 28,
  },

  loadingCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 24,
    color: "#475569",
    fontWeight: 700,
  },

  emptyCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 24,
    color: "#475569",
    fontWeight: 700,
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
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 8,
  },

  pageTitle: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.05,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  pageSubtitle: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.6,
  },

  topActions: {
    display: "flex",
    gap: 12,
  },

  primaryBtn: {
    padding: "12px 18px",
    border: "none",
    borderRadius: 14,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37,99,235,0.18)",
  },

  secondaryBtn: {
    padding: "12px 18px",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    background: "#fff",
    color: "#111827",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.75fr 1fr",
    gap: 18,
    alignItems: "start",
  },

  profileCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: "#123d57",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    fontWeight: 900,
    flexShrink: 0,
  },

  customerName: {
    fontSize: 24,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.1,
  },

  customerSub: {
    marginTop: 6,
    fontSize: 16,
    color: "#64748b",
  },

  profileMetaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },

  metaBlock: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
  },

  metaLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 10,
  },

  metaValue: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },

  summaryCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  summaryTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 18,
  },

  summaryList: {
    display: "grid",
    gap: 0,
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 0",
    borderBottom: "1px solid #e5e7eb",
    gap: 12,
  },

  summaryLabel: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: 600,
  },

  summaryValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 900,
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
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
  },

  sectionHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  filterChip: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
  },

  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: 24,
    lineHeight: 1,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(37,99,235,0.18)",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },

  infoItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    minHeight: 76,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 10,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.6,
    wordBreak: "break-word",
  },

  emptyInline: {
    padding: 20,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    textAlign: "center",
    fontWeight: 700,
  },

  historyTableWrap: {
    display: "grid",
    gap: 0,
  },

  historyHead: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1.5fr 1fr auto",
    gap: 16,
    padding: "0 10px 12px 10px",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },

  historyRow: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1.5fr 1fr auto",
    gap: 16,
    alignItems: "center",
    padding: "16px 10px",
    cursor: "pointer",
  },

  historyRowBorder: {
    borderBottom: "1px solid #e5e7eb",
  },

  scheduleCol: {
    minWidth: 0,
  },

  scheduleTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },

  scheduleIcon: {
    fontSize: 16,
    color: "#334155",
    fontWeight: 900,
  },

  scheduleDate: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 800,
  },

  scheduleSub: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: 700,
    paddingLeft: 26,
  },

  titleCol: {
    minWidth: 0,
  },

  titleMain: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 6,
    lineHeight: 1.4,
  },

  titleSub: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#123d57",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 900,
    flexShrink: 0,
  },

  assignedName: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 700,
    lineHeight: 1.4,
  },

  unassignedBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#94a3b8",
    fontWeight: 700,
  },

  unassignedIcon: {
    fontSize: 16,
  },

  unassignedText: {
    fontSize: 13,
  },

  rowActionCol: {
    display: "flex",
    justifyContent: "flex-end",
  },

  statusBadgeBase: {
    padding: "7px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
    textTransform: "capitalize",
  },
};