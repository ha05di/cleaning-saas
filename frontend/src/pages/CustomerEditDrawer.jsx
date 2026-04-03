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

    const parsed = splitName(customer.name || "");
    const parsedAddress = parseAddress(customer);

    setForm({
      title: "",
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      companyName: customer.companyName || "",
      role: "",
      phone: customer.phone || "",
      email: customer.email || "",
      leadSource: customer.leadSource || "",
      street1: customer.street1 || parsedAddress.street1 || "",
      street2: customer.street2 || parsedAddress.street2 || "",
      city: customer.city || parsedAddress.city || "",
      province: customer.province || "",
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

  const finalName = useMemo(() => {
    const companyName = form.companyName.trim();
    const personName = [form.firstName, form.lastName]
      .map((v) => v.trim())
      .filter(Boolean)
      .join(" ");

    return companyName || personName;
  }, [form.companyName, form.firstName, form.lastName]);

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
      alert("Please enter a customer name or company name.");
      return;
    }

    try {
      setSaving(true);

      await axios.put(
        `${API}/customers/${customer.id}`,
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
          province: form.province.trim(),
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
                <option value="Australia">Australia</option>
                <option value="United States">United States</option>
                <option value="Singapore">Singapore</option>
              </select>
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Additional client details</h3>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add notes"
              rows={5}
              style={styles.textarea}
            />
          </section>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? "Updating..." : "Update Client"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

function splitName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return {
      firstName: parts[0] || "",
      lastName: "",
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.slice(-1).join(""),
  };
}

function parseAddress(customer) {
  const address = customer?.address || "";
  const parts = address.split("|").map((p) => p.trim());

  return {
    street1: parts[0] || "",
    street2: parts[1] || "",
    city: "",
  };
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.28)",
    zIndex: 9998,
  },

  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    height: "100vh",
    width: "min(640px, 100vw)",
    background: "#fff",
    boxShadow: "-20px 0 50px rgba(15,23,42,0.16)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
  },

  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "28px 28px 18px",
    borderBottom: "1px solid #e5e7eb",
    flexShrink: 0,
  },

  drawerTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 850,
    color: "#0f172a",
  },

  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: 24,
    cursor: "pointer",
    color: "#475569",
    lineHeight: 1,
  },

  form: {
    padding: 28,
    overflowY: "auto",
    display: "grid",
    gap: 28,
  },

  section: {
    display: "grid",
    gap: 14,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: "#0f172a",
  },

  sectionText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    color: "#64748b",
  },

  row3: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 1fr",
    gap: 0,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    overflow: "hidden",
  },

  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 0,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    overflow: "hidden",
  },

  input: {
    width: "100%",
    minHeight: 50,
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: 15,
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: 110,
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    background: "#fff",
    fontSize: 15,
    color: "#111827",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 8,
  },

  cancelBtn: {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },

  saveBtn: {
    border: "none",
    background: "#2f7d1f",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
  },
};