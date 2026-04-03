import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import {
  DEFAULT_COMPANY_TIMEZONE,
  DEFAULT_FIRST_DAY_OF_WEEK,
  normalizeFirstDayOfWeek,
  normalizeTimeZone,
} from "../utils/time";

const API = API_BASE_URL;

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    timezone: DEFAULT_COMPANY_TIMEZONE,
    firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
  });

  const refreshCompany = useCallback(async () => {
    if (!token) {
      setSettings({
        timezone: DEFAULT_COMPANY_TIMEZONE,
        firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
      });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/settings/company`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.settings || {};
      setSettings((prev) => ({
        ...prev,
        ...data,
        timezone: normalizeTimeZone(data.timezone, prev.timezone || DEFAULT_COMPANY_TIMEZONE),
        firstDayOfWeek: normalizeFirstDayOfWeek(data.firstDayOfWeek, prev.firstDayOfWeek || DEFAULT_FIRST_DAY_OF_WEEK),
      }));
    } catch (error) {
      console.error("Failed to fetch company settings:", error);
      setSettings((prev) => ({
        ...prev,
        timezone: normalizeTimeZone(prev.timezone || DEFAULT_COMPANY_TIMEZONE),
        firstDayOfWeek: normalizeFirstDayOfWeek(prev.firstDayOfWeek || DEFAULT_FIRST_DAY_OF_WEEK),
      }));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshCompany();
  }, [refreshCompany]);

  const value = useMemo(() => ({
    loading,
    settings,
    timezone: settings.timezone || DEFAULT_COMPANY_TIMEZONE,
    firstDayOfWeek: settings.firstDayOfWeek || DEFAULT_FIRST_DAY_OF_WEEK,
    refreshCompany,
    setCompanySettings: setSettings,
  }), [loading, settings, refreshCompany]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return ctx;
}
