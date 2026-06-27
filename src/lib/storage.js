// Persistence helpers. This is the one place that knows about
// localStorage, so swapping in a real backend later (Supabase) only
// means changing this file, not every component that reads/writes data.
const STORAGE_KEY = "reading-tracker-data";

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.genres ? parsed : null;
  } catch {
    return null;
  }
}

export function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* localStorage might be unavailable (e.g. private browsing) - ignore */
  }
}

// Export/import as a text string - a manual backup option, e.g. to move
// your data to a different browser or computer.
export function encodeState(data) {
  try { return btoa(encodeURIComponent(JSON.stringify(data))); }
  catch { return ""; }
}

export function decodeState(str) {
  try { return JSON.parse(decodeURIComponent(atob(str.trim()))); }
  catch { return null; }
}
