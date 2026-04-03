import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;

const DEFAULT_TIMEZONE = "Australia/Melbourne";
const DEFAULT_FIRST_DAY_OF_WEEK = "Monday";
const CACHE_TTL_MS = 60 * 1000;

const CompanyContext = createContext(null);

let bootstrapCache = {
  data: null,
  fetchedAt: 0,
  promise: null,
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeCompany(raw) {
  const company = raw || {};

  return {
    ...company,
    timezone:
      company.timezone ||
      company.timeZone ||
      company.companyTimezone ||
      DEFAULT_TIMEZONE,
    firstDayOfWeek:
      company.firstDayOfWeek ||
      company.weekStartsOn ||
      company.weekStartDay ||
      DEFAULT_FIRST_DAY_OF_WEEK,
  };
}

function extractItems(payload, keys = []) {
  if (!payload) return [];

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload)) return payload;
  return [];
}

async function fetchBootstrapData() {
  const headers = getAuthHeaders();

  const [companyRes, jobsRes, cleanersRes, customersRes] = await Promise.all([
    axios.get(`${API}/company`, { headers }),
    axios.get(`${API}/jobs`, { headers }),
    axios.get(`${API}/cleaners`, { headers }),
    axios.get(`${API}/customers`, { headers }),
  ]);

  return {
    company: normalizeCompany(
      companyRes?.data?.company || companyRes?.data || null
    ),
    jobs: extractItems(jobsRes?.data, ["jobs", "data", "items"]),
    cleaners: extractItems(cleanersRes?.data, ["cleaners", "data", "items"]),
    customers: extractItems(customersRes?.data, ["customers", "data", "items"]),
  };
}

async function getBootstrapData({ force = false } = {}) {
  const isFresh =
    !force &&
    bootstrapCache.data &&
    Date.now() - bootstrapCache.fetchedAt < CACHE_TTL_MS;

  if (isFresh) {
    return bootstrapCache.data;
  }

  if (!force && bootstrapCache.promise) {
    return bootstrapCache.promise;
  }

  bootstrapCache.promise = fetchBootstrapData()
    .then((data) => {
      bootstrapCache.data = data;
      bootstrapCache.fetchedAt = Date.now();
      return data;
    })
    .finally(() => {
      bootstrapCache.promise = null;
    });

  return bootstrapCache.promise;
}

function mergeCompany(currentCompany, incomingCompany) {
  return normalizeCompany({
    ...(currentCompany || {}),
    ...(incomingCompany || {}),
  });
}

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(() => normalizeCompany(null));
  const [jobs, setJobs] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const didInitRef = useRef(false);

  const applyBootstrapData = useCallback((data) => {
    setCompany(normalizeCompany(data?.company));
    setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    setCleaners(Array.isArray(data?.cleaners) ? data.cleaners : []);
    setCustomers(Array.isArray(data?.customers) ? data.customers : []);
  }, []);

  const loadAll = useCallback(async ({ force = false, silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const data = await getBootstrapData({ force });
      applyBootstrapData(data);
      return data;
    } catch (err) {
      console.error("Failed to load company bootstrap data:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load data.");
      throw err;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyBootstrapData]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadAll().catch(() => {});
  }, [loadAll]);

  const refreshAll = useCallback(async () => {
    return loadAll({ force: true, silent: true });
  }, [loadAll]);

  const refreshJobs = useCallback(async ({ force = true } = {}) => {
    try {
      setRefreshing(true);
      const headers = getAuthHeaders();
      const res = await axios.get(`${API}/jobs`, { headers });
      const nextJobs = extractItems(res?.data, ["jobs", "data", "items"]);
      setJobs(nextJobs);

      if (force && bootstrapCache.data) {
        bootstrapCache.data = { ...bootstrapCache.data, jobs: nextJobs };
        bootstrapCache.fetchedAt = Date.now();
      }

      return nextJobs;
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refreshCleaners = useCallback(async ({ force = true } = {}) => {
    try {
      setRefreshing(true);
      const headers = getAuthHeaders();
      const res = await axios.get(`${API}/cleaners`, { headers });
      const nextCleaners = extractItems(res?.data, ["cleaners", "data", "items"]);
      setCleaners(nextCleaners);

      if (force && bootstrapCache.data) {
        bootstrapCache.data = { ...bootstrapCache.data, cleaners: nextCleaners };
        bootstrapCache.fetchedAt = Date.now();
      }

      return nextCleaners;
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refreshCustomers = useCallback(async ({ force = true } = {}) => {
    try {
      setRefreshing(true);
      const headers = getAuthHeaders();
      const res = await axios.get(`${API}/customers`, { headers });
      const nextCustomers = extractItems(res?.data, ["customers", "data", "items"]);
      setCustomers(nextCustomers);

      if (force && bootstrapCache.data) {
        bootstrapCache.data = { ...bootstrapCache.data, customers: nextCustomers };
        bootstrapCache.fetchedAt = Date.now();
      }

      return nextCustomers;
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refreshCompany = useCallback(async ({ force = true } = {}) => {
    try {
      setRefreshing(true);
      const headers = getAuthHeaders();
      const res = await axios.get(`${API}/company`, { headers });
      const nextCompany = normalizeCompany(res?.data?.company || res?.data || null);
      setCompany(nextCompany);

      if (force && bootstrapCache.data) {
        bootstrapCache.data = { ...bootstrapCache.data, company: nextCompany };
        bootstrapCache.fetchedAt = Date.now();
      }

      return nextCompany;
    } finally {
      setRefreshing(false);
    }
  }, []);

  const updateCompanyLocal = useCallback((partialCompany) => {
    setCompany((current) => {
      const next = mergeCompany(current, partialCompany);
      if (bootstrapCache.data) {
        bootstrapCache.data = { ...bootstrapCache.data, company: next };
        bootstrapCache.fetchedAt = Date.now();
      }
      return next;
    });
  }, []);

  const clearCompanyCache = useCallback(() => {
    bootstrapCache = {
      data: null,
      fetchedAt: 0,
      promise: null,
    };
  }, []);

  const value = useMemo(() => {
    return {
      company,
      jobs,
      cleaners,
      customers,
      loading,
      refreshing,
      error,

      timezone: company?.timezone || DEFAULT_TIMEZONE,
      firstDayOfWeek: company?.firstDayOfWeek || DEFAULT_FIRST_DAY_OF_WEEK,

      setJobs,
      setCleaners,
      setCustomers,
      setCompany: updateCompanyLocal,

      loadAll,
      refreshAll,
      refreshJobs,
      refreshCleaners,
      refreshCustomers,
      refreshCompany,
      clearCompanyCache,
    };
  }, [
    company,
    jobs,
    cleaners,
    customers,
    loading,
    refreshing,
    error,
    updateCompanyLocal,
    loadAll,
    refreshAll,
    refreshJobs,
    refreshCleaners,
    refreshCustomers,
    refreshCompany,
    clearCompanyCache,
  ]);

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error("useCompany must be used inside a CompanyProvider");
  }

  return context;
}
