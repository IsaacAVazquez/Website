import { addReceiptVisit, parseReceipt, RECEIPT_KEY, type VisitEntry } from "./siteDiscoveries";

let memory: VisitEntry[] = [];
let lastPath: string | null = null;
let storageBlocked = false;

export function readVisits(): VisitEntry[] {
  if (storageBlocked) return memory;
  try {
    const stored = window.sessionStorage.getItem(RECEIPT_KEY);
    memory = parseReceipt(stored);
  } catch { storageBlocked = true; }
  return memory;
}

export function clearVisits() {
  memory = [];
  try { window.sessionStorage.removeItem(RECEIPT_KEY); storageBlocked = false; } catch { storageBlocked = true; }
}

export function recordVisit(pathname: string) {
  if (pathname === lastPath) return;
  lastPath = pathname;
  memory = addReceiptVisit(readVisits(), pathname);
  if (storageBlocked) return;
  try { window.sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(memory)); } catch { storageBlocked = true; }
}
