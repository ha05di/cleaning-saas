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

  const finalName = useMemo(() => {
    const company = form.companyName.trim();
    const person = [form.firstName, form.lastName]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");

    if (company) return company;
    return person;
  }, [form.companyName, form.firstName, form.lastName]);

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
      alert("Please enter a customer name or company name.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API}/customers`,
        {
          name: finalName,
          phone: form.phone.trim(),
          email: form.email.trim(),
          companyName: form.companyName.trim(),
          leadSource: form.leadSource.trim(),
          address: finalAddress,
          street1: form.street1.trim(),
          street2: form.street2.trim(),
          city: form.city.trim(),
          province: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
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
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add notes"
                style={styles.textarea}
                rows={6}
              />
            </div>
          </section>

          <div style={styles.footerActions}>
            <button
              type="button"
              onClick={() => navigate("/customers")}
              style={styles.secondaryBtn}
            >
              Cancel
            </button>

            <button type="submit" style={styles.primaryBtn} disabled={loading}>
              {loading ? "Saving..." : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

const styles = {
  page: { display: "grid", gap: "24px", paddingBottom: "24px" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" },
  pageTitle: { margin: 0, fontSize: "40px", lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A" },
  pageSub: { marginTop: "10px", color: "#475467", fontSize: "18px", lineHeight: 1.5 },
  formWrap: { display: "grid", gap: "18px" },
  section: { display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: "18px", background: "#fff", border: "1px solid #D0D5DD", borderRadius: "20px", padding: "22px", boxShadow: "0 2px 8px rgba(16,24,40,0.04)" },
  sectionLeft: { paddingRight: "8px" },
  sectionRight: { display: "grid", gap: "14px" },
  sectionTitle: { margin: 0, fontSize: "20px", fontWeight: 800, color: "#101828" },
  sectionDesc: { margin: "10px 0 0 0", color: "#667085", lineHeight: 1.6, fontSize: "15px" },
  subSectionLabel: { marginTop: "4px", fontSize: "13px", fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" },
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" },
  input: { width: "100%", height: "50px", border: "1px solid #D0D5DD", borderRadius: "12px", background: "#fff", color: "#101828", padding: "0 14px", fontSize: "15px", outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", border: "1px solid #D0D5DD", borderRadius: "12px", background: "#fff", color: "#101828", padding: "14px", fontSize: "15px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  footerActions: { display: "flex", justifyContent: "flex-end", gap: "12px" },
  primaryBtn: { border: "none", background: "#2563EB", color: "#fff", borderRadius: "12px", padding: "14px 20px", fontWeight: 700, fontSize: "15px", cursor: "pointer" },
  secondaryBtn: { border: "1px solid #D0D5DD", background: "#fff", color: "#344054", borderRadius: "12px", padding: "14px 20px", fontWeight: 700, fontSize: "15px", cursor: "pointer" },
};