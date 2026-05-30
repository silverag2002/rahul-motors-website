import { AuditLog } from "../types";

export function getAuditLogCategoryName(log: AuditLog): string | undefined {
  if (log.category?.name) return log.category.name;
  return undefined;
}

export function formatSignedQuantity(value?: number | null): string {
  if (value == null) return "—";
  return value > 0 ? `+${value}` : String(value);
}

export function formatQuantityValue(value?: number | null): string {
  if (value == null) return "—";
  return String(value);
}

export function hasQuantityDetails(log: AuditLog): boolean {
  return (
    log.quantityChange != null ||
    log.previousQuantity != null ||
    log.newQuantity != null ||
    log.currentQuantity != null ||
    log.quantity != null
  );
}

export function formatAuditQuantitySummary(log: AuditLog): string {
  const parts: string[] = [];
  const change = log.quantityChange ?? (
    log.action.includes("INCREASED") && log.quantity != null
      ? log.quantity
      : log.action.includes("DECREASED") && log.quantity != null
        ? -log.quantity
        : null
  );
  if (change != null) parts.push(`Change: ${formatSignedQuantity(change)}`);
  if (log.previousQuantity != null) parts.push(`Before: ${log.previousQuantity}`);
  if (log.newQuantity != null) parts.push(`After: ${log.newQuantity}`);
  if (log.currentQuantity != null) parts.push(`Present: ${log.currentQuantity}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}
