import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  avatarUrl: "",
  streetAddress: "",
  city: "",
  province: "",
  postalCode: "",
  country: "",
  labourCost: "",
  status: "active",
  team: "",
  role: "Cleaner",
  notes: "",
};

export default function NewCleanerPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    if (!isEditMode) return;

    if (location.state?.cleaner) {
      fillForm(location.state.cleaner);
      setLoading(false);
      return;
    }

    fetchCleanerById();
  }, [id]);

  async function fetchCleanerById() {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/cleaners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cleaner = res.data.cleaner || res.data || {};
      fillForm(cleaner);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to fetch cleaner details");
    } finally {
      setLoading(false);
    }
  }

  function fillForm(cleaner) {
    setForm({
      name: cleaner.name || "",
      email: cleaner.email || "",
      phone: cleaner.phone || "",
      avatarUrl: cleaner.avatarUrl || "",
      streetAddress: cleaner.streetAddress || "",
      city: cleaner.city || "",
      province: cleaner.province || "",
      postalCode: cleaner.postalCode || "",
      country: cleaner.country || "",
      labourCost:
        cleaner.labourCost !== undefined && cleaner.labourCost !== null
          ? String(cleaner.labourCost)
          : "",
      status: cleaner.status || "active",
      team: cleaner.team || "",
      role: cleaner.role || "Cleaner",
      notes: cleaner.notes || "",
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function getInitial(name = "") {
    return name.trim()?.charAt(0)?.toUpperCase() || "•";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Full name is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        avatarUrl: form.avatarUrl.trim(),
        streetAddress: form.streetAddress.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
        labourCost: form.labourCost === "" ? null : Number(form.labourCost),
        status: form.status,
        team: form.team.trim(),
        role: form.role.trim(),
        notes: form.notes.trim(),
      };

      if (isEditMode) {
        await axios.put(`${API}/cleaners/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API}/cleaners`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      navigate("/cleaners");
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to save cleaner");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title={isEditMode ? "Edit Cleaner" : "Add Cleaner"}>
      <div style={styles.page}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.pageTitle}>
              {isEditMode ? "Edit cleaner" : "New cleaner"}
            </h1>
            <p style={styles.pageSubtitle}>
              Add team member details, address information and labour cost for
              scheduling and reporting.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => navigate("/cleaners")}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="cleaner-form"
              style={styles.primaryBtn}
              disabled={saving}
            >
              {saving ? "Saving..." : isEditMode ? "Save Changes" : "Create Cleaner"}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingCard}>Loading cleaner details...</div>
        ) : (
          <form id="cleaner-form" onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.mainCard}>
              <div style={styles.sectionTitle}>Personal info</div>

              <div style={styles.avatarRow}>
                <div style={styles.avatarCircle}>
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="avatar" style={styles.avatarImage} />
                  ) : (
                    <span>{getInitial(form.name)}</span>
                  )}
                </div>

                <div style={styles.uploadWrap}>
                  <button
                    type="button"
                    style={styles.uploadBtn}
                    onClick={() => {
                      const url = window.prompt("Paste image URL", form.avatarUrl || "");
                      if (url !== null) {
                        setForm((prev) => ({
                          ...prev,
                          avatarUrl: url.trim(),
                        }));
                      }
                    }}
                  >
                    Upload Image
                  </button>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.leftCol}>
                  <input
                    style={styles.input}
                    name="name"
                    placeholder="Full name"
                    value={form.name}
                    onChange={handleChange}
                  />
                  <input
                    style={styles.input}
                    name="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={handleChange}
                  />
                  <input
                    style={styles.input}
                    name="phone"
                    placeholder="Mobile phone number"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div style={styles.rightCol}>
                  <input
                    style={styles.input}
                    name="streetAddress"
                    placeholder="Street address"
                    value={form.streetAddress}
                    onChange={handleChange}
                  />
                  <input
                    style={styles.input}
                    name="city"
                    placeholder="City"
                    value={form.city}
                    onChange={handleChange}
                  />
                  <input
                    style={styles.input}
                    name="province"
                    placeholder="Province / State"
                    value={form.province}
                    onChange={handleChange}
                  />
                  <div style={styles.doubleRow}>
                    <input
                      style={styles.input}
                      name="postalCode"
                      placeholder="Postal code"
                      value={form.postalCode}
                      onChange={handleChange}
                    />
                    <input
                      style={styles.input}
                      name="country"
                      placeholder="Country"
                      value={form.country}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.subSection}>
                <div style={styles.labourHeader}>
                  <span style={styles.labourTitle}>Labour cost</span>
                  <span style={styles.helpIcon}>?</span>
                </div>

                <div style={styles.costBox}>
                  <div style={styles.costLabel}>Employee cost</div>
                  <div style={styles.costRow}>
                    <div style={styles.costInputWrap}>
                      <span style={styles.costCurrency}>$</span>
                      <input
                        style={styles.costInput}
                        name="labourCost"
                        placeholder="0.00"
                        value={form.labourCost}
                        onChange={handleChange}
                        type="number"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div style={styles.perHour}>per hour</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.sideStack}>
              <div style={styles.sideCard}>
                <div style={styles.sideSectionTitle}>Work info</div>

                <label style={styles.label}>Status</label>
                <select
                  style={styles.input}
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <label style={styles.label}>Team</label>
                <input
                  style={styles.input}
                  name="team"
                  placeholder="Team name"
                  value={form.team}
                  onChange={handleChange}
                />

                <label style={styles.label}>Role</label>
                <input
                  style={styles.input}
                  name="role"
                  placeholder="Role"
                  value={form.role}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.sideCard}>
                <div style={styles.sideSectionTitle}>Notes</div>
                <textarea
                  style={styles.textarea}
                  name="notes"
                  placeholder="Notes about this cleaner"
                  value={form.notes}
                  onChange={handleChange}
                  rows={8}
                />
              </div>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}

const styles = {
  page: { display: "grid", gap: "24px", paddingBottom: "24px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" },
  pageTitle: { margin: 0, fontSize: "38px", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A" },
  pageSubtitle: { margin: "12px 0 0 0", color: "#475467", fontSize: "18px", lineHeight: 1.5, maxWidth: "760px" },
  headerActions: { display: "flex", gap: "12px", alignItems: "center" },
  primaryBtn: { border: "none", background: "#3B8218", color: "#fff", borderRadius: "12px", padding: "14px 20px", fontWeight: 700, fontSize: "15px", cursor: "pointer" },
  secondaryBtn: { border: "1px solid #D0D5DD", background: "#fff", color: "#344054", borderRadius: "12px", padding: "14px 20px", fontWeight: 700, fontSize: "15px", cursor: "pointer" },
  loadingCard: { background: "#fff", border: "1px solid #D0D5DD", borderRadius: "20px", padding: "28px", color: "#667085", fontSize: "16px" },
  form: { display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(300px, 0.8fr)", gap: "20px", alignItems: "start" },
  mainCard: { background: "#fff", border: "1px solid #D0D5DD", borderRadius: "20px", padding: "24px", boxShadow: "0 2px 8px rgba(16,24,40,0.04)" },
  sectionTitle: { fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: "18px" },
  avatarRow: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px" },
  avatarCircle: { width: "72px", height: "72px", borderRadius: "999px", background: "#163B4D", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, overflow: "hidden", flexShrink: 0 },
  avatarImage: { width: "100%", height: "100%", objectFit: "cover" },
  uploadWrap: { display: "flex", alignItems: "center" },
  uploadBtn: { border: "1px solid #D0D5DD", background: "#fff", color: "#3B8218", borderRadius: "12px", padding: "12px 16px", fontWeight: 700, fontSize: "15px", cursor: "pointer" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px" },
  leftCol: { display: "grid", gap: "14px" },
  rightCol: { display: "grid", gap: "0px" },
  input: { width: "100%", height: "50px", padding: "0 15px", border: "1px solid #D0D5DD", background: "#fff", color: "#101828", borderRadius: "0px", fontSize: "16px", outline: "none", boxSizing: "border-box" },
  doubleRow: { display: "grid", gridTemplateColumns: "1fr 1fr" },
  subSection: { marginTop: "18px" },
  labourHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" },
  labourTitle: { fontSize: "16px", fontWeight: 800, color: "#0F172A" },
  helpIcon: { width: "22px", height: "22px", borderRadius: "999px", border: "1px solid #344054", color: "#344054", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800 },
  costBox: { border: "1px solid #D0D5DD", borderRadius: "12px", width: "300px", padding: "10px 14px" },
  costLabel: { fontSize: "13px", color: "#667085", marginBottom: "4px" },
  costRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" },
  costInputWrap: { display: "flex", alignItems: "center", gap: "0px" },
  costCurrency: { fontSize: "30px", fontWeight: 400, color: "#101828", lineHeight: 1 },
  costInput: { width: "110px", border: "none", outline: "none", fontSize: "30px", color: "#101828", background: "transparent" },
  perHour: { fontSize: "16px", color: "#101828", whiteSpace: "nowrap" },
  sideStack: { display: "grid", gap: "18px" },
  sideCard: { background: "#fff", border: "1px solid #D0D5DD", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 8px rgba(16,24,40,0.04)", display: "grid", gap: "12px" },
  sideSectionTitle: { fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "4px" },
  label: { fontSize: "14px", fontWeight: 700, color: "#344054", marginTop: "2px" },
  textarea: { width: "100%", border: "1px solid #D0D5DD", borderRadius: "12px", padding: "14px 15px", fontSize: "15px", color: "#101828", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", minHeight: "180px" },
};