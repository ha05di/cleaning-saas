export default function MonthView({ jobs, currentDate }) {
  const days = getMonthGrid(currentDate);

  return (
    <div style={styles.monthGrid}>
      {days.map((day, index) => (
        <div key={index} style={styles.dayCell}>
          <div style={styles.dayNumber}>{day.date.getDate()}</div>

          <div style={styles.jobsList}>
            {day.jobs.slice(0, 3).map((job) => (
              <div key={job.id} style={styles.jobItem}>
                {job.serviceTime || "Any"} {job.customer?.name}
              </div>
            ))}

            {day.jobs.length > 3 && (
              <div style={styles.more}>+{day.jobs.length - 3} more</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== helpers ===== */

function getMonthGrid(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const startDay = start.getDay();
  const totalDays = end.getDate();

  const grid = [];

  for (let i = 0; i < startDay; i++) {
    grid.push({ date: new Date(), jobs: [] });
  }

  for (let d = 1; d <= totalDays; d++) {
    const dayDate = new Date(date.getFullYear(), date.getMonth(), d);

    const dayJobs = jobs.filter(
      (j) =>
        j.serviceDate &&
        new Date(j.serviceDate).toDateString() === dayDate.toDateString()
    );

    grid.push({
      date: dayDate,
      jobs: dayJobs,
    });
  }

  return grid;
}

/* ===== styles ===== */

const styles = {
  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 1,
    background: "#e5e7eb",
    borderRadius: 16,
    overflow: "hidden",
  },

  dayCell: {
    background: "#fff",
    minHeight: 120,
    padding: 8,
  },

  dayNumber: {
    fontWeight: 800,
    marginBottom: 6,
  },

  jobsList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  jobItem: {
    fontSize: 12,
    padding: "2px 6px",
    borderRadius: 6,
    background: "#e0f2fe",
  },

  more: {
    fontSize: 11,
    color: "#64748b",
  },
};