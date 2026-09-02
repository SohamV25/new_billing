const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function toFinite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function formatMoney(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return inrFormatter.format(toFinite(amount));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(toFinite(value));
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateShort(value: string | Date): string {
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDateFor(
  value: string | Date,
  options: { timeZone: string; format: string }
): string {
  const date = new Date(value);
  const locale = "en-IN";
  const { timeZone, format: dateFormat } = options;

  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: dateFormat === "YYYY-MM-DD" ? "2-digit" : "short",
    year: "numeric",
    timeZone,
  });

  return formatter.format(date);
}

export function formatDateTimeFor(
  value: string | Date,
  options: { timeZone: string; format: string }
): string {
  const date = new Date(value);
  const locale = "en-IN";
  const { timeZone, format: dateFormat } = options;

  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: dateFormat === "YYYY-MM-DD" ? "2-digit" : "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });

  return formatter.format(date);
}
