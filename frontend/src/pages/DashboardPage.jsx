import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";
import {
  getDateKeyInTimeZone,
  formatDateForDisplay,
  formatPrettyDateInTimeZone,
  isSameMonthInTimeZone,
  compareJobsBySchedule,
  getTodayKeyInTimeZone,
  getHourInTimeZone,
  getWeekdayLabels,
} from "../utils/time";
import { useCompany } from "../context/CompanyContext";

const API = API_BASE_URL;

const DASHBOARD_JOBS_CACHE_TTL_MS = 30 * 1000;

const dashboardJobsCache = {
  token: null,
  data: null,
  loadedAt: 0,
  promise: null,
};

function isDashboardJobsCacheValid(token) {
  return (
    dashboardJobsCache.token === token &&
    Array.isArray(dashboardJobsCache.data) &&
    Date.now() - dashboardJobsCache.loadedAt < DASHBOARD_JOBS_CACHE_TTL_MS
  );
}

async function loadDashboardJobs(token) {
  if (!token) return [];

  if (isDashboardJobsCacheValid(token)) {
    return dashboardJobsCache.data;
  }

  if (dashboardJobsCache.promise && dashboardJobsCache.token === token) {
    return dashboardJobsCache.promise;
  }

  dashboardJobsCache.token = token;
  dashboardJobsCache.promise = axios
    .get(`${API}/jobs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const nextJobs = res?.data?.jobs || [];
      dashboardJobsCache.data = nextJobs;
      dashboardJobsCache.loadedAt = Date.now();
      return nextJobs;
    })
    .finally(() => {
      dashboardJobsCache.promise = null;
    });

  return dashboardJobsCache.promise;
}


export default function DashboardPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const { timezone: companyTimezone, firstDayOfWeek: companyFirstDayOfWeek } = useCompany();
  const quickCreateRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrateJobs() {
      if (!token) {
        setJobs([]);
        setLoading(false);
        return;
      }

      if (isDashboardJobsCacheValid(token)) {
        setJobs(dashboardJobsCache.data || []);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const nextJobs = await loadDashboardJobs(token);
        if (!cancelled) {
          setJobs(nextJobs);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch jobs:", error);
          setJobs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    hydrateJobs();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        quickCreateRef.current &&
        !quickCreateRef.current.contains(e.target)
      ) {
        setQuickCreateOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  }

  const today = useMemo(() => getTodayKeyInTimeZone(companyTimezone), [companyTimezone]);

  const weekStartLabel = useMemo(() => {
    return companyFirstDayOfWeek === "Monday" ? "Monday" : "Sunday";
  }, [companyFirstDayOfWeek]);

  const orderedWeekdays = useMemo(() => {
    return getWeekdayLabels(companyFirstDayOfWeek, "short").join(" · ");
  }, [companyFirstDayOfWeek]);

  const dashboardData = useMemo(() => {
    const todayList = jobs.filter(
      (job) => getDateKeyInTimeZone(job.serviceDate, companyTimezone) === today
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
      const jobDate = getDateKeyInTimeZone(job.serviceDate, companyTimezone);
      return (
        jobDate < today &&
        job.status !== "completed" &&
        job.status !== "cancelled"
      );
    });

    const upcomingList = jobs
      .filter((job) => {
        if (!job.serviceDate) return false;
        const jobDate = getDateKeyInTimeZone(job.serviceDate, companyTimezone);
        return jobDate >= today && job.status !== "completed";
      })
      .sort((a, b) => compareJobsBySchedule(a, b, companyTimezone))
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
        return isSameMonthInTimeZone(job.serviceDate, new Date(), companyTimezone) && job.status === "completed";
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
  }, [jobs, today, companyTimezone]);

  const greeting = getGreeting(companyTimezone);
  const userName = getStoredUserName();

  return (
    <AppLayout title="Dashboard">
      {loading ? (
        <div style={styles.loadingCard}>Loading dashboard...</div>
      ) : (
        <div style={styles.page}>
          <div style={styles.topActionsBar}>
            <div>
              <div style={styles.topActionsEyebrow}>Quick actions</div>
              <div style={styles.topActionsTitle}>
                Create new work faster from one place
              </div>
            </div>

            <div style={styles.quickCreateWrap} ref={quickCreateRef}>
              <button
                type="button"
                style={styles.quickCreateBtn}
                onClick={() => setQuickCreateOpen((prev) => !prev)}
              >
                + Quick Create
              </button>

              {quickCreateOpen && (
                <div style={styles.quickCreateMenu}>
                  <button
                    type="button"
                    style={styles.quickCreateItem}
                    onClick={() => navigate("/jobs/new")}
                  >
                    New Job
                  </button>

                  <button
                    type="button"
                    style={styles.quickCreateItem}
                    onClick={() => navigate("/customers/new")}
                  >
                    New Customer
                  </button>

                  <button
                    type="button"
                    style={styles.quickCreateItem}
                    onClick={() => navigate("/cleaners/new")}
                  >
                    New Cleaner
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={styles.hero}>
            <div style={styles.heroLeft}>
              <div style={styles.heroBadge}>Operations Overview</div>
              <div style={styles.heroDate}>{formatPrettyDateInTimeZone(new Date(), companyTimezone)}</div>
              <div style={styles.heroMeta}>
                {companyTimezone} · Week starts on {weekStartLabel} · {orderedWeekdays}
              </div>
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
                            {formatDateForDisplay(job.serviceDate, companyTimezone)}
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
                            {formatDateForDisplay(job.serviceDate, companyTimezone)}
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

function getGreeting(timeZone) {
  const hour = getHourInTimeZone(timeZone);
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
      background: "#f3e8ff",
      color: "#7c3aed",
      padding: "5px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      display: "inline-block",
      textTransform: "capitalize",
    };
  }

  if (status === "cancelled") {
    return {
      background: "#fee2e2",
      color: "#b91c1c",
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
    color: "#374151",
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
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },

  loadingCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px 22px",
    color: "#475569",
    fontWeight: 600,
  },

  topActionsBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px 20px",
  },

  topActionsEyebrow: {
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: "6px",
  },

  topActionsTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
  },

  quickCreateWrap: {
    position: "relative",
  },

  quickCreateBtn: {
    height: "44px",
    padding: "0 18px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.18)",
  },

  quickCreateMenu: {
    position: "absolute",
    top: "52px",
    right: 0,
    minWidth: "190px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
    padding: "8px",
    zIndex: 30,
  },

  quickCreateItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    textAlign: "left",
    padding: "11px 12px",
    borderRadius: "10px",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },

  hero: {
    display: "grid",
    gridTemplateColumns: "1.5fr 0.9fr",
    gap: "18px",
    background: "linear-gradient(135deg, #071a44 0%, #182b51 100%)",
    borderRadius: "30px",
    padding: "28px",
    color: "#ffffff",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
  },

  heroLeft: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "220px",
  },

  heroBadge: {
    display: "inline-flex",
    alignSelf: "flex-start",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "18px",
  },

  heroDate: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.88)",
    marginBottom: "10px",
  },

  heroTitle: {
    margin: 0,
    fontSize: "34px",
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: "14px",
    letterSpacing: "-0.02em",
  },

  heroText: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.8,
    maxWidth: "720px",
    color: "rgba(255,255,255,0.92)",
  },

  heroStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  heroMiniCard: {
    borderRadius: "22px",
    padding: "18px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(6px)",
  },

  heroMiniLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.75)",
    marginBottom: "10px",
    fontWeight: 700,
  },

  heroMiniValue: {
    fontSize: "28px",
    fontWeight: 800,
    marginBottom: "4px",
  },

  heroMiniSub: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.82)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
  },

  statTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  statIconBox: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 700,
    flexShrink: 0,
  },

  cardLabel: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "12px",
  },

  cardValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "10px",
    lineHeight: 1,
  },

  cardSubtext: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.45fr 0.85fr",
    gap: "18px",
    alignItems: "start",
  },

  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  sectionCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "20px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "14px",
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "6px",
  },

  sectionSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  primaryBtn: {
    height: "42px",
    padding: "0 16px",
    border: "none",
    borderRadius: "12px",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  secondaryBtn: {
    height: "42px",
    padding: "0 16px",
    border: "1px solid #dbe2ea",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  workflowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
  },

  workflowCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    position: "relative",
    overflow: "hidden",
  },

  workflowTopBar: {
    height: "4px",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  workflowTitle: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: 700,
    marginTop: "8px",
    marginBottom: "14px",
  },

  workflowValue: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "8px",
  },

  workflowSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },

  miniMetricCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
  },

  miniMetricLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: "8px",
  },

  miniMetricValue: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "6px",
  },

  miniMetricNote: {
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: 1.5,
  },

  emptyLarge: {
    padding: "20px",
    textAlign: "center",
    borderRadius: "16px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },

  appointmentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  appointmentCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    cursor: "pointer",
  },

  appointmentLeft: {
    minWidth: 0,
  },

  appointmentTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },

  appointmentTitle: {
    fontSize: "15px",
    color: "#0f172a",
  },

  appointmentMeta: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "6px",
    lineHeight: 1.5,
  },

  appointmentSub: {
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: 1.5,
  },

  appointmentRight: {
    textAlign: "right",
    flexShrink: 0,
  },

  appointmentId: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "8px",
    fontWeight: 700,
  },

  appointmentArrow: {
    fontSize: "20px",
    color: "#64748b",
  },

  empty: {
    padding: "16px",
    textAlign: "center",
    borderRadius: "14px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  jobCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px 16px",
    cursor: "pointer",
    background: "#ffffff",
  },

  jobMain: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },

  jobCustomer: {
    fontSize: "15px",
    color: "#0f172a",
  },

  jobMeta: {
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  jobRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px",
    flexShrink: 0,
  },

  sideCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "20px",
  },

  sideTitle: {
    margin: 0,
    marginBottom: "16px",
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
  },

  sideMetricCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    background: "#ffffff",
    marginBottom: "12px",
  },

  sideMetricLabel: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "10px",
    fontWeight: 700,
  },

  sideMetricValue: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "6px",
  },

  sideMetricSub: {
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: 1.5,
  },

  sideCardDark: {
    borderRadius: "24px",
    padding: "22px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#ffffff",
  },

  sideDarkLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.72)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "12px",
  },

  sideDarkValue: {
    fontSize: "36px",
    fontWeight: 800,
    marginBottom: "10px",
  },

  sideDarkText: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.7,
  },

  insightItem: {
    padding: "14px 0",
    borderTop: "1px solid #eef2f7",
  },

  insightHeading: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  insightText: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.7,
  },
};