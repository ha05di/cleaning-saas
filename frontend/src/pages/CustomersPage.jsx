import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function CustomersPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
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

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Customer name is required");
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await axios.put(`${API}/customers/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API}/customers`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      resetForm();
      setShowCreatePanel(false);
      await fetchCustomers();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(customer) {
    setEditingId(customer.id);
    setShowCreatePanel(true);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      address: "",
    });
  }

  function handleNewCustomerClick() {
    resetForm();
    setShowCreatePanel((prev) => !prev);
  }

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const address = (c.address || "").toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        address.includes(q)
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
            {showCreatePanel
              ? editingId
                ? "Close Edit"
                : "Close"
              : "+ New Customer"}
          </button>
        </div>

        <div style={styles.kpiGrid}>
          <KpiCard label="Total Customers" value={stats.total} />
          <KpiCard label="With Phone" value={stats.withPhone} />
          <KpiCard label="With Address" value={stats.withAddress} />
          <KpiCard label="Missing Phone" value={stats.missingPhone} />
        </div>

        {showCreatePanel && (
          <div style={styles.createPanel}>
            <div style={styles.sectionTitle}>
              {editingId ? "Edit Customer" : "Create New Customer"}
            </div>
            <div style={styles.sectionSub}>
              {editingId
                ? "Update customer information."
                : "Add a new customer to your database."}
            </div>

            <form onSubmit={handleSubmit} style={styles.createGrid}>
              <input
                style={styles.input}
                name="name"
                placeholder="Customer Name"
                value={form.name}
                onChange={handleChange}
              />

              <input
                style={styles.input}
                name="phone"
                placeholder="Phone"
                value={form.phone}
                onChange={handleChange}
              />

              <input
                style={styles.input}
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
              />

              <button type="submit" style={styles.primaryBtn} disabled={loading}>
                {loading
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                  ? "Update Customer"
                  : "Create Customer"}
              </button>

              {editingId && (
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={() => {
                    resetForm();
                    setShowCreatePanel(false);
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        )}

        <div style={styles.searchBar}>
          <input
            style={styles.input}
            placeholder="Search by name, phone, or address"
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
                </div>

                <div style={styles.phoneCell}>
                  <div style={styles.cellMain}>
                    {customer.phone || "-"}
                  </div>
                </div>

                <div style={styles.addressCell}>
                  <div style={styles.cellMain}>
                    {customer.address || "-"}
                  </div>
                </div>

                <div style={styles.statusCell}>
                  <div style={customer.phone ? styles.greenBadge : styles.grayBadge}>
                    {customer.phone ? "Active" : "Incomplete"}
                  </div>
                </div>

                <div
                  style={styles.actionsCell}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CustomerActionMenu
                    customer={customer}
                    onEdit={() => handleEdit(customer)}
                    refresh={fetchCustomers}
                  />
                </div>
              </div>
            ))
          )}
        </div>
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

function CustomerActionMenu({ customer, onEdit, refresh }) {
  const token = localStorage.getItem("token");
  const [open, setOpen] = useState(false);

  async function remove() {
    const confirmed = window.confirm(
      `Delete customer "${customer.name}"?`
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API}/customers/${customer.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      refresh();
      setOpen(false);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to delete customer");
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        style={styles.menuBtn}
        onClick={() => setOpen((prev) => !prev)}
      >
        •••
      </button>

      {open && (
        <div style={styles.menu}>
          <button style={styles.menuItem} onClick={onEdit}>
            Edit
          </button>

          <button
            style={{ ...styles.menuItem, ...styles.menuDanger }}
            onClick={remove}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: 16,
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

  createPanel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
  },

  sectionSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 14,
  },

  createGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1.6fr auto auto",
    gap: 10,
    alignItems: "center",
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

  primaryBtn: {
    padding: "12px 14px",
    border: "none",
    borderRadius: 12,
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
  },

  secondaryBtn: {
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },

  tableWrap: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
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
    position: "absolute",
    right: 0,
    top: 46,
    minWidth: 160,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 8,
    display: "grid",
    gap: 4,
    boxShadow: "0 14px 30px rgba(15,23,42,0.12)",
    zIndex: 20,
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