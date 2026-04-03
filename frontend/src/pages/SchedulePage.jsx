import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";
import { useCompany } from "../context/CompanyContext";

const API = API_BASE_URL;

const START_HOUR = 0;
const END_HOUR = 23;
const HOUR_ROW_HEIGHT = 56;
const DEFAULT_DURATION_MINUTES = 120;

export default function SchedulePage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const {
    timezone: rawCompanyTimezone,
    firstDayOfWeek: rawFirstDayOfWeek,
  } = useCompany();

  const companyTimezone = getSafeTimeZone(rawCompanyTimezone);
  const companyFirstDayOfWeek = normalizeFirstDayOfWeek(rawFirstDayOfWeek);

  const [jobs, setJobs] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week"); // month | week | day

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
  const [updatingCleaner, setUpdatingCleaner] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      setJobs(Array.isArray(jobsRes?.data?.jobs) ? jobsRes.data.jobs : []);
      setCleaners(
        Array.isArray(cleanersRes?.data?.cleaners)
          ? cleanersRes.data.cleaners
          : []
      );
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

  async function handleCleanerSelect(job, cleanerId) {
    if (!job?.id || !cleanerId) return;

    const cleaner = cleaners.find((c) => String(c.id) === String(cleanerId));
    if (!cleaner) return;

    try {
      setUpdatingCleaner(true);
      await handleDropOnCleaner(cleaner, job.id);
    } finally {
      setUpdatingCleaner(false);
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
      setJobPopover(null);
      setSelectedJob(null);
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
    if (!e?.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 380;
    const gap = 12;

    let left = rect.right + gap + window.scrollX;
    let top = rect.top + window.scrollY - 8;

    if (left + popoverWidth > window.innerWidth - 20) {
      left = rect.left + window.scrollX - popoverWidth - gap;
    }

    if (left < 12) left = 12;
    if (top < 20) top = 20;

    setSelectedJob(job);
    setJobPopover({
      job,
      top,
      left,
    });
  }

  const weekDays = useMemo(
    () => getWeekDays(currentDate, companyFirstDayOfWeek),
    [currentDate, companyFirstDayOfWeek]
  );

  const monthGrid = useMemo(
    () => getMonthGrid(currentDate, companyFirstDayOfWeek),
    [currentDate, companyFirstDayOfWeek]
  );

  const dayViewDate = useMemo(() => stripTime(currentDate), [currentDate]);

  const weekdayHeaders = useMemo(
    () => getWeekdayHeaders(companyFirstDayOfWeek),
    [companyFirstDayOfWeek]
  );

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

  const jobsByDate = useMemo(() => {
    const map = {};

    filteredJobs.forEach((job) => {
      const dayKey = formatDate(job.serviceDate);
      if (!dayKey) return;

      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(job);
    });

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        const diff = getJobStartMinutes(a) - getJobStartMinutes(b);
        if (diff !== 0) return diff;
        return getJobEndMinutes(a) - getJobEndMinutes(b);
      });
    });

    return map;
  }, [filteredJobs]);

  const jobsByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((day) => {
      map[day.key] = jobsByDate[day.key] || [];
    });
    return map;
  }, [weekDays, jobsByDate]);

  const dayJobs = useMemo(() => {
    const key = formatDate(dayViewDate);
    return jobsByDate[key] || [];
  }, [dayViewDate, jobsByDate]);

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

  const totalWeekJobs = useMemo(() => {
    return Object.values(jobsByDay).reduce((sum, arr) => sum + arr.length, 0);
  }, [jobsByDay]);

  const totalMonthJobs = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    return filteredJobs.filter((job) => {
      const d = parseDateOnly(job.serviceDate);
      if (!d) return false;
      return d >= monthStart && d <= monthEnd;
    }).length;
  }, [filteredJobs, currentDate]);

  const currentTitle = useMemo(() => {
    if (view === "month") {
      return formatMonthYear(currentDate, companyTimezone);
    }
    if (view === "week") {
      return formatWeekRangeLabel(weekDays, companyTimezone);
    }
    return formatLongDate(dayViewDate, companyTimezone);
  }, [view, currentDate, companyTimezone, weekDays, dayViewDate]);

  function goPrev() {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, -1));
      return;
    }
    if (view === "day") {
      setCurrentDate(addDays(currentDate, -1));
      return;
    }
    setCurrentDate(addDays(currentDate, -7));
  }

  function goNext() {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
      return;
    }
    if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
      return;
    }
    setCurrentDate(addDays(currentDate, 7));
  }

  function goToday() {
    setCurrentDate(new Date());
  }

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
                  <h1 style={styles.monthTitle}>{currentTitle || "Schedule"}</h1>
                  <div style={styles.subTitle}>
                    Company timezone: {companyTimezone}
                  </div>
                </div>
              </div>

              <div style={styles.topBarRight}>
                <button type="button" style={styles.navBtn} onClick={goPrev}>
                  ←
                </button>
                <button type="button" style={styles.navBtn} onClick={goNext}>
                  →
                </button>
                <button type="button" style={styles.todayBtn} onClick={goToday}>
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
                  Times shown are based on company settings
                </div>

                <div style={styles.viewSwitcher}>
                  <button
                    type="button"
                    style={view === "month" ? styles.viewBtnActive : styles.viewBtnMuted}
                    onClick={() => setView("month")}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    style={view === "week" ? styles.viewBtnActive : styles.viewBtnMuted}
                    onClick={() => setView("week")}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    style={view === "day" ? styles.viewBtnActive : styles.viewBtnMuted}
                    onClick={() => setView("day")}
                  >
                    Day
                  </button>
                </div>
              </div>
            </div>

            {reassigning && <div style={styles.infoBar}>Reassigning job...</div>}

            <div style={styles.scheduleLayout}>
              <div style={styles.calendarCard}>
                {view === "month" && (
                  <MonthView
                    currentDate={currentDate}
                    monthGrid={monthGrid}
                    weekdayHeaders={weekdayHeaders}
                    jobsByDate={jobsByDate}
                    selectedJob={selectedJob}
                    onOpenJob={openJobPopover}
                    setCurrentDate={setCurrentDate}
                    setView={setView}
                  />
                )}

                {view === "week" && (
                  <WeekView
                    weekDays={weekDays}
                    jobsByDay={jobsByDay}
                    selectedJob={selectedJob}
                    draggingJobId={draggingJobId}
                    dropTargetDay={dropTargetDay}
                    setDropTargetDay={setDropTargetDay}
                    setDraggingJobId={setDraggingJobId}
                    onOpenJob={openJobPopover}
                  />
                )}

                {view === "day" && (
                  <DayView
                    dayDate={dayViewDate}
                    jobs={dayJobs}
                    selectedJob={selectedJob}
                    draggingJobId={draggingJobId}
                    setDraggingJobId={setDraggingJobId}
                    onOpenJob={openJobPopover}
                  />
                )}
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
                  <div style={styles.placeholderTitle}>
                    {view === "month"
                      ? "Month Overview"
                      : view === "day"
                      ? "Day Overview"
                      : "Week Overview"}
                  </div>

                  <div style={styles.placeholderText}>
                    {view === "month"
                      ? `${totalMonthJobs} scheduled jobs this month.`
                      : view === "day"
                      ? `${dayJobs.length} scheduled jobs this day.`
                      : `${totalWeekJobs} scheduled jobs this week.`}
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
                    <select
                      style={styles.teamSelect}
                      value={String(
                        jobPopover.job.cleaner?.id || jobPopover.job.cleanerId || ""
                      )}
                      disabled={updatingCleaner}
                      onChange={(e) =>
                        handleCleanerSelect(jobPopover.job, e.target.value)
                      }
                    >
                      <option value="">Select cleaner</option>
                      {cleaners.map((cleaner) => (
                        <option key={cleaner.id} value={cleaner.id}>
                          {cleaner.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.popoverSection}>
                    <div style={styles.popoverLabel}>Location</div>
                    <div style={styles.popoverValueAddress}>
                      {formatAddress(jobPopover.job)}
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
                          {renderAddressText(editingJob)}
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

                      <select
                        style={styles.formInput}
                        value={editingJob.cleanerId || ""}
                        onChange={(e) =>
                          setEditingJob((prev) => ({
                            ...prev,
                            cleanerId: String(e.target.value),
                          }))
                        }
                      >
                        <option value="">Select cleaner</option>
                        {cleaners.map((cleaner) => (
                          <option key={cleaner.id} value={cleaner.id}>
                            {cleaner.name}
                          </option>
                        ))}
                      </select>

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

function MonthView({
  currentDate,
  monthGrid,
  weekdayHeaders,
  jobsByDate,
  selectedJob,
  onOpenJob,
  setCurrentDate,
  setView,
}) {
  const todayKey = formatDate(new Date());
  const currentMonth = stripTime(currentDate).getMonth();
  const currentYear = stripTime(currentDate).getFullYear();

  return (
    <div style={styles.monthWrap}>
      <div style={styles.monthWeekdayHeaderRow}>
        {weekdayHeaders.map((label) => (
          <div key={label} style={styles.monthWeekdayHeaderCell}>
            {label}
          </div>
        ))}
      </div>

      <div style={styles.monthGrid}>
        {monthGrid.map((day) => {
          const dayJobs = jobsByDate[day.key] || [];
          const isToday = day.key === todayKey;
          const isCurrentMonth =
            day.fullDate.getMonth() === currentMonth &&
            day.fullDate.getFullYear() === currentYear;

          return (
            <div
              key={day.key}
              style={{
                ...styles.monthCell,
                ...(isCurrentMonth ? {} : styles.monthCellMuted),
                ...(isToday ? styles.monthCellToday : {}),
              }}
              onDoubleClick={() => {
                setCurrentDate(day.fullDate);
                setView("day");
              }}
            >
              <div style={styles.monthCellHeader}>
                <div
                  style={{
                    ...styles.monthCellDate,
                    ...(isToday ? styles.monthCellDateToday : {}),
                  }}
                >
                  {day.dayNumber}
                </div>

                {dayJobs.length > 0 && (
                  <div style={styles.monthCellCount}>{dayJobs.length}</div>
                )}
              </div>

              <div style={styles.monthCellBody}>
                {dayJobs.slice(0, 3).map((job) => {
                  const isSelected =
                    selectedJob && String(selectedJob.id) === String(job.id);

                  return (
                    <div
                      key={job.id}
                      style={{
                        ...styles.monthJobPill,
                        ...getJobBlockStyle(job.status, isSelected),
                      }}
                      onClick={(e) => onOpenJob(e, job)}
                      title={`${job.customer?.name || "Unknown Customer"} • ${
                        job.serviceTime || "Anytime"
                      }`}
                    >
                      <span style={styles.monthJobTimeTiny}>
                        {job.serviceTime || "Any"}
                      </span>
                      <span style={styles.monthJobNameTiny}>
                        {job.customer?.name || "Unknown Customer"}
                      </span>
                    </div>
                  );
                })}

                {dayJobs.length > 3 && (
                  <div style={styles.moreJobsText}>+{dayJobs.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.monthHint}>
        Double click a day cell to open Day view.
      </div>
    </div>
  );
}

function WeekView({
  weekDays,
  jobsByDay,
  selectedJob,
  draggingJobId,
  dropTargetDay,
  setDropTargetDay,
  setDraggingJobId,
  onOpenJob,
}) {
  return (
    <>
      <div style={styles.calendarHeader}>
        <div style={styles.timeHeaderSpacer} />
        <div style={styles.weekHeaderGrid}>
          {weekDays.map((day) => {
            const count = jobsByDay[day.key]?.length || 0;
            const isToday = day.key === formatDate(new Date());

            return (
              <div key={day.key} style={styles.weekHeaderCell}>
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
                {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.gridHourRow,
                      height: HOUR_ROW_HEIGHT,
                    }}
                  />
                ))}

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
                      onClick={(e) => onOpenJob(e, job)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                      }}
                      style={{
                        ...styles.jobBlock,
                        ...(draggingJobId === job.id ? styles.jobBlockDragging : {}),
                        ...getJobBlockStyle(job.status, isSelected),
                        top,
                        height: blockHeight,
                        width: `${widthPercent}%`,
                        left: `${leftPercent}%`,
                      }}
                    >
                      <div style={styles.jobBlockInner}>
                        <div style={styles.jobBlockTopRow}>
                          {String(job.status || "").toLowerCase() === "completed" && (
                            <span style={styles.jobBlockCheck}>✓</span>
                          )}

                          <div style={styles.jobBlockTitle}>
                            {job.customer?.name || "Unknown Customer"}
                          </div>
                        </div>

                        <div style={styles.jobBlockTime}>
                          {job.serviceTime || "Anytime"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function DayView({
  dayDate,
  jobs,
  selectedJob,
  draggingJobId,
  setDraggingJobId,
  onOpenJob,
}) {
  const laidOutJobs = computeDayJobLayout(jobs);

  return (
    <>
      <div style={styles.calendarHeader}>
        <div style={styles.timeHeaderSpacer} />
        <div style={styles.singleDayHeaderCell}>
          <div style={styles.dayBadgeToday}>{formatWeekdayShort(dayDate)}</div>
          <div style={styles.dayDateText}>{dayDate.getDate()}</div>
          <div style={styles.dayVisitText}>
            {jobs.length} visit{jobs.length === 1 ? "" : "s"}
          </div>
        </div>
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

        <div style={styles.singleDayGrid}>
          {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.gridHourRow,
                height: HOUR_ROW_HEIGHT,
              }}
            />
          ))}

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
                }}
                onClick={(e) => onOpenJob(e, job)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                }}
                style={{
                  ...styles.jobBlock,
                  ...(draggingJobId === job.id ? styles.jobBlockDragging : {}),
                  ...getJobBlockStyle(job.status, isSelected),
                  top,
                  height: blockHeight,
                  width: `${widthPercent}%`,
                  left: `${leftPercent}%`,
                }}
              >
                <div style={styles.jobBlockInner}>
                  <div style={styles.jobBlockTopRow}>
                    {String(job.status || "").toLowerCase() === "completed" && (
                      <span style={styles.jobBlockCheck}>✓</span>
                    )}

                    <div style={styles.jobBlockTitle}>
                      {job.customer?.name || "Unknown Customer"}
                    </div>
                  </div>

                  <div style={styles.jobBlockTime}>
                    {job.serviceTime || "Anytime"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* =========================
   Date / Time Helpers
========================= */

function getSafeTimeZone(timezone) {
  const fallback = "UTC";
  const tz = String(timezone || "").trim();

  if (!tz) return fallback;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return fallback;
  }
}

function normalizeFirstDayOfWeek(value) {
  const n = Number(value);
  if (Number.isInteger(n) && n >= 0 && n <= 6) return n;
  return 0;
}

function parseDateOnly(input) {
  if (!input) return null;
  if (input instanceof Date) return stripTime(input);

  const str = String(input);
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return stripTime(d);
}

function stripTime(date) {
  const d = date instanceof Date ? new Date(date) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(date) {
  const d = stripTime(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(date) {
  const d = stripTime(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(date, days) {
  const d = stripTime(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = stripTime(date);
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

function formatDate(dateInput) {
  if (!dateInput) return "";
  const d = parseDateOnly(dateInput);
  if (!d) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

function formatMonthYear(date, timezone) {
  const safeTz = getSafeTimeZone(timezone);
  const d = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: safeTz,
  }).format(d);
}

function formatLongDate(date, timezone) {
  const safeTz = getSafeTimeZone(timezone);
  const d = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: safeTz,
  }).format(d);
}

function formatWeekRangeLabel(weekDays, timezone) {
  if (!Array.isArray(weekDays) || weekDays.length === 0) return "";

  const start = weekDays[0]?.fullDate;
  const end = weekDays[weekDays.length - 1]?.fullDate;

  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return "";
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return "";

  const safeTz = getSafeTimeZone(timezone);

  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  const startText = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: safeTz,
  }).format(start);

  const endText = new Intl.DateTimeFormat(undefined, {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
    timeZone: safeTz,
  }).format(end);

  return `${startText} - ${endText}`;
}

function formatWeekdayShort(date) {
  const d = date instanceof Date ? date : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function getWeekdayHeaders(firstDayOfWeek = 0) {
  const base = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const safe = normalizeFirstDayOfWeek(firstDayOfWeek);
  return [...base.slice(safe), ...base.slice(0, safe)];
}

function getWeekDays(date, firstDayOfWeek = 0) {
  const current = stripTime(date);
  const safe = normalizeFirstDayOfWeek(firstDayOfWeek);
  const day = current.getDay();
  const diff = (day - safe + 7) % 7;
  const weekStart = addDays(current, -diff);

  return Array.from({ length: 7 }).map((_, index) => {
    const d = addDays(weekStart, index);

    return {
      key: formatDate(d),
      shortLabel: d.toLocaleDateString(undefined, { weekday: "short" }),
      dayNumber: d.getDate(),
      fullDate: d,
    };
  });
}

function getMonthGrid(date, firstDayOfWeek = 0) {
  const safe = normalizeFirstDayOfWeek(firstDayOfWeek);
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const startDay = monthStart.getDay();
  const startDiff = (startDay - safe + 7) % 7;
  const gridStart = addDays(monthStart, -startDiff);

  const endDay = monthEnd.getDay();
  const lastDayOfWeek = (safe + 6) % 7;
  const endDiff = (lastDayOfWeek - endDay + 7) % 7;
  const gridEnd = addDays(monthEnd, endDiff);

  const days = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    days.push({
      key: formatDate(cursor),
      dayNumber: cursor.getDate(),
      fullDate: cursor,
    });
    cursor = addDays(cursor, 1);
  }

  return days;
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

function estimateEndTime(startTime, durationMinutes) {
  if (!startTime) return "";
  const start = parseTimeToMinutes(startTime);
  const duration = Number(durationMinutes || DEFAULT_DURATION_MINUTES);
  const end = start + duration;
  const h = Math.floor((end % (24 * 60)) / 60);
  const m = end % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getJobStartMinutes(job) {
  return parseTimeToMinutes(job?.serviceTime || "00:00");
}

function getJobEndMinutes(job) {
  const start = getJobStartMinutes(job);
  const duration = Number(job?.durationMinutes || DEFAULT_DURATION_MINUTES);
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
  if (!Array.isArray(dayJobs) || dayJobs.length === 0) return [];

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
  return 40 + (relativeMinutes / 60) * HOUR_ROW_HEIGHT;
}

function getJobHeight(job) {
  const duration = Number(job?.durationMinutes || DEFAULT_DURATION_MINUTES);
  return Math.max(42, (duration / 60) * HOUR_ROW_HEIGHT - 4);
}

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}:00 ${suffix}`;
}

function getJobBlockStyle(status, isSelected = false) {
  const value = String(status || "").toLowerCase();

  let base = {
    background: "linear-gradient(180deg, #e8f0fe 0%, #dbeafe 100%)",
    border: "1px solid #bfdbfe",
    color: "#0f172a",
  };

  if (value === "completed" || value === "done") {
    base = {
      background: "linear-gradient(180deg, #e5e7eb 0%, #d1d5db 100%)",
      border: "1px solid #cbd5e1",
      color: "#334155",
    };
  } else if (value === "pending") {
    base = {
      background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)",
      border: "1px solid #facc15",
      color: "#78350f",
    };
  } else if (
    value === "in_progress" ||
    value === "ongoing" ||
    value === "active"
  ) {
    base = {
      background: "linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)",
      border: "1px solid #86efac",
      color: "#14532d",
    };
  }

  return isSelected
    ? {
        ...base,
        boxShadow:
          "0 0 0 2px rgba(37,99,235,0.22), 0 10px 20px rgba(15,23,42,0.12)",
      }
    : base;
}

function renderAddressText(job) {
  if (!job) return "-";
  const address =
    job.address ||
    job.serviceAddress ||
    job.customer?.address ||
    job.location ||
    "";
  return address || "-";
}

function formatAddress(job) {
  return renderAddressText(job);
}

/* =========================
   Styles
========================= */

const styles = {
  page: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  loadingCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 28,
    fontSize: 15,
    fontWeight: 600,
    color: "#334155",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },

  topBarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  monthRow: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  monthTitle: {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },

  subTitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  },

  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  navBtn: {
    border: "1px solid #dbe3ef",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
  },

  todayBtn: {
    border: "1px solid #dbe3ef",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },

  findTimeBtn: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
    boxShadow: "0 8px 18px rgba(37,99,235,0.22)",
  },

  filterRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  filterLeft: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  filterRight: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },

  filterSelect: {
    height: 42,
    borderRadius: 12,
    border: "1px solid #dbe3ef",
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    minWidth: 160,
    outline: "none",
  },

  timezoneNotice: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  },

  viewSwitcher: {
    display: "inline-flex",
    padding: 4,
    borderRadius: 14,
    background: "#eef2ff",
    gap: 4,
  },

  viewBtnActive: {
    border: "none",
    background: "#fff",
    color: "#1e3a8a",
    borderRadius: 10,
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
    boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
  },

  viewBtnMuted: {
    border: "none",
    background: "transparent",
    color: "#475569",
    borderRadius: 10,
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  },

  infoBar: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 14,
  },

  scheduleLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: 16,
    alignItems: "start",
  },

  calendarCard: {
    background: "#fff",
    borderRadius: 20,
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
    overflow: "hidden",
  },

  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  unscheduledCard: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 16,
  },

  unscheduledHeader: {
    marginBottom: 12,
  },

  unscheduledTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  unscheduledCount: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 22,
    height: 22,
    padding: "0 8px",
    borderRadius: 999,
    background: "#e2e8f0",
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 800,
  },

  unscheduledEmpty: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
  },

  unscheduledList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxHeight: 420,
    overflowY: "auto",
  },

  unscheduledItem: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
    cursor: "pointer",
    background: "#f8fafc",
  },

  unscheduledItemTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 4,
  },

  unscheduledItemMeta: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },

  placeholderCard: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 16,
  },

  placeholderTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 10,
  },

  placeholderText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: 700,
    marginBottom: 6,
  },

  placeholderSub: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  },

  monthWrap: {
    display: "flex",
    flexDirection: "column",
  },

  monthWeekdayHeaderRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  },

  monthWeekdayHeaderCell: {
    padding: "14px 10px",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
  },

  monthCell: {
    minHeight: 138,
    borderRight: "1px solid #eef2f7",
    borderBottom: "1px solid #eef2f7",
    padding: 10,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  monthCellMuted: {
    background: "#fbfcfe",
  },

  monthCellToday: {
    background: "#f8fbff",
  },

  monthCellHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  monthCellDate: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
  },

  monthCellDateToday: {
    background: "#2563eb",
    color: "#fff",
  },

  monthCellCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    background: "#e2e8f0",
    color: "#0f172a",
    fontSize: 11,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
  },

  monthCellBody: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    overflow: "hidden",
  },

  monthJobPill: {
    borderRadius: 10,
    padding: "6px 8px",
    fontSize: 12,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },

  monthJobTimeTiny: {
    flex: "0 0 auto",
    fontSize: 11,
    fontWeight: 800,
    opacity: 0.8,
  },

  monthJobNameTiny: {
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  moreJobsText: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    paddingLeft: 2,
  },

  monthHint: {
    padding: 12,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    borderTop: "1px solid #eef2f7",
    background: "#fafcff",
  },

  calendarHeader: {
    display: "grid",
    gridTemplateColumns: "72px minmax(0, 1fr)",
    borderBottom: "1px solid #e5e7eb",
    background: "#fff",
  },

  timeHeaderSpacer: {
    borderRight: "1px solid #eef2f7",
  },

  weekHeaderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
  },

  weekHeaderCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },

  singleDayHeaderCell: {
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  dayBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: 12,
    fontWeight: 800,
    padding: "6px 10px",
    margin: "14px auto 6px",
    width: "fit-content",
  },

  dayBadgeToday: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#2563eb",
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
    padding: "6px 10px",
    width: "fit-content",
  },

  dayDateText: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
    textAlign: "center",
  },

  dayVisitText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    textAlign: "center",
    paddingBottom: 12,
  },

  calendarBody: {
    display: "grid",
    gridTemplateColumns: "72px minmax(0, 1fr)",
    minHeight: 540,
  },

  timeColumn: {
    borderRight: "1px solid #eef2f7",
    background: "#fff",
    position: "relative",
  },

  anytimeLabel: {
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 800,
    borderBottom: "1px solid #eef2f7",
  },

  timeCell: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
    borderBottom: "1px solid #f1f5f9",
    boxSizing: "border-box",
  },

  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    background: "#fff",
  },

  singleDayGrid: {
    position: "relative",
    background: "#fff",
  },

  dayColumn: {
    position: "relative",
    borderRight: "1px solid #eef2f7",
    minHeight: 1384,
    background: "#fff",
  },

  dayColumnActive: {
    background: "#f8fbff",
  },

  gridHourRow: {
    borderBottom: "1px solid #f1f5f9",
    boxSizing: "border-box",
  },

  jobBlock: {
    position: "absolute",
    borderRadius: 12,
    padding: "8px 8px 7px",
    boxSizing: "border-box",
    cursor: "pointer",
    transition: "transform 0.15s ease",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
  },

  jobBlockDragging: {
    opacity: 0.6,
  },

  jobBlockInner: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  jobBlockTopRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  jobBlockCheck: {
    fontSize: 12,
    fontWeight: 900,
  },

  jobBlockTitle: {
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  jobBlockTime: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.9,
  },

  popoverBackdrop: {
    position: "fixed",
    inset: 0,
    background: "transparent",
    zIndex: 49,
  },

  jobPopover: {
    position: "absolute",
    width: 380,
    zIndex: 50,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    boxShadow: "0 24px 48px rgba(15,23,42,0.18)",
    padding: 18,
  },

  jobPopoverHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  jobPopoverGrip: {
    color: "#94a3b8",
    fontWeight: 900,
    letterSpacing: 2,
  },

  jobPopoverClose: {
    border: "none",
    background: "transparent",
    fontSize: 22,
    cursor: "pointer",
    color: "#64748b",
    lineHeight: 1,
  },

  jobPopoverTitle: {
    margin: "0 0 4px 0",
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
  },

  jobPopoverType: {
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 14,
  },

  completedRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
    marginBottom: 16,
  },

  popoverSection: {
    marginBottom: 16,
  },

  popoverLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 6,
  },

  popoverLink: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 700,
  },

  teamSelect: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: "1px solid #dbe3ef",
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    outline: "none",
  },

  popoverValueAddress: {
    fontSize: 14,
    color: "#334155",
    fontWeight: 600,
    lineHeight: 1.5,
  },

  popoverDateGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    paddingTop: 4,
    marginBottom: 18,
  },

  popoverValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 700,
    lineHeight: 1.5,
  },

  popoverFooter: {
    display: "flex",
    gap: 10,
  },

  editBtn: {
    flex: 1,
    border: "1px solid #dbe3ef",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    height: 42,
    cursor: "pointer",
    fontWeight: 800,
  },

  viewDetailBtn: {
    flex: 1,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 12,
    height: 42,
    cursor: "pointer",
    fontWeight: 800,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.32)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 60,
  },

  modalCard: {
    width: "min(980px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 22,
    boxShadow: "0 30px 60px rgba(15,23,42,0.24)",
    padding: 22,
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20,
  },

  modalTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
  },

  modalCloseBtn: {
    border: "none",
    background: "transparent",
    fontSize: 24,
    cursor: "pointer",
    color: "#64748b",
    lineHeight: 1,
  },

  modalTopGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 18,
  },

  formLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 6,
  },

  formInput: {
    width: "100%",
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid #dbe3ef",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
  },

  formTextarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 12,
    border: "1px solid #dbe3ef",
    padding: 14,
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    background: "#fff",
  },

  jobDetailsBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    background: "#f8fafc",
    padding: 16,
  },

  sideMiniTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 12,
  },

  jobDetailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #e2e8f0",
  },

  jobDetailKey: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 700,
    minWidth: 70,
  },

  jobDetailValue: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: 700,
    textAlign: "right",
    lineHeight: 1.45,
  },

  modalDivider: {
    height: 1,
    background: "#e5e7eb",
    margin: "22px 0",
  },

  modalMidGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },

  modalSectionTitle: {
    margin: "0 0 14px 0",
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },

  scheduleFieldsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },

  checkRow: {
    marginTop: 14,
  },

  checkboxLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
  },

  teamHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalNoticeBox: {
    marginTop: 20,
    background: "#fff7ed",
    border: "1px solid #fdba74",
    color: "#9a3412",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    fontWeight: 700,
  },

  modalFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 22,
  },

  modalFooterLeft: {
    display: "flex",
    gap: 10,
  },

  deleteBtn: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    borderRadius: 12,
    height: 42,
    padding: "0 16px",
    cursor: "pointer",
    fontWeight: 800,
  },

  cancelBtn: {
    border: "1px solid #dbe3ef",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    height: 42,
    padding: "0 16px",
    cursor: "pointer",
    fontWeight: 800,
  },

  saveBtn: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 12,
    height: 44,
    minWidth: 120,
    padding: "0 18px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 22px rgba(37,99,235,0.22)",
  },

  saveBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};