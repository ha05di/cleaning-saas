import { useEffect, useMemo, useState } from "react";
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

  const dashboardData = useMemo(() => {
    const todayList = jobs.filter(
      (job) => job.serviceDate && job.serviceDate.split("T")[0] === today
    );

    const pendingList = jobs.filter((job) => job.status === "pending");
    const assignedList = jobs.filter((job) => job.status === "assigned");
    const completedList = jobs.filter((job) => job.status === "completed");

    const inProgressList = jobs.filter(
      (job) =>
        job.status === "in_progress" ||
        job.status === "ongoing" ||
        job.status === "active"
    );

    const overdueList = jobs.filter((job) => {
      if (!job.serviceDate) return false;
      const jobDate = job.serviceDate.split("T")[0];
      return (
        jobDate < today &&
        job.status !== "completed" &&
        job.status !== "cancelled"
      );
    });

    const upcomingList = jobs
      .filter((job) => {
        if (!job.serviceDate) return false;
        const jobDate = job.serviceDate.split("T")[0];
        return jobDate >= today && job.status !== "completed";
      })
      .sort((a, b) => {
        const aDate = new Date(`${a.serviceDate || ""} ${a.serviceTime || ""}`);
        const bDate = new Date(`${b.serviceDate || ""} ${b.serviceTime || ""}`);
        return aDate - bDate;
      })
      .slice(0, 5);

    const recentJobs = [...jobs]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6);

    const todayRevenue = todayList
      .filter((job) => job.status === "completed")
      .reduce((sum, job) => sum + Number(job.price || job.total || 0), 0);

    const monthRevenue = jobs
      .filter((job) => {
        if (!job.serviceDate) return false;
        const d = new Date(job.serviceDate);
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          job.status === "completed"
        );
      })
      .reduce((sum, job) => sum + Number(job.price || job.total || 0), 0);

    return {
      todayJobs: todayList.length,
      pendingJobs: pendingList.length,
      assignedJobs: assignedList.length,
      completedJobs: completedList.length,
      inProgressJobs: inProgressList.length,
      overdueJobs: overdueList.length,
      todayRevenue,
      monthRevenue,
      upcomingList,
      recentJobs,
    };
  }, [jobs, today]);

  const greeting = getGreeting();
  const userName = getStoredUserName();

  return (
    <AppLayout title="Dashboard">
      {loading ? (
        <div style={styles.loadingCard}>Loading dashboard...</div>
      ) : (
        <div style={styles.page}>
          <div style={styles.hero}>
            <div style={styles.heroLeft}>
              <div style={styles.heroBadge}>Operations Overview</div>
              <div style={styles.heroDate}>{formatPrettyDate(new Date())}</div>
              <h1 style={styles.heroTitle}>
                {greeting}
                {userName ? `, ${userName}` : ""}
              </h1>
              <p style={styles.heroText}>
                Here’s what’s happening in your business today — jobs, team
                workload, urgent items, and recent activity in one clean view.
              </p>
            </div>

            <div style={styles.heroStats}>
              <div style={styles.heroMiniCard}>
                <div style={styles.heroMiniLabel}>Today</div>
                <div style={styles.heroMiniValue}>{dashboardData.todayJobs}</div>
                <div style={styles.heroMiniSub}>scheduled jobs</div>
              </div>

              <div style={styles.heroMiniCard}>
                <div style={styles.heroMiniLabel}>Active</div>
                <div style={styles.heroMiniValue}>
                  {dashboardData.inProgressJobs}
                </div>
                <div style={styles.heroMiniSub}>in progress</div>
              </div>

              <div style={styles.heroMiniCard}>
                <div style={styles.heroMiniLabel}>Done</div>
                <div style={styles.heroMiniValue}>
                  {dashboardData.completedJobs}
                </div>
                <div style={styles.heroMiniSub}>completed jobs</div>
              </div>

              <div style={styles.heroMiniCard}>
                <div style={styles.heroMiniLabel}>Revenue</div>
                <div style={styles.heroMiniValue}>
                  ${dashboardData.monthRevenue}
                </div>
                <div style={styles.heroMiniSub}>this month</div>
              </div>
            </div>
          </div>

          <div style={styles.statsGrid}>
            <StatCard
              label="Today Jobs"
              value={dashboardData.todayJobs}
              subtext="All jobs scheduled for today"
              accent="#2563eb"
              bg="#eff6ff"
            />
            <StatCard
              label="Pending Jobs"
              value={dashboardData.pendingJobs}
              subtext="Waiting for review or assignment"
              accent="#d97706"
              bg="#fff7ed"
            />
            <StatCard
              label="Assigned Jobs"
              value={dashboardData.assignedJobs}
              subtext="Already assigned to cleaners"
              accent="#7c3aed"
              bg="#f5f3ff"
            />
            <StatCard
              label="Completed Jobs"
              value={dashboardData.completedJobs}
              subtext="Successfully completed jobs"
              accent="#16a34a"
              bg="#f0fdf4"
            />
          </div>

          <div style={styles.mainGrid}>
            <div style={styles.leftCol}>
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>Workflow</h2>
                    <div style={styles.sectionSubtitle}>
                      A quick overview of today’s operational pipeline
                    </div>
                  </div>

                  <button
                    type="button"
                    style={styles.primaryBtn}
                    onClick={() => navigate("/jobs")}
                  >
                    View Jobs
                  </button>
                </div>

                <div style={styles.workflowGrid}>
                  <WorkflowCard
                    title="Requests"
                    value={dashboardData.pendingJobs}
                    subtitle="New jobs awaiting action"
                    topColor="#d97706"
                  />
                  <WorkflowCard
                    title="Assigned"
                    value={dashboardData.assignedJobs}
                    subtitle="Ready for your team"
                    topColor="#2563eb"
                  />
                  <WorkflowCard
                    title="Active"
                    value={dashboardData.inProgressJobs}
                    subtitle="Currently in progress"
                    topColor="#7c3aed"
                  />
                  <WorkflowCard
                    title="Completed"
                    value={dashboardData.completedJobs}
                    subtitle="Done and closed"
                    topColor="#16a34a"
                  />
                </div>
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>Today's Appointments</h2>
                    <div style={styles.sectionSubtitle}>
                      A clearer overview of today’s workload
                    </div>
                  </div>

                  <button
                    type="button"
                    style={styles.secondaryBtn}
                    onClick={() => navigate("/schedule")}
                  >
                    View Schedule
                  </button>
                </div>

                <div style={styles.metricsRow}>
                  <MiniMetric
                    label="Total"
                    value={dashboardData.todayJobs}
                    note="jobs today"
                  />
                  <MiniMetric
                    label="Pending"
                    value={dashboardData.pendingJobs}
                    note="need attention"
                  />
                  <MiniMetric
                    label="Assigned"
                    value={dashboardData.assignedJobs}
                    note="ready to go"
                  />
                  <MiniMetric
                    label="Overdue"
                    value={dashboardData.overdueJobs}
                    note="past service date"
                  />
                  <MiniMetric
                    label="Revenue"
                    value={`$${dashboardData.todayRevenue}`}
                    note="completed today"
                  />
                </div>

                {dashboardData.upcomingList.length === 0 ? (
                  <div style={styles.emptyLarge}>No scheduled appointments yet</div>
                ) : (
                  <div style={styles.appointmentList}>
                    {dashboardData.upcomingList.map((job) => (
                      <div
                        key={job.id}
                        style={styles.appointmentCard}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <div style={styles.appointmentLeft}>
                          <div style={styles.appointmentTitleRow}>
                            <strong style={styles.appointmentTitle}>
                              {job.customer?.name || "Unknown Customer"}
                            </strong>
                            <span style={getStatusBadge(job.status)}>
                              {job.status || "unknown"}
                            </span>
                          </div>

                          <div style={styles.appointmentMeta}>
                            {formatDate(job.serviceDate)}
                            {job.serviceTime ? ` · ${job.serviceTime}` : ""}
                            {job.serviceType ? ` · ${job.serviceType}` : ""}
                          </div>

                          <div style={styles.appointmentSub}>
                            Cleaner: {job.cleaner?.name || "Unassigned"}
                          </div>
                        </div>

                        <div style={styles.appointmentRight}>
                          <div style={styles.appointmentId}>Job #{job.id}</div>
                          <div style={styles.appointmentArrow}>→</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>Recent Jobs</h2>
                    <div style={styles.sectionSubtitle}>
                      Latest jobs created in your workspace
                    </div>
                  </div>
                </div>

                {dashboardData.recentJobs.length === 0 ? (
                  <div style={styles.empty}>No jobs yet</div>
                ) : (
                  <div style={styles.list}>
                    {dashboardData.recentJobs.map((job) => (
                      <div
                        key={job.id}
                        style={styles.jobCard}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <div style={styles.jobMain}>
                          <strong style={styles.jobCustomer}>
                            {job.customer?.name || "Unknown"}
                          </strong>
                          <span style={styles.jobMeta}>
                            {formatDate(job.serviceDate)}
                            {job.serviceTime ? ` · ${job.serviceTime}` : ""}
                            {job.serviceType ? ` · ${job.serviceType}` : ""}
                          </span>
                        </div>

                        <div style={styles.jobRight}>
                          <span style={getStatusBadge(job.status)}>
                            {job.status}
                          </span>
                          <span style={styles.jobMeta}>
                            {job.cleaner?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.rightCol}>
              <div style={styles.sideCard}>
                <h3 style={styles.sideTitle}>Business Performance</h3>

                <div style={styles.sideMetricCard}>
                  <div>
                    <div style={styles.sideMetricLabel}>Receivables</div>
                    <div style={styles.sideMetricValue}>$0</div>
                    <div style={styles.sideMetricSub}>0 unpaid jobs tracked</div>
                  </div>
                </div>

                <div style={styles.sideMetricCard}>
                  <div>
                    <div style={styles.sideMetricLabel}>Upcoming Jobs</div>
                    <div style={styles.sideMetricValue}>
                      {dashboardData.upcomingList.length}
                    </div>
                    <div style={styles.sideMetricSub}>next scheduled items</div>
                  </div>
                </div>

                <div style={styles.sideMetricCard}>
                  <div>
                    <div style={styles.sideMetricLabel}>Revenue</div>
                    <div style={styles.sideMetricValue}>
                      ${dashboardData.monthRevenue}
                    </div>
                    <div style={styles.sideMetricSub}>this month so far</div>
                  </div>
                </div>
              </div>

              <div style={styles.sideCardDark}>
                <div style={styles.sideDarkLabel}>Team Utilization</div>
                <div style={styles.sideDarkValue}>
                  {dashboardData.todayJobs === 0
                    ? "0%"
                    : `${Math.min(
                        100,
                        Math.round(
                          ((dashboardData.assignedJobs +
                            dashboardData.inProgressJobs +
                            dashboardData.completedJobs) /
                            Math.max(dashboardData.todayJobs, 1)) *
                            100
                        )
                      )}%`}
                </div>
                <div style={styles.sideDarkText}>
                  A quick estimate of how much of today’s schedule is already
                  being handled.
                </div>
              </div>

              <div style={styles.sideCard}>
                <h3 style={styles.sideTitle}>Quick Insights</h3>

                <div style={styles.insightItem}>
                  <div style={styles.insightHeading}>Priority</div>
                  <div style={styles.insightText}>
                    {dashboardData.pendingJobs > 0
                      ? `${dashboardData.pendingJobs} pending job(s) still need action.`
                      : "No pending jobs right now."}
                  </div>
                </div>

                <div style={styles.insightItem}>
                  <div style={styles.insightHeading}>Overdue Watch</div>
                  <div style={styles.insightText}>
                    {dashboardData.overdueJobs > 0
                      ? `${dashboardData.overdueJobs} overdue job(s) may need follow-up.`
                      : "No overdue jobs found."}
                  </div>
                </div>

                <div style={styles.insightItem}>
                  <div style={styles.insightHeading}>Today Snapshot</div>
                  <div style={styles.insightText}>
                    You have {dashboardData.todayJobs} job(s) scheduled today and{" "}
                    {dashboardData.inProgressJobs} currently active.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StatCard({ label, value, subtext, accent, bg }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTop}>
        <div>
          <div style={styles.cardLabel}>{label}</div>
          <div style={styles.cardValue}>{value}</div>
          <div style={styles.cardSubtext}>{subtext}</div>
        </div>

        <div
          style={{
            ...styles.statIconBox,
            background: bg || "#f3f4f6",
            color: accent || "#111827",
          }}
        >
          ●
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({ title, value, subtitle, topColor }) {
  return (
    <div style={styles.workflowCard}>
      <div
        style={{
          ...styles.workflowTopBar,
          background: topColor || "#111827",
        }}
      />
      <div style={styles.workflowTitle}>{title}</div>
      <div style={styles.workflowValue}>{value}</div>
      <div style={styles.workflowSubtitle}>{subtitle}</div>
    </div>
  );
}

function MiniMetric({ label, value, note }) {
  return (
    <div style={styles.miniMetricCard}>
      <div style={styles.miniMetricLabel}>{label}</div>
      <div style={styles.miniMetricValue}>{value}</div>
      <div style={styles.miniMetricNote}>{note}</div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "";
  return dateString.split("T")[0];
}

function formatPrettyDate(date) {
  try {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getStoredUserName() {
  try {
    const raw =
      localStorage.getItem("userName") ||
      localStorage.getItem("name") ||
      localStorage.getItem("user");
    if (!raw) return "";
    return raw;
  } catch {
    return "";
  }
}

function getStatusBadge(status) {
  if (status === "completed") {
    return {
      background: "#dcfce7",
      color: "#15803d",
      padding: "5px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      display: "inline-block",
      textTransform: "capitalize",
    };
  }

  if (status === "assigned") {
    return {
      background: "#dbeafe",
      color: "#2563eb",
      padding: "5px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      display: "inline-block",
      textTransform: "capitalize",
    };
  }

  if (
    status === "in_progress" ||
    status === "ongoing" ||
    status === "active"
  ) {
    return {
      background: "#ede9fe",
      color: "#7c3aed",
      padding: "5px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      display: "inline-block",
      textTransform: "capitalize",
    };
  }

  if (status === "pending") {
    return {
      background: "#fef3c7",
      color: "#b45309",
      padding: "5px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      display: "inline-block",
      textTransform: "capitalize",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#6b7280",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-block",
    textTransform: "capitalize",
  };
}

const styles = {
  page: {
    display: "grid",
    gap: "20px",
  },

  loadingCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  },

  hero: {
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #111827 100%)",
    borderRadius: "28px",
    padding: "28px",
    color: "#fff",
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "20px",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
  },

  heroLeft: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.04em",
  },

  heroDate: {
    marginTop: "16px",
    fontSize: "14px",
    color: "rgba(255,255,255,0.76)",
  },

  heroTitle: {
    margin: "8px 0 0",
    fontSize: "40px",
    lineHeight: 1.1,
    fontWeight: "800",
    letterSpacing: "-0.03em",
  },

  heroText: {
    marginTop: "14px",
    fontSize: "15px",
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.8)",
    maxWidth: "720px",
  },

  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    alignContent: "center",
  },

  heroMiniCard: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px",
    padding: "18px",
    backdropFilter: "blur(6px)",
  },

  heroMiniLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "rgba(255,255,255,0.64)",
  },

  heroMiniValue: {
    marginTop: "10px",
    fontSize: "30px",
    fontWeight: "800",
    letterSpacing: "-0.03em",
  },

  heroMiniSub: {
    marginTop: "4px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.72)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  statCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "22px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },

  statIconBox: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "14px",
  },

  cardLabel: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "10px",
    fontWeight: "600",
  },

  cardValue: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.04em",
  },

  cardSubtext: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#64748b",
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.7fr) minmax(320px, 0.9fr)",
    gap: "20px",
    alignItems: "start",
  },

  leftCol: {
    display: "grid",
    gap: "20px",
  },

  rightCol: {
    display: "grid",
    gap: "20px",
  },

  sectionCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  sectionSubtitle: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#64748b",
  },

  primaryBtn: {
    padding: "11px 16px",
    borderRadius: "14px",
    border: "none",
    background: "#0f172a",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  secondaryBtn: {
    padding: "11px 16px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#0f172a",
    fontWeight: "700",
    cursor: "pointer",
  },

  workflowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },

  workflowCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    position: "relative",
    overflow: "hidden",
  },

  workflowTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
  },

  workflowTitle: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600",
    marginTop: "6px",
  },

  workflowValue: {
    fontSize: "38px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.04em",
    marginTop: "10px",
  },

  workflowSubtitle: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },

  miniMetricCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
  },

  miniMetricLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "600",
  },

  miniMetricValue: {
    marginTop: "8px",
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  miniMetricNote: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#94a3b8",
  },

  appointmentList: {
    display: "grid",
    gap: "12px",
  },

  appointmentCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  appointmentLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },

  appointmentTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  appointmentTitle: {
    fontSize: "16px",
    color: "#0f172a",
  },

  appointmentMeta: {
    fontSize: "13px",
    color: "#64748b",
  },

  appointmentSub: {
    fontSize: "13px",
    color: "#94a3b8",
  },

  appointmentRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px",
    flexShrink: 0,
  },

  appointmentId: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "700",
  },

  appointmentArrow: {
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0f172a",
    fontWeight: "800",
  },

  sideCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "14px",
  },

  sideCardDark: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "22px",
    padding: "22px",
    color: "#fff",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
  },

  sideTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  sideMetricCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    background: "#fff",
  },

  sideMetricLabel: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600",
  },

  sideMetricValue: {
    marginTop: "10px",
    fontSize: "30px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  sideMetricSub: {
    marginTop: "5px",
    fontSize: "12px",
    color: "#94a3b8",
  },

  sideDarkLabel: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.72)",
    fontWeight: "600",
  },

  sideDarkValue: {
    marginTop: "8px",
    fontSize: "42px",
    fontWeight: "800",
    letterSpacing: "-0.04em",
  },

  sideDarkText: {
    marginTop: "10px",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.78)",
  },

  insightItem: {
    padding: "14px 0",
    borderBottom: "1px solid #eef2f7",
  },

  insightHeading: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "6px",
  },

  insightText: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  list: {
    display: "grid",
    gap: "12px",
  },

  jobCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    gap: "12px",
  },

  jobMain: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },

  jobCustomer: {
    fontSize: "16px",
    color: "#0f172a",
  },

  jobRight: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    textAlign: "right",
    alignItems: "flex-end",
    flexShrink: 0,
  },

  jobMeta: {
    fontSize: "13px",
    color: "#64748b",
  },

  empty: {
    background: "#fff",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    color: "#6b7280",
  },

  emptyLarge: {
    background: "#f8fafc",
    padding: "24px",
    borderRadius: "18px",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    fontSize: "14px",
  },
};