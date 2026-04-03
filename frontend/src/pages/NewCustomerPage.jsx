import { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

export default function NewCustomerPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    email: "",
    leadSource: "",

    street1: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",

    billingSameAsProperty: true,
    notes: "",
  });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  const personName = useMemo(() => {
    return [form.firstName, form.lastName]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
  }, [form.firstName, form.lastName]);

  const finalName = useMemo(() => {
    const person = personName.trim();
    const company = form.companyName.trim();

    if (person) return person;
    return company;
  }, [personName, form.companyName]);

  const finalAddress = useMemo(() => {
    return [
      form.street1.trim(),
      form.street2.trim(),
      [form.city.trim(), form.state.trim()].filter(Boolean).join(", "),
      [form.postalCode.trim(), form.country.trim()].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(" | ");
  }, [
    form.street1,
    form.street2,
    form.city,
    form.state,
    form.postalCode,
    form.country,
  ]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!finalName.trim()) {
      alert("Please enter a full name or company name.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API}/customers`,
        {
          name: finalName,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          title: form.title.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          companyName: form.companyName.trim(),
          leadSource: form.leadSource.trim(),
          address: finalAddress,
          street1: form.street1.trim(),
          street2: form.street2.trim(),
          city: form.city.trim(),
          province: form.state.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
          billingSameAsProperty: !!form.billingSameAsProperty,
          notes: form.notes?.trim() || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      navigate("/customers");
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="New Customer">
      <div style={styles.page}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>New Client</h1>
            <div style={styles.pageSub}>
              Create a new customer profile and property record.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.formWrap}>
          <section style={styles.section}>
            <div style={styles.sectionLeft}>
              <h2 style={styles.sectionTitle}>Primary contact details</h2>
              <p style={styles.sectionDesc}>
                Provide the main point of contact to ensure smooth communication
                and reliable client records.
              </p>
            </div>

            <div style={styles.sectionRight}>
              <div style={styles.row3}>
                <select
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>

                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  style={styles.input}
                />

                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  style={styles.input}
                />
              </div>

              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="Company name"
                style={styles.input}
              />

              <div style={styles.previewBox}>
                <div style={styles.previewLabel}>Saved customer name</div>
                <div style={styles.previewValue}>{finalName || "-"}</div>
              </div>

              <div style={styles.subSectionLabel}>Communication</div>

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone number"
                style={styles.input}
              />

              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                style={styles.input}
              />

              <input
                name="leadSource"
                value={form.leadSource}
                onChange={handleChange}
                placeholder="Lead source"
                style={styles.input}
              />
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionLeft}>
              <h2 style={styles.sectionTitle}>Service address</h2>
              <p style={styles.sectionDesc}>
                Save the service location so future jobs and scheduling stay organized.
              </p>
            </div>

            <div style={styles.sectionRight}>
              <input
                name="street1"
                value={form.street1}
                onChange={handleChange}
                placeholder="Street address 1"
                style={styles.input}
              />

              <input
                name="street2"
                value={form.street2}
                onChange={handleChange}
                placeholder="Street address 2"
                style={styles.input}
              />

              <div style={styles.row3}>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                  style={styles.input}
                />

                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="State / Province"
                  style={styles.input}
                />

                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="Postal code"
                  style={styles.input}
                />
              </div>

              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Country"
                style={styles.input}
              />
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionLeft}>
              <h2 style={styles.sectionTitle}>Notes</h2>
              <p style={styles.sectionDesc}>
                Capture any special access instructions, client preferences, or service notes.
              </p>
            </div>

            <div style={styles.sectionRight}>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  name="billingSameAsProperty"
                  checked={form.billingSameAsProperty}
                  onChange={handleChange}
                />
                <span>Billing address same as property</span>
              </label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Internal notes"
                rows={6}
                style={{ ...styles.input, ...styles.textarea }}
              />
            </div>
          </section>

          <div style={styles.footerActions}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => navigate("/customers")}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                ...styles.primaryBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: 20,
    paddingBottom: 28,
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },

  pageTitle: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.05,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },

  pageSub: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.6,
  },

  formWrap: {
    display: "grid",
    gap: 18,
  },

  section: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  sectionLeft: {
    paddingRight: 8,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 10,
  },

  sectionDesc: {
    margin: 0,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.7,
  },

  sectionRight: {
    display: "grid",
    gap: 14,
  },

  subSectionLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginTop: 4,
  },

  row3: {
    display: "grid",
    gridTemplateColumns: "160px 1fr 1fr",
    gap: 14,
  },

  input: {
    width: "100%",
    height: 46,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#0f172a",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  },

  textarea: {
    height: "auto",
    minHeight: 120,
    padding: "14px",
    resize: "vertical",
  },

  previewBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 14,
  },

  previewLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 8,
  },

  previewValue: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 600,
  },

  footerActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
  },

  primaryBtn: {
    padding: "12px 18px",
    border: "none",
    borderRadius: 14,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37,99,235,0.18)",
  },

  secondaryBtn: {
    padding: "12px 18px",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    background: "#fff",
    color: "#111827",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
};