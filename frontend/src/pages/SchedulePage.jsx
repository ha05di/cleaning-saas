import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function SchedulePage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [draggingJobId, setDraggingJobId] = useState(null);
  const [dropTargetKey, setDropTargetKey] = useState("");
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [jobsRes, cleanersRes] = await Promise.all([
        axios.get(`${API}/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/cleaners`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const allJobs = jobsRes.data.jobs || [];
      const allCleaners = cleanersRes.data.cleaners || [];

      const sortedJobs = [...allJobs].sort((a, b) => {
        const dateA = new Date(a.serviceDate);
        const dateB = new Date(b.serviceDate);
        return dateA - dateB;
      });

      setJobs(sortedJobs);
      setCleaners(allCleaners);
    } catch (error) {
      console.error("Failed to fetch schedule data:", error);
      alert(error?.response?.data?.error || "Failed to fetch schedule");
    } finally {
      setLoading(false);
    }
  }

  async function handleDropOnCleaner(targetCleaner, droppedJobId) {
    if (!droppedJobId || !targetCleaner?.id) return;

    const currentJob = jobs.find((j) => String(j.id) === String(droppedJobId));
    if (!currentJob) return;

    if (String(currentJob.cleanerId || "") === String(targetCleaner.id)) {
      setDraggingJobId(null);
      setDropTargetKey("");
      return;
    }

    try {
      setReassigning(true);

      await axios.put(
        `${API}/jobs/${droppedJobId}/reassign`,
        { cleanerId: Number(targetCleaner.id) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchData();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to reassign job");
    } finally {
      setReassigning(false);
      setDraggingJobId(null);
      setDropTargetKey("");
    }
  }

  const availableDates = useMemo(() => {
    const dates = [...new Set(jobs.map((job) => formatDate(job.serviceDate)).filter(Boolean))];
    return dates.sort();
  }, [jobs]);

  const effectiveDates = useMemo(() => {
    if (dateFilter) return [dateFilter];
    return availableDates;
  }, [dateFilter, availableDates]);

  const groupedData = useMemo(() => {
    const grouped = {};

    effectiveDates.forEach((date) => {
      grouped[date] = {};

      cleaners.forEach((cleaner) => {
        const teamKey = cleaner.team || "No Team";
        const cleanerKey = cleaner.name || "Unnamed Cleaner";

        if (!grouped[date][teamKey]) {
          grouped[date][teamKey] = {};
        }

        if (!grouped[date][teamKey][cleanerKey]) {
          grouped[date][teamKey][cleanerKey] = {
            cleaner,
            jobs: [],
          };
        }
      });

      jobs.forEach((job) => {
        const jobDate = formatDate(job.serviceDate);
        if (jobDate !== date) return;

        const teamKey = job.cleaner?.team || "No Team";
        const cleanerKey = job.cleaner?.name || "Unassigned";

        if (!grouped[date][teamKey]) {
          grouped[date][teamKey] = {};
        }

        if (!grouped[date][teamKey][cleanerKey]) {
          grouped[date][teamKey][cleanerKey] = {
            cleaner: job.cleaner || null,
            jobs: [],
          };
        }

        grouped[date][teamKey][cleanerKey].jobs.push(job);
      });

      Object.keys(grouped[date]).forEach((team) => {
        Object.keys(grouped[date][team]).forEach((cleanerName) => {
          grouped[date][team][cleanerName].jobs.sort((a, b) => {
            const timeA = a.serviceTime || "";
            const timeB = b.serviceTime || "";
            return timeA.localeCompare(timeB);
          });
        });
      });
    });

    return grouped;
  }, [jobs, cleaners, effectiveDates]);

  const groupedEntries = Object.entries(groupedData);

  return (
    <AppLayout title="Schedule">
      <div style={styles.page}>
        <div style={styles.filterCard}>
          <input
            type="date"
            style={styles.input}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={() => setDateFilter("")}
          >
            Clear Date Filter
          </button>

          {reassigning && (
            <div style={styles.reassigningText}>Reassigning job...</div>
          )}
        </div>

        {loading ? (
          <div style={styles.loadingCard}>Loading schedule...</div>
        ) : groupedEntries.length === 0 ? (
          <div style={styles.emptyCard}>No scheduled jobs found</div>
        ) : (
          <div style={styles.dateList}>
            {groupedEntries.map(([date, teams]) => {
              const totalJobsForDate = Object.values(teams).reduce(
                (sum, cleanersObj) =>
                  sum +
                  Object.values(cleanersObj).reduce(
                    (cleanerSum, cleanerData) => cleanerSum + cleanerData.jobs.length,
                    0
                  ),
                0
              );

              return (
                <div key={date} style={styles.dateCard}>
                  <div style={styles.dateHeader}>
                    <h2 style={styles.dateTitle}>{date}</h2>
                    <span style={styles.dateCount}>
                      {totalJobsForDate} job{totalJobsForDate === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div style={styles.teamList}>
                    {Object.entries(teams).map(([team, cleanersObj]) => {
                      const totalTeamJobs = Object.values(cleanersObj).reduce(
                        (sum, cleanerData) => sum + cleanerData.jobs.length,
                        0
                      );

                      return (
                        <div key={team} style={styles.teamCard}>
                          <div style={styles.teamHeader}>
                            <h3 style={styles.teamTitle}>{team}</h3>
                            <span style={styles.teamCount}>
                              {totalTeamJobs} job{totalTeamJobs === 1 ? "" : "s"}
                            </span>
                          </div>

                          <div style={styles.cleanerList}>
                            {Object.entries(cleanersObj).map(([cleanerName, cleanerData]) => {
                              const cleanerJobs = cleanerData.jobs;
                              const isIdle = cleanerJobs.length === 0;
                              const cleanerStatus =
                                cleanerData.cleaner?.status || "active";
                              const cleanerId = cleanerData.cleaner?.id;
                              const laneKey = `${date}-${team}-${cleanerName}-${cleanerId || "none"}`;
                              const isDropTarget = dropTargetKey === laneKey;

                              return (
                                <div
                                  key={cleanerName}
                                  style={{
                                    ...styles.cleanerCard,
                                    ...(isDropTarget ? styles.cleanerCardActive : {}),
                                  }}
                                  onDragOver={(e) => {
                                    if (!cleanerId) return;
                                    e.preventDefault();
                                    setDropTargetKey(laneKey);
                                  }}
                                  onDragLeave={() => {
                                    if (dropTargetKey === laneKey) {
                                      setDropTargetKey("");
                                    }
                                  }}
                                  onDrop={(e) => {
                                    if (!cleanerId) return;
                                    e.preventDefault();
                                    const droppedJobId = e.dataTransfer.getData("text/plain");
                                    handleDropOnCleaner(cleanerData.cleaner, droppedJobId);
                                  }}
                                >
                                  <div style={styles.cleanerHeader}>
                                    <div style={styles.cleanerHeaderLeft}>
                                      <h4 style={styles.cleanerName}>{cleanerName}</h4>

                                      {isIdle ? (
                                        <span style={styles.idleBadge}>idle</span>
                                      ) : (
                                        <span style={styles.busyBadge}>
                                          {cleanerJobs.length} job
                                          {cleanerJobs.length === 1 ? "" : "s"}
                                        </span>
                                      )}

                                      {cleanerStatus === "inactive" && (
                                        <span style={styles.inactiveBadge}>inactive</span>
                                      )}
                                    </div>
                                  </div>

                                  {isIdle ? (
                                    <div style={styles.idleCard}>
                                      Drop a job here to assign
                                    </div>
                                  ) : (
                                    <div style={styles.jobsList}>
                                      {cleanerJobs.map((job) => (
                                        <div
                                          key={job.id}
                                          style={{
                                            ...styles.jobCard,
                                            ...(draggingJobId === job.id ? styles.jobCardDragging : {}),
                                          }}
                                          draggable
                                          onDragStart={(e) => {
                                            setDraggingJobId(job.id);
                                            e.dataTransfer.setData("text/plain", String(job.id));
                                          }}
                                          onDragEnd={() => {
                                            setDraggingJobId(null);
                                            setDropTargetKey("");
                                          }}
                                          onClick={() => navigate(`/jobs/${job.id}`)}
                                        >
                                          <div style={styles.jobMain}>
                                            <div style={styles.jobTitle}>
                                              {job.customer?.name || "Unknown Customer"}
                                            </div>
                                            <div style={styles.jobMeta}>
                                              {job.serviceTime || "-"} ·{" "}
                                              {job.serviceType || "No service type"}
                                            </div>
                                          </div>

                                          <div style={styles.jobRight}>
                                            <span style={getStatusBadge(job.status)}>
                                              {job.status}
                                            </span>
                                            <span style={styles.jobId}>Job #{job.id}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
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
  page: {
    display: "grid",
    gap: "20px",
  },
  filterCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
  },
  secondaryBtn: {
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  reassigningText: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: "14px",
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
  dateList: {
    display: "grid",
    gap: "20px",
  },
  dateCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  dateHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "10px",
  },
  dateTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
  },
  dateCount: {
    fontSize: "14px",
    color: "#6b7280",
  },
  teamList: {
    display: "grid",
    gap: "16px",
  },
  teamCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "14px",
  },
  teamHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    flexWrap: "wrap",
    gap: "8px",
  },
  teamTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
  },
  teamCount: {
    fontSize: "13px",
    color: "#6b7280",
  },
  cleanerList: {
    display: "grid",
    gap: "12px",
  },
  cleanerCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    transition: "all 0.2s ease",
  },
  cleanerCardActive: {
    border: "2px dashed #2563eb",
    background: "#eff6ff",
  },
  cleanerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    flexWrap: "wrap",
    gap: "8px",
  },
  cleanerHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  cleanerName: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "700",
  },
  idleBadge: {
    background: "#f3f4f6",
    color: "#6b7280",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },
  busyBadge: {
    background: "#dbeafe",
    color: "#2563eb",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },
  inactiveBadge: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },
  idleCard: {
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    borderRadius: "10px",
    padding: "12px",
    color: "#6b7280",
    fontSize: "14px",
  },
  jobsList: {
    display: "grid",
    gap: "10px",
  },
  jobCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    cursor: "grab",
  },
  jobCardDragging: {
    opacity: 0.55,
  },
  jobMain: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  jobTitle: {
    fontWeight: "700",
    fontSize: "15px",
  },
  jobMeta: {
    fontSize: "13px",
    color: "#6b7280",
  },
  jobRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "6px",
  },
  jobId: {
    fontSize: "12px",
    color: "#6b7280",
  },
};