import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

const START_HOUR = 0;
const END_HOUR = 23;
const HOUR_ROW_HEIGHT = 72;

export default function SchedulePage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCleanerId, setSelectedCleanerId] = useState("All");

  const [draggingJobId, setDraggingJobId] = useState(null);
  const [dropTargetDay, setDropTargetDay] = useState("");
  const [reassigning, setReassigning] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [jobPopover, setJobPopover] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

      setJobs(jobsRes.data.jobs || []);
      setCleaners(cleanersRes.data.cleaners || []);
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

      const updatedJob = {
        ...currentJob,
        cleanerId: targetCleaner.id,
        cleaner: targetCleaner,
      };

      setSelectedJob((prev) =>
        prev && String(prev.id) === String(droppedJobId) ? updatedJob : prev
      );

      setJobPopover((prev) =>
        prev && String(prev.job?.id) === String(droppedJobId)
          ? { ...prev, job: updatedJob }
          : prev
      );
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to reassign job");
    } finally {
      setReassigning(false);
      setDraggingJobId(null);
      setDropTargetDay("");
    }
  }

  async function handleSaveEdit() {
    if (!editingJob) return;

    try {
      setSavingEdit(true);

      const payload = {
        serviceDate: editingJob.startDate || editingJob.serviceDate || null,
        endDate: editingJob.endDate || editingJob.startDate || null,
        serviceTime: editingJob.anytime ? null : editingJob.startTime || null,
        endTime: editingJob.anytime ? null : editingJob.endTime || null,
        cleanerId: editingJob.cleanerId ? Number(editingJob.cleanerId) : null,
        title: editingJob.title || editingJob.serviceType || "",
        instructions: editingJob.instructions || "",
        anytime: !!editingJob.anytime,
      };

      try {
        await axios.put(`${API}/jobs/${editingJob.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        await axios.patch(`${API}/jobs/${editingJob.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchData();
      setEditingJob(null);
    } catch (error) {
      console.error("Failed to save edited job:", error);
      alert(error?.response?.data?.error || "Failed to save job changes");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleCompleted(job, checked) {
    if (!job?.id) return;

    try {
      setUpdatingStatus(true);

      const nextStatus = checked ? "completed" : "assigned";

      const res = await axios.put(
        `${API}/jobs/${job.id}/status`,
        { status: nextStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedJob = res?.data?.job
        ? res.data.job
        : {
            ...job,
            status: nextStatus,
          };

      await fetchData();

      setSelectedJob(updatedJob);

      setJobPopover((prev) =>
        prev
          ? {
              ...prev,
              job: updatedJob,
            }
          : null
      );
    } catch (error) {
      console.error("Failed to update job status:", error);
      alert(error?.response?.data?.error || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  function openEditModal(job) {
    setEditingJob({
      ...job,
      title: job.title || job.serviceType || `${job.customer?.name || "Visit"}`,
      instructions: job.instructions || "",
      startDate: formatDate(job.serviceDate) || "",
      endDate: formatDate(job.endDate || job.serviceDate) || "",
      startTime: normalizeTimeInput(job.serviceTime),
      endTime: normalizeTimeInput(
        job.endTime || estimateEndTime(job.serviceTime, job.durationMinutes)
      ),
      anytime: !job.serviceTime || !!job.anytime,
      cleanerId: String(job.cleaner?.id || job.cleanerId || ""),
    });
  }

  function openJobPopover(e, job) {
    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 380;
    const gap = 12;

    let left = rect.right + gap + window.scrollX;
    let top = rect.top + window.scrollY - 8;

    if (left + popoverWidth > window.innerWidth - 20) {
      left = rect.left + window.scrollX - popoverWidth - gap;
    }

    if (top < 20) top = 20;

    setSelectedJob(job);
    setJobPopover({
      job,
      top,
      left,
    });
  }

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const teamOptions = useMemo(() => {
    const set = new Set();
    cleaners.forEach((c) => set.add(c.team || "No Team"));
    return ["All", ...Array.from(set)];
  }, [cleaners]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const team = job.cleaner?.team || "No Team";
      const status = String(job.status || "");
      const cleanerId = job.cleaner?.id || job.cleanerId || "";

      if (selectedTeam !== "All" && team !== selectedTeam) return false;
      if (selectedStatus !== "All" && status !== selectedStatus) return false;
      if (
        selectedCleanerId !== "All" &&
        String(cleanerId) !== String(selectedCleanerId)
      ) {
        return false;
      }

      return true;
    });
  }, [jobs, selectedTeam, selectedStatus, selectedCleanerId]);

  const jobsByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((day) => {
      map[day.key] = [];
    });

    filteredJobs.forEach((job) => {
      const dayKey = formatDate(job.serviceDate);
      if (map[dayKey]) {
        map[dayKey].push(job);
      }
    });

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        const diff = getJobStartMinutes(a) - getJobStartMinutes(b);
        if (diff !== 0) return diff;
        return getJobEndMinutes(a) - getJobEndMinutes(b);
      });
    });

    return map;
  }, [filteredJobs, weekDays]);

  const unscheduledJobs = useMemo(() => {
    return filteredJobs.filter((job) => {
      const status = String(job.status || "").toLowerCase();

      const isFinished =
        status === "completed" ||
        status === "cancelled" ||
        status === "done";

      if (isFinished) return false;

      const noDate = !job.serviceDate;
      const noTime = !job.serviceTime && !job.anytime;

      return noDate || noTime;
    });
  }, [filteredJobs]);

  const selectedJobCleanerCandidates = useMemo(() => {
    if (!selectedJob) return cleaners;
    return cleaners;
  }, [selectedJob, cleaners]);

  const editCleanerCandidates = useMemo(() => {
    if (!editingJob) return cleaners;
    return cleaners;
  }, [editingJob, cleaners]);

  const totalWeekJobs = useMemo(() => {
    return Object.values(jobsByDay).reduce((sum, arr) => sum + arr.length, 0);
  }, [jobsByDay]);

  return (
    <AppLayout title="Schedule">
      <div style={styles.page}>
        {loading ? (
          <div style={styles.loadingCard}>Loading schedule...</div>
        ) : (
          <>
            <div style={styles.topBar}>
              <div style={styles.topBarLeft}>
                <div style={styles.monthRow}>
                  <h1 style={styles.monthTitle}>{formatMonthYear(currentDate)}</h1>
                </div>
              </div>

              <div style={styles.topBarRight}>
                <button
                  type="button"
                  style={styles.navBtn}
                  onClick={() => setCurrentDate(addDays(currentDate, -7))}
                >
                  ←
                </button>
                <button
                  type="button"
                  style={styles.navBtn}
                  onClick={() => setCurrentDate(addDays(currentDate, 7))}
                >
                  →

                </button>
                <button
                  type="button"
                  style={styles.todayBtn}
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </button>
                <button
                  type="button"
                  style={styles.findTimeBtn}
                  onClick={() => navigate("/jobs")}
                >
                  Find a Time
                </button>
              </div>
            </div>

            <div style={styles.filterRow}>
              <div style={styles.filterLeft}>
                <select
                  style={styles.filterSelect}
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  {teamOptions.map((team) => (
                    <option key={team} value={team}>
                      Team | {team}
                    </option>
                  ))}
                </select>

                <select
                  style={styles.filterSelect}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">Status | All</option>
                  <option value="pending">Status | Pending</option>
                  <option value="assigned">Status | Assigned</option>
                  <option value="completed">Status | Completed</option>
                  <option value="in_progress">Status | In Progress</option>
                  <option value="ongoing">Status | Ongoing</option>
                  <option value="active">Status | Active</option>
                  <option value="done">Status | Done</option>
                </select>

                <select
                  style={styles.filterSelect}
                  value={selectedCleanerId}
                  onChange={(e) => setSelectedCleanerId(e.target.value)}
                >
                  <option value="All">Cleaner | All</option>
                  {cleaners.map((cleaner) => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.filterRight}>
                <div style={styles.timezoneNotice}>
                  Times shown are in your account&apos;s time zone
                </div>

                <div style={styles.viewSwitcher}>
                  <button type="button" style={styles.viewBtnMuted}>
                    Month
                  </button>
                  <button type="button" style={styles.viewBtnActive}>
                    Week
                  </button>
                  <button type="button" style={styles.viewBtnMuted}>
                    Day
                  </button>
                </div>
              </div>
            </div>

            {reassigning && (
              <div style={styles.infoBar}>Reassigning job...</div>
            )}

            <div style={styles.scheduleLayout}>
              <div style={styles.calendarCard}>
                <div style={styles.calendarHeader}>
                  <div style={styles.timeHeaderSpacer} />
                  {weekDays.map((day) => {
                    const count = jobsByDay[day.key]?.length || 0;
                    const isToday = day.key === formatDate(new Date());

                    return (
                      <div key={day.key} style={styles.dayHeaderCell}>
                        <div
                          style={{
                            ...styles.dayBadge,
                            ...(isToday ? styles.dayBadgeToday : {}),
                          }}
                        >
                          {day.shortLabel}
                        </div>
                        <div style={styles.dayDateText}>{day.dayNumber}</div>
                        <div style={styles.dayVisitText}>
                          {count} visit{count === 1 ? "" : "s"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={styles.calendarBody}>
                  <div style={styles.timeColumn}>
                    <div style={styles.anytimeLabel}>↓ Anytime</div>
                    {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                      const hour = START_HOUR + i;
                      return (
                        <div
                          key={hour}
                          style={{
                            ...styles.timeCell,
                            height: HOUR_ROW_HEIGHT,
                          }}
                        >
                          {formatHour(hour)}
                        </div>
                      );
                    })}
                  </div>

                  <div style={styles.daysGrid}>
                    {weekDays.map((day) => {
                      const isDropTarget = dropTargetDay === day.key;
                      const dayJobs = jobsByDay[day.key] || [];
                      const laidOutJobs = computeDayJobLayout(dayJobs);

                      return (
                        <div
                          key={day.key}
                          style={{
                            ...styles.dayColumn,
                            ...(isDropTarget ? styles.dayColumnActive : {}),
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDropTargetDay(day.key);
                          }}
                          onDragLeave={() => {
                            if (dropTargetDay === day.key) setDropTargetDay("");
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDropTargetDay("");
                          }}
                        >
                          {Array.from({ length: END_HOUR - START_HOUR + 1 }).map(
                            (_, i) => (
                              <div
                                key={i}
                                style={{
                                  ...styles.gridHourRow,
                                  height: HOUR_ROW_HEIGHT,
                                }}
                              />
                            )
                          )}

                          {laidOutJobs.map((job) => {
                            const top = getTopOffset(job.serviceTime);
                            const blockHeight = getJobHeight(job);

                            const columnsInGroup = job.__layout?.columnsInGroup || 1;
                            const column = job.__layout?.column || 0;

                            const widthPercent = 96 / columnsInGroup;
                            const leftPercent = 2 + column * widthPercent;

                            const isSelected =
                              selectedJob && String(selectedJob.id) === String(job.id);

                            return (
                              <div
                                key={job.id}
                                draggable
                                onDragStart={(e) => {
                                  setDraggingJobId(job.id);
                                  e.dataTransfer.setData("text/plain", String(job.id));
                                }}
                                onDragEnd={() => {
                                  setDraggingJobId(null);
                                  setDropTargetDay("");
                                }}
                                onClick={(e) => openJobPopover(e, job)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "none";
                                }}
                                style={{
                                  ...styles.jobBlock,
                                  ...(draggingJobId === job.id
                                    ? styles.jobBlockDragging
                                    : {}),
                                  ...getJobBlockStyle(job.status, isSelected),
                                  top,
                                  height: blockHeight,
                                  width: `${widthPercent}%`,
                                  left: `${leftPercent}%`,
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  {String(job.status || "").toLowerCase() === "completed" && (
                                    <span style={{ fontSize: "12px" }}>✔</span>
                                  )}
                                  <div style={styles.jobBlockTitle}>
                                    {job.customer?.name || "Unknown Customer"}
                                    {job.serviceType ? ` - ${job.serviceType}` : ""}
                                  </div>
                                </div>

                                <div style={styles.jobBlockTime}>
                                  {job.serviceTime || "Anytime"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={styles.rightPanel}>
                <div style={styles.unscheduledCard}>
                  <div style={styles.unscheduledHeader}>
                    <div style={styles.unscheduledTitle}>
                      Unscheduled
                      <span style={styles.unscheduledCount}>
                        {unscheduledJobs.length}
                      </span>
                    </div>
                  </div>

                  {unscheduledJobs.length === 0 ? (
                    <div style={styles.unscheduledEmpty}>
                      Drag items here to unschedule them
                    </div>
                  ) : (
                    <div style={styles.unscheduledList}>
                      {unscheduledJobs.map((job) => (
                        <div
                          key={job.id}
                          style={styles.unscheduledItem}
                          onClick={(e) => openJobPopover(e, job)}
                        >
                          <div style={styles.unscheduledItemTitle}>
                            {job.customer?.name || "Unknown Customer"}
                          </div>
                          <div style={styles.unscheduledItemMeta}>
                            Job #{job.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={styles.placeholderCard}>
                  <div style={styles.placeholderTitle}>Week Overview</div>
                  <div style={styles.placeholderText}>
                    {totalWeekJobs} scheduled jobs this week.
                  </div>
                  <div style={styles.placeholderSub}>
                    Click any job block to open details.
                  </div>
                </div>
              </div>
            </div>

            {jobPopover && jobPopover.job && (
              <>
                <div
                  style={styles.popoverBackdrop}
                  onClick={() => {
                    setJobPopover(null);
                    setSelectedJob(null);
                  }}
                />

                <div
                  style={{
                    ...styles.jobPopover,
                    top: jobPopover.top,
                    left: jobPopover.left,
                  }}
                >
                  <div style={styles.jobPopoverHeader}>
                    <div style={styles.jobPopoverGrip}>⋮⋮</div>

                    <button
                      type="button"
                      style={styles.jobPopoverClose}
                      onClick={() => {
                        setJobPopover(null);
                        setSelectedJob(null);
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <h3 style={styles.jobPopoverTitle}>
                    {jobPopover.job.customer?.name || "Unknown Customer"}
                  </h3>

                  <div style={styles.jobPopoverType}>Visit</div>

                  <label style={styles.completedRow}>
                    <input
                      type="checkbox"
                      checked={
                        String(jobPopover.job.status || "").toLowerCase() ===
                        "completed"
                      }
                      disabled={updatingStatus}
                      onChange={(e) =>
                        handleToggleCompleted(jobPopover.job, e.target.checked)
                      }
                    />
                    <span>Completed</span>
                  </label>

                  <div style={styles.popoverSection}>
                    <div style={styles.popoverLabel}>Details</div>
                    <div style={styles.popoverLink}>
                      {jobPopover.job.customer?.name || "Job"} - Job #
                      {jobPopover.job.id}
                    </div>
                  </div>

                  <div style={styles.popoverSection}>
                    <div style={styles.popoverLabel}>Team</div>
                    <div style={styles.assigneeWrap}>
                      {selectedJobCleanerCandidates.map((cleaner) => {
                        const isCurrent =
                          String(
                            jobPopover.job.cleaner?.id ||
                              jobPopover.job.cleanerId ||
                              ""
                          ) === String(cleaner.id);

                        return (
                          <button
                            key={cleaner.id}
                            type="button"
                            style={{
                              ...styles.assigneeChip,
                              ...(isCurrent ? styles.assigneeChipActive : {}),
                            }}
                            onClick={() =>
                              handleDropOnCleaner(cleaner, jobPopover.job.id)
                            }
                          >
                            {cleaner.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={styles.popoverSection}>
                    <div style={styles.popoverLabel}>Location</div>
                    <div style={styles.popoverValue}>
                      {jobPopover.job.address ||
                        jobPopover.job.customer?.address ||
                        "-"}
                    </div>
                  </div>

                  <div style={styles.popoverDateGrid}>
                    <div>
                      <div style={styles.popoverLabel}>Start</div>
                      <div style={styles.popoverValue}>
                        {formatDate(jobPopover.job.serviceDate) || "-"}
                      </div>
                      <div style={styles.popoverValue}>
                        {jobPopover.job.serviceTime || "Anytime"}
                      </div>
                    </div>

                    <div>
                      <div style={styles.popoverLabel}>End</div>
                      <div style={styles.popoverValue}>
                        {formatDate(
                          jobPopover.job.endDate || jobPopover.job.serviceDate
                        ) || "-"}
                      </div>
                      <div style={styles.popoverValue}>
                        {jobPopover.job.endTime ||
                          estimateEndTime(
                            jobPopover.job.serviceTime,
                            jobPopover.job.durationMinutes
                          ) ||
                          "-"}
                      </div>
                    </div>
                  </div>

                  <div style={styles.popoverFooter}>
                    <button
                      type="button"
                      style={styles.editBtn}
                      onClick={() => {
                        openEditModal(jobPopover.job);
                        setJobPopover(null);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      style={styles.viewDetailBtn}
                      onClick={() => navigate(`/jobs/${jobPopover.job.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </>
            )}

            {editingJob && (
              <div style={styles.modalOverlay} onClick={() => setEditingJob(null)}>
                <div
                  style={styles.modalCard}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>
                      {editingJob.customer?.name || "Visit"}
                      {editingJob.serviceType
                        ? ` - ${editingJob.serviceType}`
                        : ""}
                    </h2>
                    <button
                      type="button"
                      style={styles.modalCloseBtn}
                      onClick={() => setEditingJob(null)}
                    >
                      ×
                    </button>
                  </div>

                  <div style={styles.modalTopGrid}>
                    <div>
                      <div style={styles.formLabel}>Visit title</div>
                      <input
                        style={styles.formInput}
                        value={editingJob.title || ""}
                        onChange={(e) =>
                          setEditingJob((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />

                      <div style={{ ...styles.formLabel, marginTop: 14 }}>
                        Instructions
                      </div>
                      <textarea
                        style={styles.formTextarea}
                        value={editingJob.instructions || ""}
                        onChange={(e) =>
                          setEditingJob((prev) => ({
                            ...prev,
                            instructions: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div style={styles.jobDetailsBox}>
                      <div style={styles.sideMiniTitle}>Job details</div>

                      <div style={styles.jobDetailRow}>
                        <span style={styles.jobDetailKey}>Job #</span>
                        <span style={styles.jobDetailValue}>{editingJob.id}</span>
                      </div>

                      <div style={styles.jobDetailRow}>
                        <span style={styles.jobDetailKey}>Client</span>
                        <span style={styles.jobDetailValue}>
                          {editingJob.customer?.name || "-"}
                        </span>
                      </div>

                      <div style={styles.jobDetailRow}>
                        <span style={styles.jobDetailKey}>Phone</span>
                        <span style={styles.jobDetailValue}>
                          {editingJob.customer?.phone || "-"}
                        </span>
                      </div>

                      <div style={styles.jobDetailRow}>
                        <span style={styles.jobDetailKey}>Address</span>
                        <span style={styles.jobDetailValue}>
                          {editingJob.address ||
                            editingJob.customer?.address ||
                            "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.modalDivider} />

                  <div style={styles.modalMidGrid}>
                    <div>
                      <h3 style={styles.modalSectionTitle}>Visit schedule</h3>

                      <div style={styles.scheduleFieldsGrid}>
                        <div>
                          <div style={styles.formLabel}>Start date</div>
                          <input
                            type="date"
                            style={styles.formInput}
                            value={editingJob.startDate || ""}
                            onChange={(e) =>
                              setEditingJob((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <div style={styles.formLabel}>End date</div>
                          <input
                            type="date"
                            style={styles.formInput}
                            value={editingJob.endDate || ""}
                            onChange={(e) =>
                              setEditingJob((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <div style={styles.formLabel}>Start time</div>
                          <input
                            type="time"
                            style={styles.formInput}
                            value={editingJob.startTime || ""}
                            disabled={editingJob.anytime}
                            onChange={(e) =>
                              setEditingJob((prev) => ({
                                ...prev,
                                startTime: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <div style={styles.formLabel}>End time</div>
                          <input
                            type="time"
                            style={styles.formInput}
                            value={editingJob.endTime || ""}
                            disabled={editingJob.anytime}
                            onChange={(e) =>
                              setEditingJob((prev) => ({
                                ...prev,
                                endTime: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div style={styles.checkRow}>
                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={!!editingJob.anytime}
                            onChange={(e) =>
                              setEditingJob((prev) => ({
                                ...prev,
                                anytime: e.target.checked,
                              }))
                            }
                          />
                          <span>Any time</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <div style={styles.teamHeaderRow}>
                        <h3 style={styles.modalSectionTitle}>Team</h3>
                      </div>

                      <div style={styles.assigneeWrap}>
                        {editCleanerCandidates.map((cleaner) => {
                          const isCurrent =
                            String(editingJob.cleanerId || "") ===
                            String(cleaner.id);

                          return (
                            <button
                              key={cleaner.id}
                              type="button"
                              style={{
                                ...styles.assigneeChip,
                                ...(isCurrent ? styles.assigneeChipActive : {}),
                              }}
                              onClick={() =>
                                setEditingJob((prev) => ({
                                  ...prev,
                                  cleanerId: String(cleaner.id),
                                }))
                              }
                            >
                              {cleaner.name}
                            </button>
                          );
                        })}
                      </div>

                      <div style={styles.checkRow}>
                        <label style={styles.checkboxLabel}>
                          <input type="checkbox" disabled />
                          <span>Email team about assignment</span>
                        </label>
                      </div>

                      <div style={{ marginTop: 20 }}>
                        <div style={styles.formLabel}>Team reminder</div>
                        <select style={styles.formInput} defaultValue="No reminder set">
                          <option>No reminder set</option>
                          <option>15 minutes before</option>
                          <option>30 minutes before</option>
                          <option>1 hour before</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={styles.modalNoticeBox}>
                    Please reopen the job to edit line items
                  </div>

                  <div style={styles.modalFooter}>
                    <div style={styles.modalFooterLeft}>
                      <button
                        type="button"
                        style={styles.deleteBtn}
                        onClick={() => navigate(`/jobs/${editingJob.id}`)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        style={styles.cancelBtn}
                        onClick={() => setEditingJob(null)}
                      >
                        Cancel
                      </button>
                    </div>

                    <button
                      type="button"
                      style={{
                        ...styles.saveBtn,
                        ...(savingEdit ? styles.saveBtnDisabled : {}),
                      }}
                      disabled={savingEdit}
                      onClick={handleSaveEdit}
                    >
                      {savingEdit ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function getWeekDays(date) {
  const current = new Date(date);
  const day = current.getDay();
  const sunday = new Date(current);
  sunday.setDate(current.getDate() - day);

  return Array.from({ length: 7 }).map((_, index) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + index);

    return {
      key: formatDate(d),
      shortLabel: d.toLocaleDateString(undefined, { weekday: "short" }),
      dayNumber: d.getDate(),
      fullDate: d,
    };
  });
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) {
    if (typeof dateInput === "string") return dateInput.split("T")[0];
    return "";
  }
  return d.toISOString().split("T")[0];
}

function formatMonthYear(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function parseTimeToMinutes(timeString) {
  if (!timeString) return 0;

  let raw = String(timeString).trim().toLowerCase();
  raw = raw.replace(/\./g, ":");
  raw = raw.replace(/\s+/g, "");
  raw = raw.replace("am", " am").replace("pm", " pm").trim();

  if (raw.includes("am") || raw.includes("pm")) {
    const match = raw.match(/^(\d{1,2}):?(\d{2})?\s?(am|pm)$/i);
    if (match) {
      let hour = Number(match[1]);
      const minute = Number(match[2] || "0");
      const meridiem = match[3].toLowerCase();

      if (meridiem === "pm" && hour !== 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;

      return hour * 60 + minute;
    }
  }

  const match24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = Number(match24[1]);
    const minute = Number(match24[2]);
    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      return hour * 60 + minute;
    }
  }

  return 0;
}

function normalizeTimeInput(value) {
  if (!value) return "";
  const totalMinutes = parseTimeToMinutes(value);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getJobStartMinutes(job) {
  return parseTimeToMinutes(job.serviceTime || "00:00");
}

function getJobEndMinutes(job) {
  const start = getJobStartMinutes(job);
  const duration = Number(job.durationMinutes || 120);
  return start + duration;
}

function jobsOverlap(jobA, jobB) {
  const aStart = getJobStartMinutes(jobA);
  const aEnd = getJobEndMinutes(jobA);
  const bStart = getJobStartMinutes(jobB);
  const bEnd = getJobEndMinutes(jobB);

  return aStart < bEnd && bStart < aEnd;
}

function computeDayJobLayout(dayJobs) {
  if (!dayJobs || dayJobs.length === 0) return [];

  const sorted = [...dayJobs].sort((a, b) => {
    const diff = getJobStartMinutes(a) - getJobStartMinutes(b);
    if (diff !== 0) return diff;
    return getJobEndMinutes(a) - getJobEndMinutes(b);
  });

  const groups = [];
  let currentGroup = [];

  for (const job of sorted) {
    if (currentGroup.length === 0) {
      currentGroup.push(job);
      continue;
    }

    const overlapsExisting = currentGroup.some((g) => jobsOverlap(g, job));

    if (overlapsExisting) {
      currentGroup.push(job);
    } else {
      groups.push(currentGroup);
      currentGroup = [job];
    }
  }

  if (currentGroup.length) {
    groups.push(currentGroup);
  }

  const result = [];

  groups.forEach((group) => {
    const columns = [];
    const groupItems = [];

    group.forEach((job) => {
      let placedColumn = -1;

      for (let i = 0; i < columns.length; i++) {
        const lastJobInColumn = columns[i][columns[i].length - 1];
        if (!jobsOverlap(lastJobInColumn, job)) {
          placedColumn = i;
          break;
        }
      }

      if (placedColumn === -1) {
        columns.push([job]);
        placedColumn = columns.length - 1;
      } else {
        columns[placedColumn].push(job);
      }

      groupItems.push({
        ...job,
        __layout: {
          column: placedColumn,
          columnsInGroup: 1,
        },
      });
    });

    groupItems.forEach((item) => {
      item.__layout.columnsInGroup = columns.length;
      result.push(item);
    });
  });

  return result;
}

function getTopOffset(serviceTime) {
  const minutes = parseTimeToMinutes(serviceTime || "00:00");
  const startMinutes = START_HOUR * 60;
  const relativeMinutes = Math.max(0, minutes - startMinutes);
  return 26 + (relativeMinutes / 60) * HOUR_ROW_HEIGHT;
}

function getJobHeight(job) {
  const minutes = Number(job.durationMinutes || 120);
  return Math.max(56, (minutes / 60) * HOUR_ROW_HEIGHT);
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function estimateEndTime(start, durationMinutes = 120) {
  if (!start) return "";
  const total = parseTimeToMinutes(start) + Number(durationMinutes || 120);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getJobBlockStyle(status, isSelected) {
  const s = String(status || "").toLowerCase();

  if (s === "completed" || s === "done") {
    return {
      background: "#e5e7eb",
      color: "#6b7280",
      border: "1px solid #d1d5db",
    };
  }

  if (isSelected) {
    return {
      background: "#1f6f11",
      color: "#ffffff",
      boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
    };
  }

  return {
    background: "#dff5dc",
    color: "#1f6f11",
    border: "1px solid #b7e3b0",
  };
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },

  loadingCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #dfe5ea",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "16px",
    flexWrap: "wrap",
  },

  topBarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  monthRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  monthTitle: {
    margin: 0,
    fontSize: "38px",
    lineHeight: 1.05,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },

  navBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #d7dde3",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "700",
  },

  todayBtn: {
    height: "36px",
    padding: "0 14px",
    borderRadius: "10px",
    border: "1px solid #d7dde3",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  findTimeBtn: {
    height: "36px",
    padding: "0 16px",
    borderRadius: "10px",
    border: "none",
    background: "#49a12f",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
  },

  filterRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  filterLeft: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  filterRight: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  filterSelect: {
    height: "40px",
    padding: "0 14px",
    borderRadius: "999px",
    border: "1px solid #cfd8e3",
    background: "#fff",
    fontSize: "14px",
  },

  timezoneNotice: {
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#eef6ff",
    color: "#356da5",
    fontSize: "13px",
    border: "1px solid #d7e9ff",
  },

  viewSwitcher: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #d7dde3",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#fff",
  },

  viewBtnMuted: {
    height: "36px",
    padding: "0 14px",
    border: "none",
    background: "#fff",
    color: "#64748b",
    cursor: "pointer",
    fontWeight: "600",
  },

  viewBtnActive: {
    height: "36px",
    padding: "0 14px",
    border: "none",
    background: "#f0faed",
    color: "#3f8f25",
    cursor: "pointer",
    fontWeight: "700",
  },

  infoBar: {
    padding: "10px 14px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    borderRadius: "12px",
    fontWeight: "600",
  },

  scheduleLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: "0",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #dfe5ea",
    background: "#fff",
    minHeight: "720px",
  },

  calendarCard: {
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    borderRight: "1px solid #dfe5ea",
  },

  calendarHeader: {
    display: "grid",
    gridTemplateColumns: "52px repeat(7, 1fr)",
    borderBottom: "1px solid #dfe5ea",
    background: "#fff",
  },

  timeHeaderSpacer: {
    borderRight: "1px solid #edf1f5",
  },

  dayHeaderCell: {
    padding: "10px 8px",
    minHeight: "72px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    borderRight: "1px solid #edf1f5",
  },

  dayBadge: {
    padding: "4px 8px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#243447",
  },

  dayBadgeToday: {
    background: "#2f78c4",
    color: "#fff",
  },

  dayDateText: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1,
  },

  dayVisitText: {
    fontSize: "12px",
    color: "#7b8794",
  },

  calendarBody: {
    display: "grid",
    gridTemplateColumns: "52px minmax(0, 1fr)",
    minHeight: "680px",
  },

  timeColumn: {
    borderRight: "1px solid #edf1f5",
    background: "#fff",
    position: "relative",
  },

  anytimeLabel: {
    height: "26px",
    fontSize: "12px",
    color: "#66758a",
    padding: "8px 6px 0",
  },

  timeCell: {
    borderTop: "1px solid #edf1f5",
    fontSize: "12px",
    color: "#708198",
    padding: "4px 6px",
    boxSizing: "border-box",
  },

  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    position: "relative",
  },

  dayColumn: {
    position: "relative",
    borderRight: "1px solid #edf1f5",
    background: "#fff",
  },

  dayColumnActive: {
    background: "#f8fbff",
  },

  gridHourRow: {
    borderTop: "1px solid #edf1f5",
    boxSizing: "border-box",
  },

  jobBlock: {
    position: "absolute",
    borderRadius: "4px",
    padding: "10px 10px",
    boxSizing: "border-box",
    cursor: "pointer",
    overflow: "hidden",
    fontSize: "12px",
    fontWeight: "700",
    zIndex: 2,
    transition: "all 0.15s ease",
  },

  jobBlockDragging: {
    opacity: 0.55,
  },

  jobBlockTitle: {
    fontSize: "12px",
    lineHeight: 1.35,
    fontWeight: "700",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  jobBlockTime: {
    marginTop: "4px",
    fontSize: "12px",
    opacity: 0.95,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  rightPanel: {
    background: "#fff",
    display: "grid",
    gridTemplateRows: "auto 1fr",
    minHeight: "720px",
  },

  unscheduledCard: {
    borderBottom: "1px solid #dfe5ea",
    padding: "12px",
  },

  unscheduledHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  unscheduledTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  unscheduledCount: {
    minWidth: "22px",
    height: "22px",
    padding: "0 6px",
    borderRadius: "999px",
    background: "#eef2f7",
    color: "#4b5563",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  unscheduledEmpty: {
    minHeight: "130px",
    border: "1px dashed #d7dde3",
    borderRadius: "12px",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: "14px",
    padding: "16px",
  },

  unscheduledList: {
    display: "grid",
    gap: "10px",
  },

  unscheduledItem: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    cursor: "pointer",
    background: "#fff",
  },

  unscheduledItemTitle: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: "14px",
  },

  unscheduledItemMeta: {
    marginTop: "4px",
    color: "#6b7280",
    fontSize: "12px",
  },

  placeholderCard: {
    padding: "16px",
  },

  placeholderTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },

  placeholderText: {
    marginTop: "8px",
    fontSize: "14px",
    color: "#475569",
  },

  placeholderSub: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#94a3b8",
  },

  popoverBackdrop: {
    position: "fixed",
    inset: 0,
    background: "transparent",
    zIndex: 50,
  },

  jobPopover: {
    position: "absolute",
    width: "380px",
    background: "#fff",
    border: "1px solid #dfe5ea",
    borderRadius: "12px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
    padding: "16px",
    zIndex: 60,
  },

  jobPopoverHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  jobPopoverGrip: {
    fontSize: "14px",
    color: "#64748b",
    letterSpacing: "1px",
  },

  jobPopoverClose: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "1px solid #d7dde3",
    background: "#fff",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1,
  },

  jobPopoverTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1.35,
  },

  jobPopoverType: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#64748b",
  },

  completedRow: {
    marginTop: "14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#334155",
  },

  popoverSection: {
    marginTop: "16px",
  },

  popoverLabel: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#243447",
    marginBottom: "6px",
  },

  popoverLink: {
    fontSize: "14px",
    color: "#5a9b2f",
    fontWeight: "600",
  },

  popoverValue: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: 1.6,
  },

  popoverDateGrid: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },

  popoverFooter: {
    marginTop: "18px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  assigneeWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  assigneeChip: {
    padding: "8px 10px",
    borderRadius: "999px",
    border: "1px solid #d6dce3",
    background: "#f8fafc",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "700",
  },

  assigneeChipActive: {
    background: "#e8f5e4",
    border: "1px solid #8ac36f",
    color: "#2f7a1f",
  },

  editBtn: {
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "700",
  },

  viewDetailBtn: {
    height: "40px",
    borderRadius: "10px",
    border: "none",
    background: "#4d972f",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "24px",
  },

  modalCard: {
    width: "100%",
    maxWidth: "980px",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #dfe5ea",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
    padding: "20px",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "12px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f3340",
    lineHeight: 1.35,
  },

  modalCloseBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    border: "1px solid #d7dde3",
    background: "#fff",
    cursor: "pointer",
    fontSize: "22px",
    lineHeight: 1,
  },

  modalTopGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.8fr",
    gap: "24px",
    alignItems: "start",
  },

  modalDivider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "14px 0 10px",
  },

  modalMidGrid: {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.9fr",
    gap: "26px",
    alignItems: "start",
  },

  modalSectionTitle: {
    margin: "0 0 12px",
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f3340",
  },

  formLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "6px",
  },

  formInput: {
    width: "100%",
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #cfd8e3",
    background: "#fff",
    padding: "0 12px",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  formTextarea: {
    width: "100%",
    minHeight: "96px",
    borderRadius: "10px",
    border: "1px solid #cfd8e3",
    background: "#fff",
    padding: "10px 12px",
    fontSize: "14px",
    boxSizing: "border-box",
    resize: "vertical",
  },

  jobDetailsBox: {
    paddingTop: "2px",
  },

  sideMiniTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f3340",
    marginBottom: "10px",
  },

  jobDetailRow: {
    display: "grid",
    gridTemplateColumns: "72px 1fr",
    gap: "10px",
    marginBottom: "8px",
    alignItems: "start",
  },

  jobDetailKey: {
    fontSize: "14px",
    color: "#475569",
  },

  jobDetailValue: {
    fontSize: "14px",
    color: "#62a54a",
    fontWeight: "500",
    wordBreak: "break-word",
  },

  scheduleFieldsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },

  checkRow: {
    marginTop: "12px",
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
  },

  checkboxLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#475569",
  },

  teamHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalNoticeBox: {
    marginTop: "18px",
    borderRadius: "10px",
    border: "1px solid #e4e7eb",
    background: "#f8f7f4",
    color: "#475569",
    textAlign: "center",
    padding: "16px",
    fontSize: "14px",
  },

  modalFooter: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  modalFooterLeft: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  deleteBtn: {
    height: "40px",
    padding: "0 16px",
    borderRadius: "10px",
    border: "1px solid #f1d1d1",
    background: "#fff",
    color: "#d13c3c",
    fontWeight: "700",
    cursor: "pointer",
  },

  cancelBtn: {
    height: "40px",
    padding: "0 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#334155",
    fontWeight: "700",
    cursor: "pointer",
  },

  saveBtn: {
    height: "40px",
    padding: "0 18px",
    borderRadius: "10px",
    border: "none",
    background: "#4d972f",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  saveBtnDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
};