import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import CustomerEditDrawer from "./CustomerEditDrawer";

const API = API_BASE_URL;

export default function CustomersPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [menuState, setMenuState] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    function handleWindowClick() {
      setMenuState(null);
    }

    function handleWindowScroll() {
      setMenuState(null);
    }

    function handleWindowResize() {
      setMenuState(null);
    }

    document.addEventListener("click", handleWindowClick);
    window.addEventListener("scroll", handleWindowScroll, true);
    window.addEventListener("resize", handleWindowResize);

    return () => {
      document.removeEventListener("click", handleWindowClick);
      window.removeEventListener("scroll", handleWindowScroll, true);
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  async function fetchCustomers() {
    try {
      const res = await axios.get(`${API}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(res.data.customers || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to fetch customers");
    }
  }

  function openMenu(e, customer) {
    e.stopPropagation();

    if (menuState?.id === customer.id) {
      setMenuState(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 110;

    let left = rect.right - menuWidth;
    let top = rect.bottom + 8;

    if (left < 12) left = 12;
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    if (top + menuHeight > window.innerHeight - 12) {
      top = rect.top - menuHeight - 8;
    }

    setMenuState({
      id: customer.id,
      customer,
      top,
      left,
    });
  }

  function handleEdit(customer) {
    setEditingCustomer(customer);
    setDrawerOpen(true);
    setMenuState(null);
  }

  async function handleDelete(customer) {
    const confirmed = window.confirm(`Delete customer "${customer.name}"?`);
    if (!confirmed) return;

    try {
      await axios.delete(`${API}/customers/${customer.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuState(null);
      await fetchCustomers();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to delete customer");
    }
  }

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const address = (c.address || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const companyName = (c.companyName || "").toLowerCase();
      const leadSource = (c.leadSource || "").toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        address.includes(q) ||
        email.includes(q) ||
        companyName.includes(q) ||
        leadSource.includes(q)
      );
    });
  }, [customers, search]);

  const stats = {
    total: customers.length,
    withPhone: customers.filter((c) => !!c.phone?.trim()).length,
    withAddress: customers.filter((c) => !!c.address?.trim()).length,
    missingPhone: customers.filter((c) => !c.phone?.trim()).length,
  };

  return (
    <AppLayout title="Customers">
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Customers</h1>
            <div style={styles.subtitle}>
              Manage customer records and contact details.
            </div>
          </div>

          <button
            style={styles.newBtn}
            onClick={() => navigate("/customers/new")}
          >
            + New Customer
          </button>
        </div>

        <div style={styles.kpiGrid}>
          <KpiCard label="Total Customers" value={stats.total} />
          <KpiCard label="With Phone" value={stats.withPhone} />
          <KpiCard label="With Address" value={stats.withAddress} />
          <KpiCard label="Missing Phone" value={stats.missingPhone} />
        </div>

        <div style={styles.searchBar}>
          <input
            style={styles.input}
            placeholder="Search by name, phone, address, email or lead source"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.tableWrap}>
          <div style={styles.tableHeader}>
            <div>Name</div>
            <div>Phone</div>
            <div>Address</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div style={styles.emptyRow}>
              <div style={styles.emptyTitle}>No customers found</div>
              <div style={styles.emptySub}>
                Try changing search terms or create a new customer.
              </div>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                style={styles.tableRow}
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <div style={styles.nameCell}>
                  <div style={styles.nameMain}>
                    {customer.name || "Unnamed Customer"}
                  </div>
                  {!!customer.companyName && (
                    <div style={styles.nameSub}>{customer.companyName}</div>
                  )}
                </div>

                <div style={styles.phoneCell}>
                  <div style={styles.cellMain}>{customer.phone || "-"}</div>
                </div>

                <div style={styles.addressCell}>
                  <div style={styles.cellMain}>{customer.address || "-"}</div>
                </div>

                <div style={styles.statusCell}>
                  <div
                    style={customer.phone ? styles.greenBadge : styles.grayBadge}
                  >
                    {customer.phone ? "Active" : "Incomplete"}
                  </div>
                </div>

                <div
                  style={styles.actionsCell}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    style={styles.menuBtn}
                    onClick={(e) => openMenu(e, customer)}
                  >
                    •••
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {menuState && (
          <div
            style={{
              ...styles.menu,
              position: "fixed",
              top: menuState.top,
              left: menuState.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={styles.menuItem}
              onClick={() => handleEdit(menuState.customer)}
            >
              Edit
            </button>

            <button
              style={{ ...styles.menuItem, ...styles.menuDanger }}
              onClick={() => handleDelete(menuState.customer)}
            >
              Delete
            </button>
          </div>
        )}

        <CustomerEditDrawer
          open={drawerOpen}
          customer={editingCustomer}
          onClose={() => {
            setDrawerOpen(false);
            setEditingCustomer(null);
          }}
          onSaved={async () => {
            await fetchCustomers();
            setDrawerOpen(false);
            setEditingCustomer(null);
          }}
        />
      </div>
    </AppLayout>
  );
}

function KpiCard({ label, value }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: 16,
    paddingBottom: 24,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.05,
    fontWeight: 850,
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  subtitle: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 14,
  },

  newBtn: {
    padding: "12px 16px",
    border: "none",
    borderRadius: 12,
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },

  kpiCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  kpiLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: 700,
  },

  kpiValue: {
    fontSize: 28,
    fontWeight: 850,
    color: "#111827",
  },

  searchBar: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 12,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  input: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    minWidth: 0,
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },

  tableWrap: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
    overflow: "hidden",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr 1.6fr 0.9fr 90px",
    gap: 18,
    padding: "16px 18px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr 1.6fr 0.9fr 90px",
    gap: 18,
    padding: "18px 18px",
    borderBottom: "1px solid #f1f5f9",
    alignItems: "center",
    cursor: "pointer",
  },

  nameCell: {
    minWidth: 0,
  },

  nameMain: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },

  nameSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },

  phoneCell: {
    minWidth: 0,
  },

  addressCell: {
    minWidth: 0,
  },

  cellMain: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    lineHeight: 1.45,
    wordBreak: "break-word",
  },

  statusCell: {
    display: "flex",
    alignItems: "center",
  },

  actionsCell: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  menuBtn: {
    width: 40,
    height: 40,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 16,
    color: "#111827",
  },

  menu: {
    minWidth: 180,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 8,
    display: "grid",
    gap: 4,
    boxShadow: "0 14px 30px rgba(15,23,42,0.12)",
    zIndex: 9999,
  },

  menuItem: {
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    cursor: "pointer",
  },

  menuDanger: {
    color: "#dc2626",
  },

  greenBadge: {
    background: "#dcfce7",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
    width: "fit-content",
  },

  grayBadge: {
    background: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
    width: "fit-content",
  },

  emptyRow: {
    padding: "28px 18px",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
  },

  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: "#6b7280",
  },
};