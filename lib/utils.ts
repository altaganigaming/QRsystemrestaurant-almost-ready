import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function money(amount: number, currency = "₹") {
  return `${currency}${Number(amount || 0).toFixed(2).replace(/\.00$/, "")}`;
}

export const STATUS_LABEL: Record<string, string> = {
  new: "New", preparing: "Preparing", ready: "Ready",
  completed: "Completed", cancelled: "Cancelled", closed: "Closed",
};

export function hexToRgbVar(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
