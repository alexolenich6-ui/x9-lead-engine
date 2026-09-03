import type { LeadRecord } from "./lead-record";

const STORAGE_KEY = "x9-lead-engine:records";

export function loadRecords(): LeadRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LeadRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveRecord(record: LeadRecord): LeadRecord[] {
  const next = [record, ...loadRecords().filter((r) => r.id !== record.id)];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage full/unavailable — history just won't persist across reloads
  }
  return next;
}
