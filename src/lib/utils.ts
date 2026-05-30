import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined): string {
  if (amount == null) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;

  const sameYear = date.getFullYear() === now.getFullYear();
  const dateLabel = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `${dateLabel}, ${time}`;
}

export function formatDateShort(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function getTotalInventory(inventory: Array<{ quantity: number }> = []): number {
  return inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
}

/** Uppercase label for products, categories, brands, godowns, etc. */
export function formatDisplayLabel(value?: string | null): string {
  if (value == null) return "";
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : "";
}
