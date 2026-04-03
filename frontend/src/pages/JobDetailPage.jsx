import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";
import { useCompany } from "../context/CompanyContext";
import { formatDateForDisplay } from "../utils/time";

const API = API_BASE_URL;

export default function JobDetailPage() {
  const token = localStorage.getItem("token");
  const { id } = useParams();
  const navigate = useNavigate();
  const { timezone } = useCompany();

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

  const summary = useMemo(() => {
    if (!job) return null;

    return {
      title:
        job.title ||
        (job.customer?.name ? `Job for ${job.customer.name}` : `Job #${job.id}`),
      customerName: job.customer?.name || "Unknown Customer",
      address: job.address || job.customer?.address || "-",
      phone: job.customer?.phone || "-",
      startDate: formatDateForDisplay(job.serviceDate, timezone),
      endDate: formatDateForDisplay(job.endDate || job.serviceDate, timezone),
      assignedCleaner: job.cleaner?.name || "Unassigned",
      notes: job.notes || job.instructions || "",
      jobType: job.serviceType || "One-off job",
    };
  }, [job, timezone]);

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
          <div style={styles.topBarLeft}>
            <div style={styles.userText}>eddiе</div>
          </div>

          <div style={styles.topBarRight}>
            <div style={styles.searchPill}>Search</div>
          </div>
        </div>

        <div style={styles.mainLayout}>
          <div style={styles.mainColumn}>
            <div style={styles.heroCard}>
              <div style={styles.heroTopLine} />

              <div style={styles.heroActions}>
                <div style={styles.heroLeftActions}>
                  <span style={styles.toolIcon}>🛠</span>
                  {job.status === "pending" && (
                    <span style={styles.overdueBadge}>Pending</span>
                  )}
                  {job.status === "assigned" && (
                    <span style={styles.assignedHeroBadge}>Assigned</span>
                  )}
                  {job.status === "completed" && (
                    <span style={styles.completedHeroBadge}>Completed</span>
                  )}
                </div>

                <div style={styles.heroRightActions}>
                  <button style={styles.moreBtn}>••• More</button>
                  <button
                    style={styles.visitBtn}
                    onClick={() => navigate("/schedule")}
                  >
                    Show Visit
                  </button>
                </div>
              </div>

              <h1 style={styles.heroTitle}>
                {summary.title}
              </h1>

              <div style={styles.heroContentGrid}>
                <div style={styles.customerMiniCard}>
                  <div style={styles.customerMiniHeader}>
                    <div style={styles.customerMiniName}>
                      {summary.customerName}
                      <span style={styles.greenDot} />
                    </div>
                    <div style={styles.miniMenu}>•••</div>
                  </div>

                  <div style={styles.miniLabel}>Property Address</div>
                  <div style={styles.miniText}>{summary.address}</div>
                  <div style={styles.miniText}>{summary.phone}</div>
                </div>

                <div style={styles.heroMetaTable}>
                  <MetaRow label="Job #" value={String(job.id)} />
                  <MetaRow label="Job type" value={summary.jobType} />
                  <MetaRow label="Started on" value={summary.startDate} />
                  <MetaRow label="Ends on" value={summary.endDate} />
                  <MetaRow label="Billing frequency" value="Upon job completion" />
                </div>
              </div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.sectionInnerHeader}>
                <button style={styles.linkBtn}>Hide Profitability</button>
              </div>

              <div style={styles.profitRow}>
                <div>
                  <div style={styles.profitValue}>0%</div>
                  <div style={styles.profitLabel}>Profit margin</div>
                </div>

                <div style={styles.profitStats}>
                  <ProfitItem label="Total price" value="$0.00" />
                  <ProfitItem label="Line Item Cost" value="$0.00" />
                  <ProfitItem label="Labor" value="$0.00" />
                  <ProfitItem label="Expenses" value="$0.00" />
                  <ProfitItem label="Profit" value="$0.00" />
                </div>
              </div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.sectionTitle}>Product / Service</div>
              <div style={styles.sectionText}>
                Keep everything on track by adding products and services.
              </div>

              <div style={styles.actionRow}>
                <button style={styles.greenOutlineBtn}>Add Line Item</button>
              </div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.sectionTitle}>Labor</div>
              <div style={styles.emptyMutedRow}>No labor items added yet</div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.expenseHeader}>
                <div style={styles.sectionTitle}>Expenses</div>
                <button style={styles.linkGreenBtn}>Add Expense</button>
              </div>
              <div style={styles.sectionText}>
                Track all expenses for this job in one place
              </div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.visitHeader}>
                <div>
                  <div style={styles.sectionTitle}>Scheduled visits</div>
                  <div style={styles.visitTopMeta}>
                    <div>
                      <div style={styles.smallMuted}>First visit</div>
                      <div style={styles.smallStrong}>{summary.startDate}</div>
                    </div>

                    <div>
                      <div style={styles.smallMuted}>Job forms</div>
                      <div style={styles.smallStrong}>—</div>
                    </div>
                  </div>
                </div>

                <button style={styles.editVisitsBtn}>Edit All Visits</button>
              </div>

              <div style={styles.visitToolsRow}>
                <div style={styles.filterChip}>Status | All</div>
                <button style={styles.smallPlusBtn}>+</button>
              </div>

              <div style={styles.visitTable}>
                <div style={styles.visitTableHead}>
                  <div>Date and time</div>
                  <div>Title and instructions</div>
                  <div>Status</div>
                  <div>Assigned</div>
                  <div></div>
                </div>

                <div style={styles.visitTableRow}>
                  <div style={styles.visitDateCell}>
                    <div style={styles.visitDateMain}>{summary.startDate}</div>
                    <div style={styles.visitDateSub}>
                      {job.serviceTime ? `上午${job.serviceTime}` : "Any time"}
                    </div>
                  </div>

                  <div>
                    <div style={styles.visitTitleMain}>
                      {job.title || job.customer?.name || `Job #${job.id}`}
                    </div>
                    <div style={styles.visitTitleSub}>
                      {job.instructions || job.notes || job.address || "-"}
                    </div>
                  </div>

                  <div>
                    <span style={getVisitStatusBadge(job.status)}>
                      {job.status === "completed"
                        ? "Completed"
                        : job.status === "assigned"
                        ? "Assigned"
                        : "Overdue"}
                    </span>
                  </div>

                  <div>
                    {job.cleaner?.name ? (
                      <div style={styles.assignedCleanerWrap}>
                        <div style={styles.cleanerAvatar}>
                          {getInitial(job.cleaner.name)}
                        </div>
                        <div style={styles.cleanerName}>{job.cleaner.name}</div>
                      </div>
                    ) : (
                      <div style={styles.unassignedText}>Unassigned</div>
                    )}
                  </div>

                  <div style={styles.visitActionsCol}>
                    <span style={styles.visitActionIcon}>◔</span>
                    <span style={styles.visitActionIcon}>✎</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.billingHeader}>
                <div style={styles.sectionTitle}>Billing</div>
                <button style={styles.editVisitsBtn}>Edit Invoice Settings</button>
              </div>

              <div style={styles.billingMeta}>
                <div>
                  <div style={styles.smallMuted}>Reminders</div>
                  <div style={styles.smallStrong}>When the job is marked closed</div>
                </div>
              </div>

              <div style={styles.billingTabs}>
                <div style={styles.activeTab}>Invoicing</div>
                <div style={styles.inactiveTab}>Reminders</div>
              </div>

              <div style={styles.invoiceTable}>
                <div style={styles.invoiceHead}>
                  <div>Invoice</div>
                  <div>Due date</div>
                  <div>Status</div>
                  <div>Subject</div>
                  <div>Total</div>
                  <div>Balance</div>
                </div>

                <div style={styles.invoiceRow}>
                  <div>
                    <button style={styles.createInvoiceBtn}>Create</button>
                  </div>
                  <div>—</div>
                  <div>
                    <span style={styles.upcomingBadge}>Upcoming</span>
                  </div>
                  <div>For Services Rendered</div>
                  <div>$0.00</div>
                  <div>$0.00</div>
                </div>
              </div>
            </div>

            <div style={styles.bottomDangerCard}>
              <div>
                <div style={styles.deleteTitle}>Delete Job</div>
                <div style={styles.deleteText}>
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

          <aside style={styles.sideColumn}>
            <div style={styles.notesCard}>
              <div style={styles.notesTitle}>Notes</div>

              <div style={styles.notesBox}>
                <div style={styles.notesIcon}>↩</div>
                <div style={styles.notesText}>
                  {summary.notes
                    ? summary.notes
                    : "Leave an internal note for yourself or a team member"}
                </div>
              </div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.sectionTitle}>Actions</div>
              <div style={styles.sectionText}>Manage assignment and status</div>

              <div style={styles.actionBlock}>
                <div style={styles.formLabel}>Assign Cleaner</div>
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
                  style={styles.assignBtn}
                  onClick={handleAssignCleaner}
                  disabled={assigning}
                >
                  {assigning ? "Assigning..." : "Assign Cleaner"}
                </button>
              </div>

              <div style={styles.softDivider} />

              <div style={styles.actionBlock}>
                <div style={styles.formLabel}>Update Status</div>

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
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={styles.metaRow}>
      <div style={styles.metaRowLabel}>{label}</div>
      <div style={styles.metaRowValue}>{value}</div>
    </div>
  );
}

function ProfitItem({ label, value }) {
  return (
    <div style={styles.profitItem}>
      <div style={styles.profitItemLabel}>{label}</div>
      <div style={styles.profitItemValue}>{value}</div>
    </div>
  );
}

function getInitial(name = "") {
  return name.trim()?.charAt(0)?.toUpperCase() || "C";
}

function getVisitStatusBadge(status) {
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

  return {
    ...styles.statusBadgeBase,
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  };
}

const styles = {
  page: {
    display: "grid",
    gap: 18,
    paddingBottom: 24,
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  userText: {
    fontSize: 14,
    color: "#475569",
  },

  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  searchPill: {
    height: 42,
    padding: "0 18px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    background: "#fff",
    color: "#64748b",
    fontWeight: 600,
  },

  mainLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: 18,
    alignItems: "start",
  },

  mainColumn: {
    display: "grid",
    gap: 18,
  },

  sideColumn: {
    display: "grid",
    gap: 18,
    position: "sticky",
    top: 16,
  },

  heroCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  heroTopLine: {
    height: 6,
    background: "#3f8f2c",
  },

  heroActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "22px 22px 0 22px",
    flexWrap: "wrap",
  },

  heroLeftActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  heroRightActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  toolIcon: {
    fontSize: 18,
  },

  overdueBadge: {
    display: "inline-flex",
    alignItems: "center",
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: 800,
  },

  assignedHeroBadge: {
    display: "inline-flex",
    alignItems: "center",
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 800,
  },

  completedHeroBadge: {
    display: "inline-flex",
    alignItems: "center",
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#15803d",
    fontSize: 13,
    fontWeight: 800,
  },

  moreBtn: {
    height: 42,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#2f7d1f",
    fontWeight: 800,
    cursor: "pointer",
  },

  visitBtn: {
    height: 42,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "#3f8f2c",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  heroTitle: {
    margin: 0,
    padding: "18px 22px 0 22px",
    fontSize: 36,
    lineHeight: 1.08,
    fontWeight: 850,
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  heroContentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    padding: 22,
    alignItems: "start",
  },

  customerMiniCard: {
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 18,
    display: "grid",
    gap: 12,
  },

  customerMiniHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 12,
  },

  customerMiniName: {
    fontSize: 17,
    fontWeight: 800,
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  greenDot: {
    width: 8,
    height: 8,
    borderRadius: "999px",
    background: "#3f8f2c",
    display: "inline-block",
  },

  miniMenu: {
    color: "#334155",
    fontWeight: 800,
    fontSize: 16,
  },

  miniLabel: {
    fontSize: 13,
    color: "#64748b",
  },

  miniText: {
    fontSize: 15,
    color: "#0f172a",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },

  heroMetaTable: {
    display: "grid",
    gap: 0,
  },

  metaRow: {
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    gap: 16,
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },

  metaRowLabel: {
    fontSize: 14,
    color: "#64748b",
  },

  metaRowValue: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: 600,
  },

  sectionCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 850,
    color: "#0f172a",
    marginBottom: 8,
  },

  sectionText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.55,
  },

  sectionInnerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  linkBtn: {
    border: "none",
    background: "transparent",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },

  profitRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },

  profitValue: {
    fontSize: 40,
    fontWeight: 850,
    color: "#0f172a",
    lineHeight: 1,
  },

  profitLabel: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
  },

  profitStats: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(100px, 1fr))",
    gap: 18,
    alignItems: "end",
  },

  profitItem: {
    minWidth: 0,
  },

  profitItemLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
  },

  profitItemValue: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
  },

  actionRow: {
    marginTop: 18,
    display: "flex",
    justifyContent: "flex-start",
  },

  greenOutlineBtn: {
    height: 42,
    padding: "0 16px",
    borderRadius: 12,
    border: "none",
    background: "#3f8f2c",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  emptyMutedRow: {
    marginTop: 10,
    fontSize: 14,
    color: "#94a3b8",
  },

  expenseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    flexWrap: "wrap",
  },

  linkGreenBtn: {
    border: "none",
    background: "transparent",
    color: "#2f7d1f",
    fontWeight: 800,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },

  visitHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },

  visitTopMeta: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "160px 160px",
    gap: 18,
  },

  smallMuted: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },

  smallStrong: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
  },

  editVisitsBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#2f7d1f",
    fontWeight: 800,
    cursor: "pointer",
  },

  visitToolsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },

  filterChip: {
    display: "inline-flex",
    alignItems: "center",
    height: 40,
    padding: "0 14px",
    borderRadius: 999,
    background: "#f3f4f6",
    color: "#111827",
    fontWeight: 700,
    fontSize: 14,
  },

  smallPlusBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#2f7d1f",
    fontSize: 28,
    lineHeight: 1,
    cursor: "pointer",
  },

  visitTable: {
    border: "1px solid #dbe2ea",
    borderRadius: 14,
    overflow: "hidden",
    background: "#fff",
  },

  visitTableHead: {
    display: "grid",
    gridTemplateColumns: "1.2fr 2fr 1fr 1fr 80px",
    gap: 16,
    padding: "14px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 14,
    fontWeight: 800,
    color: "#163B4D",
  },

  visitTableRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 2fr 1fr 1fr 80px",
    gap: 16,
    padding: "18px 16px",
    alignItems: "center",
  },

  visitDateCell: {
    display: "grid",
    gap: 6,
  },

  visitDateMain: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
  },

  visitDateSub: {
    fontSize: 14,
    color: "#64748b",
  },

  visitTitleMain: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 6,
  },

  visitTitleSub: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.45,
    wordBreak: "break-word",
  },

  assignedCleanerWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  cleanerAvatar: {
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

  cleanerName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
  },

  unassignedText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: 600,
  },

  visitActionsCol: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 14,
    alignItems: "center",
  },

  visitActionIcon: {
    fontSize: 18,
    color: "#334155",
  },

  billingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },

  billingMeta: {
    marginBottom: 18,
  },

  billingTabs: {
    display: "flex",
    gap: 28,
    borderBottom: "1px solid #e5e7eb",
    marginBottom: 18,
  },

  activeTab: {
    paddingBottom: 12,
    borderBottom: "3px solid #3f8f2c",
    fontWeight: 800,
    color: "#0f172a",
  },

  inactiveTab: {
    paddingBottom: 12,
    color: "#64748b",
    fontWeight: 700,
  },

  invoiceTable: {
    overflow: "hidden",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
  },

  invoiceHead: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1.4fr 0.8fr 0.8fr",
    gap: 16,
    padding: "14px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 14,
    fontWeight: 800,
    color: "#163B4D",
  },

  invoiceRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1.4fr 0.8fr 0.8fr",
    gap: 16,
    padding: "16px",
    alignItems: "center",
    fontSize: 14,
    color: "#0f172a",
  },

  createInvoiceBtn: {
    height: 32,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  upcomingBadge: {
    display: "inline-flex",
    alignItems: "center",
    height: 28,
    padding: "0 12px",
    borderRadius: 999,
    background: "#f3f4f6",
    color: "#475569",
    fontSize: 12,
    fontWeight: 800,
  },

  notesCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  notesTitle: {
    fontSize: 18,
    fontWeight: 850,
    color: "#0f172a",
    marginBottom: 18,
  },

  notesBox: {
    minHeight: 220,
    border: "2px dashed #d1d5db",
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    textAlign: "center",
    padding: 20,
    color: "#64748b",
  },

  notesIcon: {
    width: 56,
    height: 56,
    borderRadius: "999px",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    color: "#334155",
  },

  notesText: {
    fontSize: 15,
    lineHeight: 1.6,
    maxWidth: 260,
  },

  actionBlock: {
    display: "grid",
    gap: 14,
  },

  formLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },

  input: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "0 14px",
    fontSize: 15,
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
  },

  assignBtn: {
    width: "100%",
    height: 46,
    border: "none",
    borderRadius: 14,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
  },

  softDivider: {
    height: 1,
    background: "#e5e7eb",
    margin: "18px 0",
  },

  grayBtn: {
    width: "100%",
    height: 46,
    border: "none",
    borderRadius: 14,
    background: "#6b7280",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
  },

  blueBtn: {
    width: "100%",
    height: 46,
    border: "none",
    borderRadius: 14,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
  },

  greenBtn: {
    width: "100%",
    height: 46,
    border: "none",
    borderRadius: 14,
    background: "#16a34a",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
  },

  bottomDangerCard: {
    background: "#fff5f5",
    border: "1px solid #fecaca",
    borderRadius: 18,
    padding: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },

  deleteTitle: {
    fontSize: 18,
    fontWeight: 850,
    color: "#b91c1c",
    marginBottom: 6,
  },

  deleteText: {
    fontSize: 14,
    color: "#b91c1c",
  },

  deleteBtn: {
    height: 46,
    padding: "0 18px",
    border: "none",
    borderRadius: 14,
    background: "#dc2626",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
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
};