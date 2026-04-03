import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function AppLayout({ title, children }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const [companySettings, setCompanySettings] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  async function fetchCompanySettings() {
    try {
      setLoadingCompany(true);

      const res = await axios.get(`${API}/api/settings/company`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.settings) {
        setCompanySettings(res.data.settings);
      }
    } catch (error) {
      console.error("Failed to load company settings for sidebar:", error);
      setCompanySettings(null);
    } finally {
      setLoadingCompany(false);
    }
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Owner";

  const displayRole = "Owner";

  const companyName =
    companySettings?.companyName ||
    user?.user_metadata?.business_name ||
    user?.user_metadata?.company_name ||
    "Your Company";

  const displayEmail =
    companySettings?.email ||
    user?.email ||
    "owner@example.com";

  const displayPhone =
    companySettings?.phone || "";

  const avatarLetter = useMemo(() => {
    return displayName?.charAt(0)?.toUpperCase() || "U";
  }, [displayName]);

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.brandBlock}>
            <div style={styles.logo}>UrbanFlow</div>
            <div style={styles.logoSub}>Cleaning business ops</div>
          </div>

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
            <div style={styles.userTopRow}>
              <div style={styles.avatar}>{avatarLetter}</div>

              <div style={styles.userMeta}>
                <div style={styles.userName}>{displayName}</div>
                <div style={styles.userRole}>{displayRole}</div>
              </div>
            </div>

            <div style={styles.companyCard}>
              <div style={styles.companyLabel}>Company</div>

              <div style={styles.companyValue}>
                {loadingCompany ? "Loading company..." : companyName}
              </div>

              <div style={styles.userEmail}>{displayEmail}</div>

              {displayPhone ? (
                <div style={styles.userPhone}>{displayPhone}</div>
              ) : null}
            </div>
          </div>

          <NavLink
            to="/settings/company"
            style={({ isActive }) => ({
              ...styles.secondaryBtn,
              ...(isActive ? styles.secondaryBtnActive : {}),
            })}
          >
            Company Settings
          </NavLink>

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
    background: "#f5f7fb",
  },

  sidebar: {
    width: "250px",
    minWidth: "250px",
    height: "100vh",
    position: "sticky",
    top: 0,
    background: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    padding: "18px 14px",
    boxSizing: "border-box",
  },

  sidebarTop: {
    display: "flex",
    flexDirection: "column",
  },

  brandBlock: {
    padding: "8px 8px 18px 8px",
  },

  logo: {
    fontSize: "28px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0f172a",
    marginBottom: "4px",
  },

  logoSub: {
    fontSize: "13px",
    color: "#64748b",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "8px",
  },

  link: {
    padding: "13px 14px",
    borderRadius: "12px",
    color: "#334155",
    fontWeight: 600,
    fontSize: "15px",
    textDecoration: "none",
    transition: "all 0.18s ease",
  },

  linkActive: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    boxShadow: "0 8px 24px rgba(37, 99, 235, 0.18)",
  },

  sidebarFooter: {
    marginTop: "auto",
  },

  userBox: {
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
    marginBottom: "12px",
  },

  userTopRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "16px",
    flexShrink: 0,
  },

  userMeta: {
    minWidth: 0,
  },

  userName: {
    fontWeight: 700,
    fontSize: "14px",
    color: "#0f172a",
    lineHeight: 1.2,
    wordBreak: "break-word",
  },

  userRole: {
    marginTop: "4px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#2563eb",
    background: "#dbeafe",
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "999px",
  },

  companyCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
  },

  companyLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "6px",
  },

  companyValue: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "4px",
    wordBreak: "break-word",
    lineHeight: 1.35,
  },

  userEmail: {
    fontSize: "12px",
    color: "#64748b",
    wordBreak: "break-word",
    lineHeight: 1.4,
  },

  userPhone: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#64748b",
    wordBreak: "break-word",
    lineHeight: 1.4,
  },

  secondaryBtn: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    marginBottom: "10px",
    borderRadius: "12px",
    background: "#ffffff",
    border: "1px solid #dbe2ea",
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 700,
    textAlign: "center",
    transition: "all 0.18s ease",
  },

  secondaryBtnActive: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
  },

  logoutBtn: {
    width: "100%",
    padding: "12px 14px",
    border: "none",
    borderRadius: "12px",
    background: "#0f172a",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
  },

  main: {
    flex: 1,
    padding: "28px",
    minWidth: 0,
  },

  topbar: {
    marginBottom: "24px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0f172a",
  },
};