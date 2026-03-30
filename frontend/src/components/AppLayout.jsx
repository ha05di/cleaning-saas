import { NavLink, useNavigate } from "react-router-dom";

export default function AppLayout({ title, children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo}>Cleaning SaaS</div>

          <nav style={styles.nav}>
            <SidebarLink to="/dashboard" label="Dashboard" />
            <SidebarLink to="/schedule" label="Schedule" />
            <SidebarLink to="/customers" label="Customers" />
            <SidebarLink to="/cleaners" label="Cleaners" />
            <SidebarLink to="/jobs" label="Jobs" />
          </nav>
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.userBox}>
            <div style={styles.userEmail}>{user.email || "User"}</div>
            <div style={styles.userCompany}>{user.companyName || ""}</div>
          </div>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.pageTitle}>{title}</h1>
        </div>

        <div>{children}</div>
      </main>
    </div>
  );
}

function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...styles.link,
        ...(isActive ? styles.linkActive : {}),
      })}
    >
      {label}
    </NavLink>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#f3f4f6",
  },
  sidebar: {
    width: "240px",
    height: "100vh",
    position: "sticky",
    top: 0,
    background: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    padding: "20px 16px",
  },
  sidebarTop: {
    display: "flex",
    flexDirection: "column",
  },
  logo: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "24px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  link: {
    padding: "12px 14px",
    borderRadius: "10px",
    color: "#374151",
    fontWeight: "500",
  },
  linkActive: {
    background: "#2563eb",
    color: "#ffffff",
  },
  sidebarFooter: {
    marginTop: "auto",
  },
  userBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "12px",
  },
  userEmail: {
    fontWeight: "600",
    fontSize: "14px",
  },
  userCompany: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#6b7280",
  },
  logoutBtn: {
    width: "100%",
    padding: "11px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: "28px",
  },
  topbar: {
    marginBottom: "24px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "700",
  },
};