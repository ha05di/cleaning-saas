import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function CleanersPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [cleaners, setCleaners] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [actionMenu, setActionMenu] = useState(null);
  const actionBtnRefs = useRef({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function handleClickOutside() {
      setActionMenu(null);
    }

    function handleScroll() {
      if (actionMenu) {
        setActionMenu(null);
      }
    }

    function handleResize() {
      if (actionMenu) {
        setActionMenu(null);
      }
    }

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [actionMenu]);

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([fetchCleaners(), fetchJobs()]);
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
      alert(error?.response?.data?.error || "Failed to fetch cleaners");
    }
  }

  async function fetchJobs() {
    try {
      const res = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data.jobs || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to fetch jobs");
    }
  }

  function getInitial(name = "") {
    return name.trim()?.charAt(0)?.toUpperCase() || "?";
  }

  function getAssignedJobs(cleanerId) {
    return jobs.filter((job) => {
      const assignedCleanerId =
        job.cleanerId ?? job.cleaner_id ?? job.assignedCleanerId;
      return String(assignedCleanerId) === String(cleanerId);
    });
  }

  function getActiveAssignedJobs(cleanerId) {
    return getAssignedJobs(cleanerId).filter((job) =>
      ["assigned", "scheduled", "in_progress"].includes(
        String(job.status || "").toLowerCase()
      )
    );
  }

  function getWorkload(cleanerId) {
    const count = getActiveAssignedJobs(cleanerId).length;

    if (count === 0) {
      return {
        label: "Idle",
        text: "#667085",
        bg: "#F2F4F7",
        border: "#EAECF0",
      };
    }

    if (count <= 2) {
      return {
        label: "Busy",
        text: "#175CD3",
        bg: "#EFF8FF",
        border: "#B2DDFF",
      };
    }

    return {
      label: "Full",
      text: "#B42318",
      bg: "#FEF3F2",
      border: "#FECDCA",
    };
  }

  function getStatusStyle(status) {
    const value = String(status || "inactive").toLowerCase();

    if (value === "active") {
      return {
        label: "Active",
        text: "#067647",
        bg: "#ECFDF3",
        border: "#ABEFC6",
      };
    }

    return {
      label: "Inactive",
      text: "#B42318",
      bg: "#FEF3F2",
      border: "#FECDCA",
    };
  }

  function toggleActionMenu(e, cleanerId) {
    e.stopPropagation();

    if (actionMenu?.id === cleanerId) {
      setActionMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    const menuWidth = 170;
    const menuHeight = 56;

    let left = rect.right - menuWidth;
    let top = rect.bottom + 8;

    if (left < 12) left = 12;
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    if (top + menuHeight > window.innerHeight - 12) {
      top = rect.top - menuHeight - 8;
    }

    setActionMenu({
      id: cleanerId,
      top,
      left,
    });
  }

  const filteredCleaners = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cleaners;

    return cleaners.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const team = (c.team || "").toLowerCase();
      const notes = (c.notes || "").toLowerCase();
      const status = (c.status || "").toLowerCase();
      const workload = getWorkload(c.id).label.toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        team.includes(q) ||
        notes.includes(q) ||
        status.includes(q) ||
        workload.includes(q)
      );
    });
  }, [cleaners, search, jobs]);

  const activeCount = cleaners.filter(
    (c) => String(c.status || "").toLowerCase() === "active"
  ).length;

  const idleCount = cleaners.filter(
    (c) => getWorkload(c.id).label === "Idle"
  ).length;

  const inactiveCount = cleaners.filter(
    (c) => String(c.status || "").toLowerCase() !== "active"
  ).length;

  return (
    <AppLayout title="Cleaners">
      <div style={styles.page}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>Manage team</h1>
            <p style={styles.pageSubtitle}>
              Add or manage team members that handle jobs in the field. Dispatch
              them to job sites and keep cleaner records organized in one place.
            </p>
          </div>

          <button
            style={styles.primaryBtn}
            onClick={() => navigate("/cleaners/new")}
          >
            Add Cleaner
          </button>
        </div>

        <div style={styles.toolbar}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              style={styles.searchInput}
              placeholder="Search by name, email, phone, team, status or workload"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.contentGrid}>
          <div style={styles.tableCard}>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: "34%" }}>NAME</th>
                    <th style={{ ...styles.th, width: "22%" }}>EMAIL</th>
                    <th style={{ ...styles.th, width: "14%" }}>PHONE</th>
                    <th style={{ ...styles.th, width: "12%" }}>TEAM</th>
                    <th style={{ ...styles.th, width: "10%" }}>STATUS</th>
                    <th style={{ ...styles.th, width: "8%", textAlign: "right" }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={styles.emptyTd}>
                        Loading cleaners...
                      </td>
                    </tr>
                  ) : filteredCleaners.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={styles.emptyTd}>
                        No cleaners found
                      </td>
                    </tr>
                  ) : (
                    filteredCleaners.map((cleaner) => {
                      const status = getStatusStyle(cleaner.status);
                      const workload = getWorkload(cleaner.id);
                      const activeJobs = getActiveAssignedJobs(cleaner.id).length;

                      return (
                        <tr key={cleaner.id}>
                          <td style={styles.td}>
                            <div style={styles.nameCell}>
                              <div style={styles.avatar}>
                                {getInitial(cleaner.name)}
                              </div>

                              <div>
                                <div style={styles.nameText}>
                                  {cleaner.name || "-"}
                                </div>
                                <div style={styles.subText}>
                                  {workload.label} • {activeJobs} active job
                                  {activeJobs === 1 ? "" : "s"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={styles.td}>
                            <div style={styles.cellText}>
                              {cleaner.email || "-"}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <div style={styles.cellText}>
                              {cleaner.phone || "-"}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <div style={styles.cellText}>
                              {cleaner.team || "-"}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.badge,
                                color: status.text,
                                background: status.bg,
                                borderColor: status.border,
                              }}
                            >
                              {status.label}
                            </span>
                          </td>

                          <td style={{ ...styles.td, textAlign: "right" }}>
                            <div style={styles.actionWrap}>
                              <button
                                ref={(el) => {
                                  actionBtnRefs.current[cleaner.id] = el;
                                }}
                                style={styles.dotsBtn}
                                onClick={(e) => toggleActionMenu(e, cleaner.id)}
                              >
                                •••
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.sidePanel}>
            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>ACTIVE CLEANERS</div>
              <div style={styles.sidePill}>
                {activeCount} of {cleaners.length}
              </div>
            </div>

            <div style={styles.miniCard}>
              <div style={styles.miniLabel}>Idle cleaners</div>
              <div style={styles.miniValue}>{idleCount}</div>
            </div>

            <div style={styles.miniCard}>
              <div style={styles.miniLabel}>Inactive cleaners</div>
              <div style={styles.miniValue}>{inactiveCount}</div>
            </div>

            <div style={styles.miniCard}>
              <div style={styles.miniLabel}>Search results</div>
              <div style={styles.miniValue}>{filteredCleaners.length}</div>
            </div>
          </div>
        </div>

        {actionMenu && (
          <div
            style={{
              ...styles.menu,
              position: "fixed",
              top: actionMenu.top,
              left: actionMenu.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={styles.menuItem}
              onClick={() => {
                const cleaner = filteredCleaners.find((c) => c.id === actionMenu.id);
                setActionMenu(null);
                navigate(`/cleaners/${actionMenu.id}`, {
                  state: { cleaner },
                });
              }}
            >
              View / Edit
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "24px",
    paddingBottom: "24px",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
  },
  pageTitle: {
    margin: 0,
    fontSize: "44px",
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "#0F172A",
  },
  pageSubtitle: {
    margin: "12px 0 0 0",
    fontSize: "20px",
    lineHeight: 1.55,
    color: "#475467",
    maxWidth: "900px",
  },

  primaryBtn: {
    border: "none",
    background: "#3B8218",
    color: "#fff",
    borderRadius: "12px",
    padding: "14px 22px",
    fontWeight: 700,
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(16,24,40,0.08)",
  },

  toolbar: {
    display: "flex",
    justifyContent: "flex-start",
  },
  searchWrap: {
    width: "100%",
    maxWidth: "560px",
    background: "#fff",
    border: "1px solid #D0D5DD",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 14px",
    height: "54px",
  },
  searchIcon: {
    color: "#667085",
    fontSize: "18px",
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
    color: "#101828",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: "18px",
    alignItems: "start",
  },

  tableCard: {
    background: "#fff",
    border: "1px solid #D0D5DD",
    borderRadius: "18px",
    boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "980px",
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    textAlign: "left",
    fontSize: "13px",
    fontWeight: 800,
    color: "#344054",
    padding: "18px 20px",
    borderBottom: "1px solid #D0D5DD",
    background: "#FCFCFD",
    letterSpacing: "0.02em",
  },
  td: {
    padding: "18px 20px",
    borderBottom: "1px solid #EAECF0",
    verticalAlign: "middle",
  },
  emptyTd: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#667085",
    fontSize: "15px",
  },

  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    background: "#163B4D",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "16px",
    flexShrink: 0,
  },
  nameText: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#101828",
    marginBottom: "4px",
  },
  subText: {
    fontSize: "14px",
    color: "#667085",
  },
  cellText: {
    fontSize: "15px",
    color: "#101828",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "28px",
    padding: "0 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    border: "1px solid",
    whiteSpace: "nowrap",
  },

  actionWrap: {
    display: "inline-block",
  },
  dotsBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "20px",
    fontWeight: 700,
    color: "#344054",
    padding: "4px 8px",
    borderRadius: "10px",
  },
  menu: {
    minWidth: "170px",
    background: "#fff",
    border: "1px solid #EAECF0",
    borderRadius: "12px",
    boxShadow: "0 14px 30px rgba(16,24,40,0.12)",
    overflow: "hidden",
    zIndex: 9999,
  },
  menuItem: {
    width: "100%",
    border: "none",
    background: "#fff",
    textAlign: "left",
    padding: "12px 14px",
    fontSize: "14px",
    color: "#101828",
    cursor: "pointer",
  },

  sidePanel: {
    display: "grid",
    gap: "14px",
  },
  sideCard: {
    background: "#fff",
    border: "1px solid #D0D5DD",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  sideTitle: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#163B4D",
    letterSpacing: "0.02em",
  },
  sidePill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "34px",
    borderRadius: "999px",
    padding: "0 12px",
    background: "#FEF3F2",
    color: "#B42318",
    fontSize: "13px",
    fontWeight: 700,
    border: "1px solid #FECDCA",
    whiteSpace: "nowrap",
  },
  miniCard: {
    background: "#fff",
    border: "1px solid #D0D5DD",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
  },
  miniLabel: {
    fontSize: "13px",
    color: "#667085",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    fontWeight: 700,
  },
  miniValue: {
    fontSize: "30px",
    fontWeight: 800,
    color: "#101828",
    lineHeight: 1,
  },
};