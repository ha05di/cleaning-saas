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

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    const res = await axios.get(`${API}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCustomers(res.data.customers || []);
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Customer name is required");
      return;
    }

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
      fetchCustomers();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to save customer");
    }
  }

  function handleEdit(customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      address: "",
    });
  }

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const address = (c.address || "").toLowerCase();
      return (
        name.includes(q) || phone.includes(q) || address.includes(q)
      );
    });
  }, [customers, search]);

  return (
    <AppLayout title="Customers">
      <div style={styles.page}>
        <form onSubmit={handleSubmit} style={styles.formCard}>
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

          <button type="submit" style={styles.primaryBtn}>
            {editingId ? "Update Customer" : "Add Customer"}
          </button>

          {editingId && (
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </form>

        <div style={styles.searchCard}>
          <input
            style={styles.input}
            placeholder="Search by name, phone, or address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.resultCount}>
          {filteredCustomers.length} result
          {filteredCustomers.length === 1 ? "" : "s"}
        </div>

        <div style={styles.grid}>
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              style={styles.card}
              onClick={() => navigate(`/customers/${c.id}`)}
            >
              <div style={styles.name}>{c.name}</div>
              <div style={styles.meta}>{c.phone || "-"}</div>
              <div style={styles.meta}>{c.address || "-"}</div>

              <div style={styles.actions}>
                <button
                  style={styles.editBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(c);
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div style={styles.empty}>No customers found</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "20px",
  },
  formCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  searchCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
  },
  primaryBtn: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  secondaryBtn: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  resultCount: {
    color: "#6b7280",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gap: "14px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
    cursor: "pointer",
  },
  name: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  meta: {
    color: "#6b7280",
    marginBottom: "4px",
  },
  actions: {
    marginTop: "12px",
  },
  editBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
  },
  empty: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    color: "#6b7280",
  },
};