import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

const INITIAL_FORM = {
  title: "",
  firstName: "",
  lastName: "",
  companyName: "",
  role: "",
  phone: "",
  email: "",
  leadSource: "",
  street1: "",
  street2: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Malaysia",
  notes: "",
};

export default function CustomerEditDrawer({
  open,
  customer,
  onClose,
  onSaved,
}) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !customer) return;

    const parsed = splitName(customer);

    setForm({
      title: customer.title || "",
      firstName: customer.firstName || parsed.firstName,
      lastName: customer.lastName || parsed.lastName,
      companyName: customer.companyName || "",
      role: customer.role || "",
      phone: customer.phone || "",
      email: customer.email || "",
      leadSource: customer.leadSource || "",
      street1: customer.street1 || "",
      street2: customer.street2 || "",
      city: customer.city || "",
      province: customer.province || customer.state || "",
      postalCode: customer.postalCode || "",
      country: customer.country || "Malaysia",
      notes: customer.notes || "",
    });
  }, [open, customer]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const personName = useMemo(() => {
    return [form.firstName, form.lastName]
      .map((v) => v.trim())
      .filter(Boolean)
      .join(" ");
  }, [form.firstName, form.lastName]);

  const finalName = useMemo(() => {
    const person = personName.trim();
    const companyName = form.companyName.trim();

    return person || companyName;
  }, [personName, form.companyName]);

  const finalAddress = useMemo(() => {
    return [
      form.street1.trim(),
      form.street2.trim(),
      [form.city.trim(), form.province.trim()].filter(Boolean).join(", "),
      [form.postalCode.trim(), form.country.trim()].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(" | ");
  }, [
    form.street1,
    form.street2,
    form.city,
    form.province,
    form.postalCode,
    form.country,
  ]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!customer?.id) return;

    if (!finalName.trim()) {
      alert("Please enter a full name or company name.");
      return;
    }

    try {
      setSaving(true);

      await axios.put(
        `${API}/customers/${customer.id}`,
        {
          name: finalName,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          title: form.title.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          companyName: form.companyName.trim(),
          role: form.role.trim(),
          leadSource: form.leadSource.trim(),
          address: finalAddress,
          street1: form.street1.trim(),
          street2: form.street2.trim(),
          city: form.city.trim(),
          province: form.province.trim(),
          state: form.province.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
          notes: form.notes.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await onSaved();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to update customer");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !customer) return null;

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />

      <aside style={styles.drawer}>
        <div style={styles.drawerHeader}>
          <h2 style={styles.drawerTitle}>Edit Client</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Primary contact details</h3>
            <p style={styles.sectionText}>
              Provide the main point of contact to ensure smooth communication
              and reliable client records.
            </p>

            <div style={styles.row3}>
              <select
                name="title"
                value={form.title}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Title</option>
                <option value="Mr">Mr.</option>
                <option value="Mrs">Mrs.</option>
                <option value="Ms">Ms.</option>
                <option value="Dr">Dr.</option>
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

            <input
              name="role"
              value={form.role}
              onChange={handleChange}
              placeholder="Role"
              style={styles.input}
            />

            <div style={styles.previewBox}>
              <div style={styles.previewLabel}>Saved customer name</div>
              <div style={styles.previewValue}>{finalName || "-"}</div>
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Communication</h3>

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
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Lead information</h3>

            <input
              name="leadSource"
              value={form.leadSource}
              onChange={handleChange}
              placeholder="Lead source"
              style={styles.input}
            />
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Property address</h3>
            <p style={styles.sectionText}>
              Enter the primary service and billing address.
            </p>

            <input
              name="street1"
              value={form.street1}
              onChange={handleChange}
              placeholder="Street 1"
              style={styles.input}
            />

            <input
              name="street2"
              value={form.street2}
              onChange={handleChange}
              placeholder="Street 2"
              style={styles.input}
            />

            <div style={styles.row2}>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                style={styles.input}
              />

              <input
                name="province"
                value={form.province}
                onChange={handleChange}
                placeholder="Province"
                style={styles.input}
              />
            </div>

            <div style={styles.row2}>
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                placeholder="Postal code"
                style={styles.input}
              />

              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="Malaysia">Malaysia</option>
                <option value="Singapore">Singapore</option>
                <option value="Australia">Australia</option>
                <option value="United States">United States</option>
              </select>
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Notes</h3>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Internal notes"
              rows={5}
              style={{ ...styles.input, ...styles.textarea }}
            />
          </section>

          <div style={styles.footer}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={styles.saveBtn}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

function splitName(customer) {
  const first = (customer?.firstName || "").trim();
  const last = (customer?.lastName || "").trim();

  if (first || last) {
    return {
      firstName: first,
      lastName: last,
    };
  }

  const rawName = (customer?.name || "").trim();
  const company = (customer?.companyName || "").trim();

  if (!rawName || (company && rawName.toLowerCase() === company.toLowerCase())) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const parts = rawName.split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] || "",
      lastName: "",
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.slice(-1).join(" "),
  };
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.28)",
    zIndex: 80,
  },

  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "min(760px, 100vw)",
    height: "100vh",
    background: "#ffffff",
    zIndex: 81,
    boxShadow: "-24px 0 60px rgba(15,23,42,0.18)",
    display: "flex",
    flexDirection: "column",
  },

  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 24px",
    borderBottom: "1px solid #e5e7eb",
  },

  drawerTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 900,
    color: "#0f172a",
  },

  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
  },

  form: {
    padding: 24,
    overflowY: "auto",
    display: "grid",
    gap: 18,
  },

  section: {
    display: "grid",
    gap: 14,
    padding: 18,
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    background: "#ffffff",
  },

  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
  },

  sectionText: {
    margin: 0,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },

  row3: {
    display: "grid",
    gridTemplateColumns: "140px 1fr 1fr",
    gap: 12,
  },

  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
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
    padding: 14,
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

  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    paddingBottom: 8,
  },

  cancelBtn: {
    padding: "12px 18px",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    background: "#fff",
    color: "#111827",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },

  saveBtn: {
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
};