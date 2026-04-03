export const DEFAULT_COMPANY_TIMEZONE = "Asia/Phnom_Penh";
export const DEFAULT_FIRST_DAY_OF_WEEK = "Sunday";

export function normalizeTimeZone(value, fallback = DEFAULT_COMPANY_TIMEZONE) {
  if (!value || typeof value !== "string") return fallback;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value;
  } catch {
    return fallback;
  }
}

export function normalizeFirstDayOfWeek(value) {
  return String(value || "").toLowerCase() === "monday" ? "Monday" : "Sunday";
}

function createFormatter(timeZone, options) {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...options });
}

function isPlainDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function getDateParts(date, timeZone) {
  const parts = createFormatter(timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value || "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

export function getDateKeyInTimeZone(dateInput, timeZone = DEFAULT_COMPANY_TIMEZONE) {
  if (!dateInput) return "";

  const tz = normalizeTimeZone(timeZone);

  if (isPlainDateString(dateInput)) {
    return String(dateInput).slice(0, 10);
  }

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const { year, month, day } = getDateParts(date, tz);

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDateInTimeZone(dateInput, timeZone = DEFAULT_COMPANY_TIMEZONE) {
  return getDateKeyInTimeZone(dateInput, timeZone);
}

export function getTodayDateInputInTimeZone(timeZone = DEFAULT_COMPANY_TIMEZONE) {
  return getDateKeyInTimeZone(new Date(), timeZone);
}

export function getTodayKeyInTimeZone(timeZone = DEFAULT_COMPANY_TIMEZONE) {
  return getDateKeyInTimeZone(new Date(), timeZone);
}

export function formatMonthYearInTimeZone(dateInput, timeZone = DEFAULT_COMPANY_TIMEZONE) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  return createFormatter(timeZone, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateForDisplay(dateInput, timeZone = DEFAULT_COMPANY_TIMEZONE) {
  const key = getDateKeyInTimeZone(dateInput, timeZone);
  if (!key) return "-";

  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));

  return createFormatter(timeZone, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatPrettyDateInTimeZone(dateInput, timeZone = DEFAULT_COMPANY_TIMEZONE) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  return createFormatter(timeZone, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeInTimeZone(dateInput, timeInput, timeZone = DEFAULT_COMPANY_TIMEZONE) {
  const date = formatDateForDisplay(dateInput, timeZone);
  return timeInput ? `${date} · ${timeInput}` : date;
}

export function getHourInTimeZone(timeZone = DEFAULT_COMPANY_TIMEZONE) {
  const hour = createFormatter(timeZone, {
    hour: "2-digit",
    hour12: false,
  }).format(new Date());

  return Number(hour);
}

export function getGreetingByHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function getGreetingInTimeZone(timeZone = DEFAULT_COMPANY_TIMEZONE) {
  return getGreetingByHour(getHourInTimeZone(timeZone));
}

export function sameDayInTimeZone(a, b, timeZone = DEFAULT_COMPANY_TIMEZONE) {
  return getDateKeyInTimeZone(a, timeZone) === getDateKeyInTimeZone(b, timeZone);
}

export function sameMonthInTimeZone(a, b, timeZone = DEFAULT_COMPANY_TIMEZONE) {
  const aKey = getDateKeyInTimeZone(a, timeZone);
  const bKey = getDateKeyInTimeZone(b, timeZone);
  return aKey.slice(0, 7) === bKey.slice(0, 7);
}

export function isSameMonthInTimeZone(dateInput, compareDate = new Date(), timeZone = DEFAULT_COMPANY_TIMEZONE) {
  return sameMonthInTimeZone(dateInput, compareDate, timeZone);
}

export function parseTimeToMinutes(value) {
  if (!value) return 0;

  const [h, m] = String(value).split(":");
  return Number(h) * 60 + Number(m || 0);
}

export function compareJobsBySchedule(a, b, timeZone = DEFAULT_COMPANY_TIMEZONE) {
  const aDate = getDateKeyInTimeZone(a?.serviceDate || a?.createdAt, timeZone);
  const bDate = getDateKeyInTimeZone(b?.serviceDate || b?.createdAt, timeZone);

  if (aDate !== bDate) return aDate.localeCompare(bDate);

  const aTime = parseTimeToMinutes(a?.serviceTime || "");
  const bTime = parseTimeToMinutes(b?.serviceTime || "");

  if (aTime !== bTime) return aTime - bTime;

  return Number(a?.id || 0) - Number(b?.id || 0);
}

export function getWeekdayLabels(firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK) {
  const sun = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const mon = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return normalizeFirstDayOfWeek(firstDayOfWeek) === "Monday" ? mon : sun;
}