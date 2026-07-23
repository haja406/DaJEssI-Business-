import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAr(value: number | null | undefined): string {
  const n = value ?? 0;
  return new Intl.NumberFormat("fr-MG", { maximumFractionDigits: 0 }).format(n) + " Ar";
}

export function formatKg(value: number | null | undefined): string {
  const n = value ?? 0;
  return new Intl.NumberFormat("fr-MG", { maximumFractionDigits: 1 }).format(n) + " kg";
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export function formatPercent(value: number | null | undefined): string {
  const n = value ?? 0;
  return new Intl.NumberFormat("fr-MG", { maximumFractionDigits: 1 }).format(n) + " %";
}

export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}
