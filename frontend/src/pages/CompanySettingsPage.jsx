import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AppLayout from "../components/AppLayout";
import { API_BASE_URL } from "../config";
import { useCompany } from "../context/CompanyContext";

const API = API_BASE_URL;

const TABS = ["Company", "Hours", "Tax", "Regional"];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_HOURS = {
  Sunday: { enabled: false, start: "09:00", end: "17:00" },
  Monday: { enabled: true, start: "09:00", end: "17:00" },
  Tuesday: { enabled: true, start: "09:00", end: "17:00" },
  Wednesday: { enabled: true, start: "09:00", end: "17:00" },
  Thursday: { enabled: true, start: "09:00", end: "17:00" },
  Friday: { enabled: true, start: "09:00", end: "17:00" },
  Saturday: { enabled: false, start: "09:00", end: "17:00" },
};

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde",
  "Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo",
  "Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Democratic Republic of the Congo","Denmark","Djibouti",
  "Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala",
  "Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands",
  "New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau",
  "Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia",
  "Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan",
  "Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga",
  "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen",
  "Zambia","Zimbabwe"
];

function getTimezones() {
  try {
    if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch (error) {
    console.warn("Timezone list fallback used:", error);
  }

  return [
    "UTC",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/New_York",
    "America/Phoenix",
    "America/Sao_Paulo",
    "Asia/Bangkok",
    "Asia/Dubai",
    "Asia/Hong_Kong",
    "Asia/Jakarta",
    "Asia/Kuala_Lumpur",
    "Asia/Phnom_Penh",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Melbourne",
    "Australia/Perth",
    "Australia/Sydney",
    "Europe/Berlin",
    "Europe/London",
    "Europe/Paris",
    "Pacific/Auckland",
  ];
}

export default function CompanySettingsPage() {
  const token = localStorage.getItem("token");
  const { refreshCompany } = useCompany();

  const [activeTab, setActiveTab] = useState("Company");
  const [timezoneQuery, setTimezoneQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    phone: "",
    website: "",
    email: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    showBusinessHours: true,

    taxName: "",
    taxNumber: "",
    taxRate: "",

    country: "Cambodia",
    timezone: "Asia/Phnom_Penh",
    dateFormat: "Jan 31, 2026",
    timeFormat: "24 Hour (13:30)",
    firstDayOfWeek: "Sunday",
  });

  const [businessHours, setBusinessHours] = useState(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const timezoneOptions = useMemo(() => getTimezones(), []);
  const filteredTimezones = useMemo(() => {
    const q = timezoneQuery.trim().toLowerCase();
    if (!q) return timezoneOptions;
    return timezoneOptions.filter((tz) => tz.toLowerCase().includes(q));
  }, [timezoneQuery, timezoneOptions]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [countryQuery]);

  const hasTaxRates = useMemo(() => {
    return Boolean(form.taxName || form.taxNumber || form.taxRate);
  }, [form]);

  useEffect(() => {
    fetchSettings();
  }, []);

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleHourChange(day, field, value) {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  }

  async function fetchSettings() {
    try {
      setLoadingSettings(true);

      const res = await axios.get(`${API}/api/settings/company`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data?.settings;
      if (!data) return;

      setForm({
        companyName: data.companyName || "",
        phone: data.phone || "",
        website: data.website || "",
        email: data.email || "",
        street1: data.street1 || "",
        street2: data.street2 || "",
        city: data.city || "",
        state: data.state || "",
        zipCode: data.zipCode || "",
        showBusinessHours:
          data.showBusinessHours !== undefined ? data.showBusinessHours : true,

        taxName: data.taxName || "",
        taxNumber: data.taxNumber || "",
        taxRate: data.taxRate || "",

        country: data.country || "Cambodia",
        timezone: data.timezone || "Asia/Phnom_Penh",
        dateFormat: data.dateFormat || "Jan 31, 2026",
        timeFormat: data.timeFormat || "24 Hour (13:30)",
        firstDayOfWeek: data.firstDayOfWeek || "Sunday",
      });

      if (data.businessHours) {
        setBusinessHours(data.businessHours);
      }
    } catch (error) {
      console.error("Failed to load company settings:", error);
      alert(error?.response?.data?.error || "Failed to load company settings");
    } finally {
      setLoadingSettings(false);
    }
  }

  async function handleSave() {
    setSaving(true);

    try {
      const payload = {
        ...form,
        businessHours,
      };

      await axios.post(`${API}/api/settings/company`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await refreshCompany();
      alert("✅ Settings saved to database");
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.error || "❌ Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="Company Settings">
      <div style={styles.page}>
        {loadingSettings && (
          <div style={styles.loadingCard}>
            Loading company settings...
          </div>
        )}

        <div style={styles.tabsWrap}>
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  ...styles.tabBtn,
                  ...(isActive ? styles.tabBtnActive : {}),
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <section style={styles.card}>
          {activeTab === "Company" && (
            <>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Company details</h2>
                  <p style={styles.sectionDesc}>
                    Basic company information used across your workspace, client-facing pages,
                    and future booking flows.
                  </p>
                </div>
              </div>

              <div style={styles.compactGrid}>
                <Input
                  label="Company name"
                  value={form.companyName}
                  onChange={(v) => handleChange("companyName", v)}
                />

                <Input
                  label="Phone number"
                  value={form.phone}
                  onChange={(v) => handleChange("phone", v)}
                />

                <div style={styles.fullCol}>
                  <div style={styles.websiteInlineRow}>
                    <div style={{ flex: 1 }}>
                      <Input
                        label="Website URL"
                        value={form.website}
                        onChange={(v) => handleChange("website", v)}
                      />
                    </div>

                    <button type="button" style={styles.generateBtn}>
                      ✨ Generate My Website
                    </button>
                  </div>
                </div>

                <Input
                  label="Email address"
                  value={form.email}
                  onChange={(v) => handleChange("email", v)}
                />

                <div />

                <Input
                  label="Street 1"
                  value={form.street1}
                  onChange={(v) => handleChange("street1", v)}
                />

                <Input
                  label="Street 2"
                  value={form.street2}
                  onChange={(v) => handleChange("street2", v)}
                />

                <Input
                  label="City"
                  value={form.city}
                  onChange={(v) => handleChange("city", v)}
                />

                <Input
                  label="State"
                  value={form.state}
                  onChange={(v) => handleChange("state", v)}
                />

                <Input
                  label="Zip code"
                  value={form.zipCode}
                  onChange={(v) => handleChange("zipCode", v)}
                />

                <div />
              </div>
            </>
          )}

          {activeTab === "Hours" && (
            <>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Business hours</h2>
                  <p style={styles.sectionDesc}>
                    Set your standard working hours for scheduling, online booking,
                    and client-facing availability.
                  </p>
                </div>

                <button type="button" style={styles.inlineEditBtn}>
                  Edit
                </button>
              </div>

              <div style={styles.hoursList}>
                {DAYS.map((day) => {
                  const item = businessHours[day];

                  return (
                    <div key={day} style={styles.hoursRow}>
                      <div style={styles.hoursDay}>{day}</div>

                      <div style={styles.hoursControls}>
                        <label style={styles.checkboxRow}>
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) =>
                              handleHourChange(day, "enabled", e.target.checked)
                            }
                          />
                          <span style={styles.checkboxText}>Open</span>
                        </label>

                        {item.enabled ? (
                          <>
                            <input
                              type="time"
                              value={item.start}
                              onChange={(e) =>
                                handleHourChange(day, "start", e.target.value)
                              }
                              style={styles.timeInput}
                            />
                            <span style={styles.toText}>to</span>
                            <input
                              type="time"
                              value={item.end}
                              onChange={(e) =>
                                handleHourChange(day, "end", e.target.value)
                              }
                              style={styles.timeInput}
                            />
                          </>
                        ) : (
                          <span style={styles.closedText}>Closed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.toggleRow}>
                <div>
                  <div style={styles.toggleLabel}>Show business hours</div>
                  <div style={styles.toggleDesc}>
                    Display your business hours on client hub.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleChange("showBusinessHours", !form.showBusinessHours)
                  }
                  style={{
                    ...styles.switch,
                    justifyContent: form.showBusinessHours ? "flex-end" : "flex-start",
                    background: form.showBusinessHours ? "#0f4c5c" : "#cbd5e1",
                  }}
                >
                  <span style={styles.switchKnob} />
                </button>
              </div>
            </>
          )}

          {activeTab === "Tax" && (
            <>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Tax settings</h2>
                  <p style={styles.sectionDesc}>
                    Manage tax identifiers and tax rates used for invoices and future quotes.
                  </p>
                </div>

                <div style={styles.taxActions}>
                  <button type="button" style={styles.linkBtn}>
                    + Create Tax Group
                  </button>
                  <button type="button" style={styles.smallPrimaryBtn}>
                    + Create Tax Rate
                  </button>
                </div>
              </div>

              <div style={styles.twoCol}>
                <Input
                  label="Tax ID name (ex. GST)"
                  value={form.taxName}
                  onChange={(v) => handleChange("taxName", v)}
                />
                <Input
                  label="Tax ID number"
                  value={form.taxNumber}
                  onChange={(v) => handleChange("taxNumber", v)}
                />
              </div>

              <div style={{ marginTop: 14, maxWidth: 360 }}>
                <Input
                  label="Tax rate (%)"
                  value={form.taxRate}
                  onChange={(v) => handleChange("taxRate", v)}
                />
              </div>

              <p style={{ ...styles.muted, marginTop: 10 }}>
                Tax ID name and number will appear on invoices.
              </p>

              <div style={styles.divider} />

              {!hasTaxRates ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>%</div>
                  <div>
                    <div style={styles.emptyTitle}>No tax rates</div>
                    <div style={styles.emptyText}>
                      Create one or more tax rates to apply them to quotes and invoices.
                    </div>
                    <button type="button" style={{ ...styles.smallPrimaryBtn, marginTop: 14 }}>
                      + Create Tax Rate
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.taxPreview}>
                  <div style={styles.previewLabel}>Current tax setup</div>
                  <div style={styles.previewValue}>
                    {form.taxName || "Tax"} {form.taxNumber ? `• ${form.taxNumber}` : ""}
                    {form.taxRate ? ` • ${form.taxRate}%` : ""}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "Regional" && (
            <>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Regional settings</h2>
                  <p style={styles.sectionDesc}>
                    Configure locale behavior, timezone, date formatting, and calendar defaults.
                  </p>
                </div>
              </div>

              <div style={styles.formStack}>
                <div style={styles.fieldWrap}>
                  <label style={styles.label}>Search country</label>
                  <input
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder="Type to filter countries"
                    style={styles.input}
                  />
                </div>

                <Select
                  label="Country"
                  value={form.country}
                  onChange={(v) => handleChange("country", v)}
                  options={filteredCountries}
                />

                <div style={styles.fieldWrap}>
                  <label style={styles.label}>Search timezone</label>
                  <input
                    value={timezoneQuery}
                    onChange={(e) => setTimezoneQuery(e.target.value)}
                    placeholder="Type to filter timezones"
                    style={styles.input}
                  />
                </div>

                <Select
                  label={`Timezone (${filteredTimezones.length})`}
                  value={form.timezone}
                  onChange={(v) => handleChange("timezone", v)}
                  options={filteredTimezones}
                />

                <div style={styles.twoCol}>
                  <Select
                    label="Date format"
                    value={form.dateFormat}
                    onChange={(v) => handleChange("dateFormat", v)}
                    options={["Jan 31, 2026", "31 Jan 2026", "2026-01-31", "31/01/2026"]}
                  />

                  <Select
                    label="Time format"
                    value={form.timeFormat}
                    onChange={(v) => handleChange("timeFormat", v)}
                    options={["24 Hour (13:30)", "12 Hour (1:30 PM)"]}
                  />
                </div>

                <div style={{ maxWidth: 280 }}>
                  <Select
                    label="First day of week"
                    value={form.firstDayOfWeek}
                    onChange={(v) => handleChange("firstDayOfWeek", v)}
                    options={["Sunday", "Monday"]}
                  />
                </div>
              </div>
            </>
          )}
        </section>

        <div style={styles.footerActions}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              ...styles.saveBtn,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Updating..." : "Update Settings"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.input}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  loadingCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px 20px",
    color: "#475569",
    fontWeight: 600,
  },

  tabsWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  tabBtn: {
    height: "40px",
    padding: "0 16px",
    borderRadius: "999px",
    border: "1px solid #dbe2ea",
    background: "#ffffff",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
  },

  tabBtnActive: {
    background: "#0f172a",
    color: "#ffffff",
    border: "1px solid #0f172a",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "22px",
    padding: "22px",
    boxSizing: "border-box",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  sectionTitle: {
    margin: 0,
    marginBottom: "6px",
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },

  sectionDesc: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
    maxWidth: "780px",
  },

  muted: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  formStack: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  compactGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 14px",
    alignItems: "end",
  },

  fullCol: {
    gridColumn: "1 / -1",
  },

  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
  },

  input: {
    width: "100%",
    height: "42px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid #dbe2ea",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },

  websiteInlineRow: {
    display: "flex",
    alignItems: "end",
    gap: "12px",
  },

  generateBtn: {
    height: "42px",
    padding: "0 16px",
    borderRadius: "12px",
    border: "1px solid #dbeafe",
    background: "#f8fbff",
    color: "#0284c7",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  divider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "24px 0",
  },

  inlineEditBtn: {
    background: "transparent",
    border: "none",
    color: "#16a34a",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    marginTop: "2px",
  },

  hoursList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  hoursRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    alignItems: "center",
    gap: "16px",
    padding: "9px 0",
    borderBottom: "1px solid #f1f5f9",
  },

  hoursDay: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#334155",
  },

  hoursControls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginRight: "8px",
    color: "#475569",
    fontSize: "14px",
  },

  checkboxText: {
    fontSize: "14px",
    color: "#475569",
  },

  timeInput: {
    height: "36px",
    padding: "0 10px",
    borderRadius: "10px",
    border: "1px solid #dbe2ea",
    background: "#fff",
    color: "#0f172a",
    fontSize: "14px",
  },

  toText: {
    color: "#64748b",
    fontSize: "14px",
  },

  closedText: {
    color: "#64748b",
    fontWeight: 600,
    fontSize: "14px",
  },

  toggleRow: {
    marginTop: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },

  toggleLabel: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "6px",
  },

  toggleDesc: {
    fontSize: "14px",
    color: "#64748b",
  },

  switch: {
    width: "54px",
    height: "30px",
    borderRadius: "999px",
    border: "none",
    display: "flex",
    alignItems: "center",
    padding: "4px",
    cursor: "pointer",
    transition: "all 0.18s ease",
  },

  switchKnob: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#ffffff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
  },

  taxActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  linkBtn: {
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },

  smallPrimaryBtn: {
    height: "38px",
    padding: "0 14px",
    borderRadius: "10px",
    border: "1px solid #cce7d2",
    background: "#f7fff7",
    color: "#2f8f2f",
    fontWeight: 700,
    cursor: "pointer",
  },

  emptyState: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "#ffffff",
    borderRadius: "14px",
    padding: "8px 0 0 0",
  },

  emptyIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#f3f4f6",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "18px",
    flexShrink: 0,
  },

  emptyTitle: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "4px",
  },

  emptyText: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  taxPreview: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
  },

  previewLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "6px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  previewValue: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
  },

  footerActions: {
    display: "flex",
    justifyContent: "flex-end",
    paddingBottom: "8px",
  },

  saveBtn: {
    minWidth: "170px",
    height: "46px",
    border: "none",
    borderRadius: "12px",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "14px",
  },
};